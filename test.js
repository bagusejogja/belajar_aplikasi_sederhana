const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase.from('app_analisis_utama').select('id_analisis, unit_pengirim, created_at');
    console.log(data);
    
    const latestIds = data.map(d => d.id_analisis);
    
    const { data: hData, error: hError } = await supabase.from('app_pagu_historis').select('*').in('id_analisis', latestIds).eq('tahun', '2026');
    console.log(hData);
}
run();
