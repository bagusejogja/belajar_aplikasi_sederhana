const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env'));
const url = env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/^["']|["']$/g, '');
const key = (env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY).trim().replace(/^["']|["']$/g, '');

const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase.from('rka_rules').select('*').eq('modul', 'penerimaan');
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Total penerimaan rules:', data.length);
  const targetCounts = {};
  data.forEach(r => {
    targetCounts[r.target_field] = (targetCounts[r.target_field] || 0) + 1;
  });
  console.log('Target fields:', targetCounts);
  console.log('Rules list:', data.map(r => ({ id: r.id, priority: r.priority, target_field: r.target_field, kata_kunci: r.kata_kunci, nilai_klasifikasi: r.nilai_klasifikasi })));
}

main();
