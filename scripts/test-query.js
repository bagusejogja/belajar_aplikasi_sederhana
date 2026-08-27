const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testQuery() {
  const { data, error } = await supabase
    .from('tambah_pagu')
    .select('*, gov_units(nama_unit)')
    .order('created_time', { ascending: false });
  
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Query Result for Tambah Pagu:', data.slice(0, 3));
  }
}

testQuery();
