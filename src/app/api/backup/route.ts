import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  S3Client, 
  PutObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // allow up to 5 mins for large DB backups

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'lampiran-aplikasi';
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';

// Comprehensive baseline list of tables in the database
const BASELINE_TABLES = [
  'app_settings',
  'app_users',
  'app_role_menus',
  'gov_units',
  'units',
  'gov_pagu_anggaran',
  'gov_realisasi_anggaran',
  'app_pagu_historis',
  'gov_accounts',
  'gov_transactions',
  'gov_anggaran_pegawai',
  'gov_name_mappings',
  'app_analisis_utama',
  'app_analisis_detail',
  'app_detail_realisasi',
  'app_laporan_akun',
  'app_laporan_statis',
  'app_arsip_kategori',
  'app_arsip_kegiatan',
  'app_timeline',
  'tambah_pagu',
  'surat_revisi',
  'form_submissions',
  'mak_submissions',
  'pengajuan_transfer',
  'pengajuan_transfer_foto',
  'bank_transactions',
  'transactions',
  'master_rekening',
  'ref_rekening',
  'ref_bank',
  'ref_akun',
  'ref_mapping_unit',
  'ref_jenis_belanja',
  'ref_personel',
  'ref_pic',
  'data_penerimaan',
  'jenis_penerimaan',
  'receipts',
  'kode_sistem_masjid',
  'integrasi_bank_transfer',
  'budgets',
  'rules'
];

