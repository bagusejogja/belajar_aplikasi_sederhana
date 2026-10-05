const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env'));
const url = env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/^["']|["']$/g, '');
const key = (env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY).trim().replace(/^["']|["']$/g, '');

const supabase = createClient(url, key);

async function main() {
  const { count: cPeng } = await supabase.from('rkat_pengeluaran').select('*', { count: 'exact', head: true });
  const { count: cPen } = await supabase.from('rkat_penerimaan').select('*', { count: 'exact', head: true });
  const { count: cRules } = await supabase.from('rka_rules').select('*', { count: 'exact', head: true });
  
  // Sample classification in pengeluaran
  const { count: cKemen } = await supabase.from('rkat_pengeluaran').select('*', { count: 'exact', head: true }).not('laporan_kementerian', 'is', null);
  const { count: cProposal } = await supabase.from('rkat_pengeluaran').select('*', { count: 'exact', head: true }).not('identifikasi_lain', 'is', null);

  console.log({
    total_pengeluaran: cPeng,
    pengeluaran_terklasifikasi_kementerian: cKemen,
    pengeluaran_terklasifikasi_proposal: cProposal,
    total_penerimaan: cPen,
    total_rules: cRules
  });
}

main();
