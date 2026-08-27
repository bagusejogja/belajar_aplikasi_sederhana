const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNum() {
  const dataToSave = {
     no_surat: "TEST-UTAMA-002",
     tanggal_surat: null,
     perihal: "test",
     unit_pengirim: "test",
     total_anggaran: "123",
     file_lampiran: "test",
     link_lampiran: "test",
     analisis_html: "{}",
     keputusan: "ditolak"
  };
  const { data, error } = await supabase.from('app_analisis_utama').insert([dataToSave]);
  console.log("app_analisis_utama Error:", error);
  if (!error) {
     await supabase.from('app_analisis_utama').delete().eq('no_surat', 'TEST-UTAMA-002');
  }
}

testNum();
