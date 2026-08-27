const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config({ path: '.env' });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data } = await supabase
    .from('app_analisis_utama')
    .select('id_analisis, no_surat, analisis_html, ringkasan_ai')
    .order('created_at', { ascending: false })
    .limit(3);
  
  data.forEach((r, i) => {
    console.log(`\nRow ${i}: id_analisis=${r.id_analisis}, no_surat=${r.no_surat}`);
    console.log("ringkasan_ai:", r.ringkasan_ai);
    console.log("analisis_html length:", r.analisis_html ? r.analisis_html.length : 0);
    if (r.analisis_html) {
      console.log("analisis_html preview:", r.analisis_html.substring(0, 200));
    }
  });
}

check();
