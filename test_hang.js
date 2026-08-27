const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Starting insert...");
  const { data, error } = await supabase.from('app_analisis_utama').insert([{ no_surat: "HANG-TEST" }]);
  console.log("Done insert. Error:", error);
}

testInsert();
