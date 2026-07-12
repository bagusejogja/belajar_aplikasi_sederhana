import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLES_TO_BACKUP = [
  'bank_transactions',
  'pengajuan_transfer',
  'pengajuan_transfer_foto',
  'app_analisis_utama',
  'app_analisis_detail',
  'app_arsip_kegiatan',
  'app_timeline',
  'app_laporan_statis',
  'ref_akun',
  'integrasi_bank_transfer',
  'kode_sistem_masjid',
  'master_rekening',
  'app_users',
  'app_role_menus'
];

export async function GET() {
  try {
    const workbook = xlsx.utils.book_new();

    for (const table of TABLES_TO_BACKUP) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.warn(`Could not fetch table ${table}: ${error.message}`);
        continue;
      }
      
      const worksheet = xlsx.utils.json_to_sheet(data || []);
      xlsx.utils.book_append_sheet(workbook, worksheet, table.substring(0, 31)); // sheet names max 31 chars
    }

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="backup_database_${new Date().toISOString().split('T')[0]}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
