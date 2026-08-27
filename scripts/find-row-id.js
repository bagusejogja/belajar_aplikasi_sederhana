const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('tambah_pagu')
    .select('id, no_surat_pengajuan, nominal_diajukan, nominal_tanggapan, hal_surat_pengajuan')
    .eq('no_surat_pengajuan', '9251/UN1.P4/Dit-Keu/KU.00.01/2026');
  
  if (error) {
    console.error("Query error:", error);
  } else {
    console.log("Matching rows by no_surat:", data);
  }

  // Also search by nominal_diajukan = 123 just in case
  const { data: data2 } = await supabase
    .from('tambah_pagu')
    .select('id, no_surat_pengajuan, nominal_diajukan, nominal_tanggapan, hal_surat_pengajuan')
    .eq('nominal_diajukan', 123);
  
  console.log("Matching rows by nominal 123:", data2);
}

check();
