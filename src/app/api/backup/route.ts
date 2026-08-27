import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Comprehensive list of ALL tables in the database
const TABLES_TO_BACKUP = [
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
  'integrasi_bank_transfer'
];

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'sql';
    const timestamp = new Date().toISOString();
    const dateSlug = timestamp.split('T')[0];

    // JSON Dump format option
    if (format === 'json') {
      const backupData: Record<string, any[]> = {};
      for (const table of TABLES_TO_BACKUP) {
        let allData: any[] = [];
        let start = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase.from(table).select('*').range(start, start + limit - 1);
          if (error) {
            console.warn(`Could not fetch table ${table}: ${error.message}`);
            break;
          }
          if (!data || data.length === 0) {
            hasMore = false;
          } else {
            allData = allData.concat(data);
            if (data.length < limit) {
              hasMore = false;
            } else {
              start += limit;
            }
          }
        }
        backupData[table] = allData;
      }

      return new NextResponse(JSON.stringify({
        meta: {
          timestamp,
          total_tables: Object.keys(backupData).length,
          tables: Object.keys(backupData)
        },
        data: backupData
      }, null, 2), {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="backup_full_${dateSlug}.json"`,
          'Content-Type': 'application/json',
        }
      });
    }

    // Default: SQL Dump format
    let sqlDump = `-- ========================================================\n`;
    sqlDump += `-- BACKUP FULL DATABASE SUPABASE / POSTGRESQL\n`;
    sqlDump += `-- Waktu Backup: ${timestamp}\n`;
    sqlDump += `-- Total Tabel Terdaftar: ${TABLES_TO_BACKUP.length}\n`;
    sqlDump += `-- ========================================================\n\n`;

    // 1. Tambahkan Struktur (DDL) dari file .sql di root workspace
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
          } catch (e) {
            // ignore individual file read error
          }
        }
      }
    } catch (err) {
      console.warn('Gagal membaca struktur SQL lokal:', err);
    }

    sqlDump += `-- ==========================================\n`;
    sqlDump += `-- DATA TABEL (INSERT INTO STATEMENTS)\n`;
    sqlDump += `-- ==========================================\n\n`;

    let totalExportedRows = 0;

    for (const table of TABLES_TO_BACKUP) {
      let allData: any[] = [];
      let start = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase.from(table).select('*').range(start, start + limit - 1);
        if (error) {
          // Table might not exist or empty
          break;
        }
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allData = allData.concat(data);
          if (data.length < limit) {
             hasMore = false;
          } else {
             start += limit;
          }
        }
      }
      
      if (allData.length === 0) continue;

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

    return new NextResponse(sqlDump, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="backup_database_full_${dateSlug}.sql"`,
        'Content-Type': 'application/sql',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
