const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data } = await supabase.from('gov_pagu_anggaran').select('jenis_anggaran');
    const set = new Set(data.map(d => d.jenis_anggaran));
    console.log("jenis_anggaran:", Array.from(set));
}
run();
