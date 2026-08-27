const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase
    .from('app_analisis_detail')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error("Detail schema error:", error);
  } else {
    console.log("Detail schema columns:", data);
  }
}

checkSchema();
