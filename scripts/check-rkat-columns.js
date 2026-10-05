const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env'));
const url = env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/^["']|["']$/g, '');
const key = (env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY).trim().replace(/^["']|["']$/g, '');

const supabase = createClient(url, key);

async function checkColumns() {
  const { data: p } = await supabase.from('rkat_pengeluaran').select('*').limit(1);
  if (p && p[0]) {
    console.log('rkat_pengeluaran existing columns:', Object.keys(p[0]));
  }
}

checkColumns();
