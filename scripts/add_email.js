const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.yvxybmtzyfhmqysryuol:Bagus123!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    await client.query('ALTER TABLE public.mak_submissions ADD COLUMN IF NOT EXISTS email varchar(255);');
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('Kolom email berhasil ditambahkan dan schema direload!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
run();
