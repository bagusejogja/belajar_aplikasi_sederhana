const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function syncIdDb() {
  console.log('--- Pemeriksaan Kolom id_db pada Tabel gov_pagu_anggaran ---');
  
  // 1. Cek apakah kolom id_db sudah dikenali di API Supabase
  const { data: testData, error: testError } = await supabase
    .from('gov_pagu_anggaran')
    .select('id, id_db')
    .limit(1);

  if (testError) {
    if (testError.message && testError.message.includes('id_db')) {
      console.log('⚠️ Kolom id_db belum ada di tabel gov_pagu_anggaran.');
      console.log('👉 Silakan jalankan file SQL berikut di Supabase Dashboard (SQL Editor):');
      console.log('   supabase_add_id_db_gov_pagu.sql');
      console.log('   File ini otomatis membuat kolom id_db, mengisi 2.194 baris data, membuat index, dan me-reload schema cache.');
      return;
    } else {
      console.error('Error saat select:', testError);
      return;
    }
  }

  console.log('✓ Kolom id_db sudah terdeteksi di tabel gov_pagu_anggaran.');
  
  // 2. Baca file id_db.txt
  const fileLines = fs.readFileSync('id_db.txt', 'utf8')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const values = fileLines.slice(1);
  console.log(`Memeriksa data ${values.length} baris...`);

  // 3. Cek apakah ada yang masih NULL
  const { count: nullCount } = await supabase
    .from('gov_pagu_anggaran')
    .select('id', { count: 'exact', head: true })
    .is('id_db', null);

  console.log(`Jumlah baris dengan id_db = NULL: ${nullCount || 0}`);

  if (nullCount && nullCount > 0) {
    console.log('Mengupdate baris id_db secara bertahap via API...');
    let updated = 0;
    const batchSize = 50;
    for (let i = 0; i < values.length; i += batchSize) {
      const slice = values.slice(i, i + batchSize);
      await Promise.all(slice.map((val, idx) => {
        const rowId = i + idx + 1;
        return supabase.from('gov_pagu_anggaran').update({ id_db: parseInt(val, 10) }).eq('id', rowId);
      }));
      updated += slice.length;
      if (updated % 200 === 0 || updated === values.length) {
        console.log(`Progress: ${updated} / ${values.length}`);
      }
    }
    console.log('✓ Selesai update seluruh id_db!');
  } else {
    console.log('✓ Seluruh data id_db sudah terisi lengkap di database!');
  }

  // 4. Tampilkan 5 baris pertama & 5 baris terakhir sebagai bukti verifikasi
  const { data: first5 } = await supabase.from('gov_pagu_anggaran').select('id, id_db, tahun_anggaran, nominal').order('id', { ascending: true }).limit(5);
  const { data: last5 } = await supabase.from('gov_pagu_anggaran').select('id, id_db, tahun_anggaran, nominal').order('id', { ascending: false }).limit(5);
  console.log('\nSample 5 baris pertama di DB:');
  console.table(first5);
  console.log('Sample 5 baris terakhir di DB:');
  console.table(last5?.reverse());
}

syncIdDb().catch(console.error);
