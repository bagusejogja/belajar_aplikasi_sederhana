const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data } = await supabase.from('data_penerimaan').select('tipe_data');
    const set = new Set(data.map(d => d.tipe_data));
    console.log(Array.from(set));
}
run();
