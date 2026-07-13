import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLES_TO_BACKUP = [
  'app_settings',
  'gov_units',
  'gov_pagu_anggaran',
  'gov_realisasi_anggaran',
  'app_pagu_historis',
  'app_analisis_utama',
  'app_analisis_detail',
  'app_detail_realisasi',
  'mak_submissions',
  'form_submissions',
  'gov_anggaran_pegawai',
  'pengajuan_transfer',
  'pengajuan_transfer_foto',
  'app_arsip_kategori',
  'app_arsip_kegiatan',
  'bank_transactions',
  'ref_akun',
  'transactions',
  'ref_rekening',
  'gov_accounts',
  'gov_transactions',
  'ref_mapping_unit',
  'gov_name_mappings',
  'ref_jenis_belanja',
  'ref_personel',
  'master_rekening',
  'app_laporan_akun',
  'app_laporan_statis',
  'app_users',
  'app_role_menus',
  'ref_bank',
  'surat_revisi',
  'tambah_pagu',
  'receipts',
  'app_timeline',
  'ref_pic',
  'units',
  'data_penerimaan',
  'jenis_penerimaan',
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

export async function GET() {
  try {
    let sqlDump = `-- Backup Database Supabase (Apps Bersama)\n-- Waktu Backup: ${new Date().toISOString()}\n\n`;

    // 1. Tambahkan Struktur (DDL) dari file .sql yang ada di root jika memungkinkan
    try {
      const rootDir = process.cwd();
      const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.sql'));
      if (files.length > 0) {
        sqlDump += `-- ==========================================\n`;
        sqlDump += `-- STRUKTUR TABEL (DDL SCHEMA)\n`;
        sqlDump += `-- ==========================================\n\n`;
        for (const file of files) {
          const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
          sqlDump += `-- Dari file: ${file}\n`;
          sqlDump += content + '\n\n';
        }
      }
    } catch (err) {
      console.warn('Gagal membaca struktur SQL lokal:', err);
    }

    sqlDump += `-- ==========================================\n`;
    sqlDump += `-- DATA TABEL (INSERT INTO)\n`;
    sqlDump += `-- ==========================================\n\n`;

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
      
      if (allData.length === 0) continue;

      sqlDump += `-- ==========================================\n`;
      sqlDump += `-- Data for table: ${table} (${allData.length} rows)\n`;
      sqlDump += `-- ==========================================\n`;

      const columns = Object.keys(allData[0]);
      const columnsStr = columns.map(c => `"${c}"`).join(', ');
      
      for (const row of allData) {
        const valuesStr = columns.map(c => formatSqlValue(row[c])).join(', ');
        sqlDump += `INSERT INTO public."${table}" (${columnsStr}) VALUES (${valuesStr});\n`;
      }
      sqlDump += '\n';
    }

    return new NextResponse(sqlDump, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="backup_database_${new Date().toISOString().split('T')[0]}.sql"`,
        'Content-Type': 'application/sql',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
