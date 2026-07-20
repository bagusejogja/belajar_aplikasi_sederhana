require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: cols, error: errCols } = await supabase.rpc('get_columns', { table_name: 'gov_units' });
  if (errCols) {
    console.log("Could not get columns, trying to select 1 row to see keys...");
    const { data, error } = await supabase.from('gov_units').select('*').limit(1);
    console.log("gov_units keys:", data ? Object.keys(data[0]) : error);
    
    // Now let's try to add the column if it's not there
    // Actually Supabase JS client doesn't support schema alteration (DDL) easily unless via RPC or REST if it's exposed.
    // Usually we need to use a Postgres client, but we don't have the connection string.
    // Let's check if `is_pagu` exists.
    if (data && data[0] && !('is_pagu' in data[0])) {
      console.log("is_pagu column does not exist. We can't alter table from anon client.");
    }
  }
}
main();
