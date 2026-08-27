const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecent() {
  const { data, error } = await supabase.from('tambah_pagu').select('id, no_surat_pengajuan').order('id', { ascending: false }).limit(5);
  console.log("Recent tambah_pagu by ID:", data);
}

checkRecent();
