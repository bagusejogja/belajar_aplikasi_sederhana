const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    let targetDate = new Date("2026-07-13T12:45:44.775041+00:00");
    // Set to end of day
    targetDate.setUTCHours(23, 59, 59, 999);
    
    const { data: allAnalisis, error: errAnalisis } = await supabase
      .from('app_analisis_utama')
      .select('id_analisis, unit_pengirim, created_at')
      .lte('created_at', targetDate.toISOString())
      .order('created_at', { ascending: false });
      
    console.log("allAnalisis:", allAnalisis.length);
}
run();
