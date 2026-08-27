const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function del() {
  await supabase.from('tambah_pagu').delete().eq('no_surat_pengajuan', 'MANUAL-001/TEST/2026');
  await supabase.from('app_analisis_utama').delete().eq('no_surat', 'MANUAL-001/TEST/2026');
  console.log('Deleted dummy records.');
}
del();