async function getDynamicTables(): Promise<string[]> {
  const discovered = new Set<string>(BASELINE_TABLES);

  // 1. Direct PG query if DB connection string is available in environment
  const pgUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (pgUrl) {
    try {
      // @ts-ignore
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: pgUrl, connectionTimeoutMillis: 4000 });
      const client = await pool.connect();
      try {
        const res = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
          ORDER BY table_name ASC
        `);
        res.rows.forEach(r => {
          if (r.table_name && !r.table_name.startsWith('_')) {
            discovered.add(r.table_name);
          }
        });
      } finally {
        client.release();
        await pool.end();
      }
    } catch (e) {
      // Fallback silently if direct PG is unconfigured or blocked
    }
  }

  // 2. Discover from local DDL files in repo workspace
  try {
    const rootDir = process.cwd();
    const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.sql'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
        const matches = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?([a-zA-Z0-9_]+)["']?/gi);
        for (const match of matches) {
          if (match[1] && !match[1].startsWith('_')) {
            discovered.add(match[1]);
          }
        }
      } catch (e) {}
    }
  } catch (e) {}

  return Array.from(discovered);
}

function formatSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'object') {
    const jsonStr = JSON.stringify(val).replace(/'/g, "''");
    return `'${jsonStr}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Generate the complete SQL or JSON dump
async function generateBackupContent(format: 'sql' | 'json' = 'sql') {
  const timestamp = new Date().toISOString();
  const dateSlug = timestamp.replace(/[:.]/g, '-');
  const targetTables = await getDynamicTables();

  if (format === 'json') {
    const backupData: Record<string, any[]> = {};
    let totalExportedRows = 0;

    for (const table of targetTables) {
      let allData: any[] = [];
      let start = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase.from(table).select('*').range(start, start + limit - 1);
        if (error || !data || data.length === 0) {
          hasMore = false;
        } else {
          allData = allData.concat(data);
          if (data.length < limit) hasMore = false;
          else start += limit;
        }
      }
      backupData[table] = allData;
      totalExportedRows += allData.length;
    }

    const jsonString = JSON.stringify({
      meta: {
        timestamp,
        total_tables: Object.keys(backupData).length,
        total_rows: totalExportedRows,
        tables: Object.keys(backupData)
      },
      data: backupData
    }, null, 2);

    return {
      content: jsonString,
      contentType: 'application/json',
      filename: `backup_database_${dateSlug}.json`,
      totalRows: totalExportedRows,
      tablesCount: Object.keys(backupData).length,
      timestamp
    };
  }

  // SQL Format
  let sqlDump = `-- ========================================================\n`;
  sqlDump += `-- BACKUP FULL DATABASE SUPABASE / POSTGRESQL\n`;
  sqlDump += `-- Waktu Backup: ${timestamp}\n`;
  sqlDump += `-- Total Tabel Terdaftar: ${targetTables.length}\n`;
  sqlDump += `-- ========================================================\n\n`;

  // Include local DDL files if present
  try {
    const rootDir = process.cwd();
    const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.sql'));
    if (files.length > 0) {
      sqlDump += `-- ==========================================\n`;
      sqlDump += `-- STRUKTUR TABEL & SKEMA (DDL DARI REPO)\n`;
      sqlDump += `-- ==========================================\n\n`;
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
          sqlDump += `-- [File: ${file}]\n`;
          sqlDump += content + '\n\n';
        } catch (e) {}
      }
    }
  } catch (err) {}

  sqlDump += `-- ==========================================\n`;
  sqlDump += `-- DATA TABEL (INSERT INTO STATEMENTS)\n`;
  sqlDump += `-- ==========================================\n\n`;

  let totalExportedRows = 0;
  let populatedTablesCount = 0;

  for (const table of targetTables) {
    let allData: any[] = [];
    let start = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.from(table).select('*').range(start, start + limit - 1);
      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        if (data.length < limit) hasMore = false;
        else start += limit;
      }
    }

    if (allData.length === 0) continue;

    populatedTablesCount++;
    totalExportedRows += allData.length;
    sqlDump += `-- ------------------------------------------\n`;
    sqlDump += `-- Tabel: public."${table}" (${allData.length} baris)\n`;
    sqlDump += `-- ------------------------------------------\n`;

    const columns = Object.keys(allData[0]);
    const columnsStr = columns.map(c => `"${c}"`).join(', ');

    for (const row of allData) {
      const valuesStr = columns.map(c => formatSqlValue(row[c])).join(', ');
      sqlDump += `INSERT INTO public."${table}" (${columnsStr}) VALUES (${valuesStr});\n`;
    }
    sqlDump += '\n';
  }

  sqlDump += `-- ========================================================\n`;
  sqlDump += `-- SELESAI: Total ${totalExportedRows} baris data berhasil diexport.\n`;
  sqlDump += `-- ========================================================\n`;

  return {
    content: sqlDump,
    contentType: 'application/sql',
    filename: `backup_database_${dateSlug}.sql`,
    totalRows: totalExportedRows,
    tablesCount: populatedTablesCount,
    timestamp
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const format = (searchParams.get('format') || 'sql') as 'sql' | 'json';

    // 1. Action: List backups stored in Cloudflare R2
    if (action === 'list') {
      try {
        const command = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: 'backups/',
        });
        const r2Response = await r2.send(command);

        const files = (r2Response.Contents || [])
          .filter(obj => obj.Key && obj.Key !== 'backups/')
          .map(obj => {
            const key = obj.Key!;
            const filename = key.replace('backups/', '');
            return {
              key,
              filename,
              size: obj.Size || 0,
              lastModified: obj.LastModified ? obj.LastModified.toISOString() : new Date().toISOString(),
              url: `${PUBLIC_DOMAIN}/${key}`,
              format: filename.endsWith('.json') ? 'json' : 'sql'
            };
          })
          .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

        const dynamicTables = await getDynamicTables();

        return NextResponse.json({
          success: true,
          total: files.length,
          files,
          bucket: BUCKET_NAME,
          totalTablesAvailable: dynamicTables.length
        });
      } catch (r2Err: any) {
        console.error("Cloudflare R2 List Error:", r2Err);
        const dynamicTables = await getDynamicTables();
        return NextResponse.json({
          success: false,
          error: `Gagal membaca storage Cloudflare R2: ${r2Err.message}`,
          files: [],
          totalTablesAvailable: dynamicTables.length
        });
      }
    }

    // 2. Default: Direct browser download
    const dump = await generateBackupContent(format);

    return new NextResponse(dump.content, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${dump.filename}"`,
        'Content-Type': dump.contentType,
      },
    });
  } catch (error: any) {
    console.error("Backup API GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Trigger backup and upload directly to Cloudflare R2 Storage
export async function POST(request: NextRequest) {
  try {
    let format: 'sql' | 'json' = 'sql';
    try {
      const body = await request.json();
      if (body?.format === 'json') format = 'json';
    } catch (e) {}

    const dump = await generateBackupContent(format);
    const key = `backups/${dump.filename}`;
    const buffer = Buffer.from(dump.content, 'utf8');

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: dump.contentType,
    }));

    const publicUrl = `${PUBLIC_DOMAIN}/${key}`;

    return NextResponse.json({
      success: true,
      message: `Database berhasil dicadangkan dan diunggah ke Cloudflare R2 Storage!`,
      file: {
        key,
        filename: dump.filename,
        size: buffer.length,
        url: publicUrl,
        format,
        totalRows: dump.totalRows,
        tablesCount: dump.tablesCount,
        timestamp: dump.timestamp
      }
    });
  } catch (error: any) {
    console.error("Backup API POST Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: `Gagal mencadangkan ke Cloudflare R2: ${error.message}` 
    }, { status: 500 });
  }
}

// DELETE: Delete a backup file from Cloudflare R2
export async function DELETE(request: NextRequest) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ success: false, error: 'Parameter "key" file backup wajib diisi.' }, { status: 400 });
    }

    await r2.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));

    return NextResponse.json({
      success: true,
      message: `File backup ${key} berhasil dihapus dari Cloudflare R2 Storage.`
    });
  } catch (error: any) {
    console.error("Backup API DELETE Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: `Gagal menghapus file dari Cloudflare R2: ${error.message}` 
    }, { status: 500 });
  }
}
