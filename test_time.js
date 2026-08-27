const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTime() {
  const { data } = await supabase.from('tambah_pagu').select('id, created_time').not('created_time', 'is', null).limit(5);
  console.log(data);
}
checkTime();
