const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVals() {
  const { data, error } = await supabase.from('tambah_pagu').select('jenis_tambah_pagu');
  if (data) {
     const vals = new Set(data.map(d => d.jenis_tambah_pagu));
     console.log('Distinct values in DB:', Array.from(vals));
  }
}

checkVals();
