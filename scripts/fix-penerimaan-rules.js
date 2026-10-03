const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const env = dotenv.parse(fs.readFileSync('.env'));
const url = env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/^["']|["']$/g, '');
const key = (env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY).trim().replace(/^["']|["']$/g, '');

const supabase = createClient(url, key);

async function fixPenerimaanRules() {
  // Update rules in penerimaan where target_field is 'proposal rkat' to 'format_proposal'
  const { data, error } = await supabase
    .from('rka_rules')
    .update({ target_field: 'format_proposal' })
    .eq('modul', 'penerimaan')
    .eq('target_field', 'proposal rkat')
    .select();

  if (error) {
    console.error('Error updating rules:', error);
  } else {
    console.log('Updated rules successfully:', data);
  }

  // Check all penerimaan rules now
  const { data: allRules } = await supabase
    .from('rka_rules')
    .select('id, target_field, nilai_klasifikasi')
    .eq('modul', 'penerimaan');

  console.log('Current penerimaan rules summary:');
  const counts = {};
  (allRules || []).forEach(r => {
    counts[r.target_field] = (counts[r.target_field] || 0) + 1;
  });
  console.log(counts);
}

fixPenerimaanRules();
