const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dataTambahPagu = {
     no_surat_pengajuan: 'TEST-' + Date.now(),
     tanggal_surat_pengajuan: '2026-08-15',
     hal_surat_pengajuan: 'Test',
     unit_id: 1,
     tahun_anggaran: 2026,
     nominal_diajukan: 0,
     jenis_tambah_pagu: 'Penugasan',
     status_pengajuan: 'Diajukan',
     nominal_tanggapan: 0,
     file_surat_pengajuan: '',
     file_surat_tanggapan: '',
     is_active: 1,
     created_time: new Date().toISOString()
  };

  console.log("Inserting test data:", dataTambahPagu);
  const { data, error } = await supabase.from('tambah_pagu').insert([dataTambahPagu]);
  if (error) {
    console.log("DB ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}

run();
