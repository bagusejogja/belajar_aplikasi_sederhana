const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkColumns() {
  // Let's run a query to check column types of app_analisis_utama
  const { data, error } = await supabase
    .from('app_analisis_utama')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Columns & data type inspection:");
    if (data && data[0]) {
      Object.keys(data[0]).forEach(k => {
        console.log(`${k}: type is ${typeof data[0][k]} (value: ${data[0][k]})`);
      });
    }
  }
}

checkColumns();
