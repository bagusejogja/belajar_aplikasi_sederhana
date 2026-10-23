const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = (envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY).replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

const BACKUP_FILE = 'backup_database_2026-10-17T08-07-00-695Z.sql';

async function restoreV1() {
  console.log('=== MEMULAI RESTORE NILAI v1 DARI BACKUP 17 OKTOBER 2026 ===');

  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`File backup tidak ditemukan: ${BACKUP_FILE}`);
    return;
  }

  console.log('1. Membaca data asli rkat_pengeluaran dari file backup...');
  const rl = readline.createInterface({
    input: fs.createReadStream(BACKUP_FILE),
    crlfDelay: Infinity
  });

  const backupMap = new Map(); // db_id -> originalAnggaran
  for await (const line of rl) {
    if (line.startsWith('INSERT INTO public."rkat_pengeluaran"')) {
      const valuesIdx = line.indexOf(' VALUES (');
      const valsStr = line.slice(valuesIdx + 9, line.lastIndexOf(');'));
      
      const vals = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < valsStr.length; i++) {
        const ch = valsStr[i];
        if (ch === "'" && valsStr[i + 1] === "'") {
          cur += "'";
          i++;
        } else if (ch === "'") {
          inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
          vals.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      vals.push(cur.trim());

      const dbIdRaw = vals[28];
      const dbId = dbIdRaw ? dbIdRaw.replace(/^'|'$/g, '') : null;
      const anggaran = Number(vals[19]) || 0;
      if (dbId && dbId !== 'NULL') {
        backupMap.set(dbId, anggaran);
      }
    }
  }

  console.log(`Berhasil memuat ${backupMap.size} baris data asli dari backup.`);

  console.log('2. Mencari baris v1 di database yang nominalnya berbeda...');
  const allDbIds = Array.from(backupMap.keys());
  const rowsToUpdate = [];
  const chunkSize = 200;

  for (let i = 0; i < allDbIds.length; i += chunkSize) {
    const chunk = allDbIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from('rkat_pengeluaran')
      .select('id, db_id, anggaran')
      .in('db_id', chunk)
      .eq('versi_anggaran', 'v1');

    if (error) {
      console.error('Error membaca data DB:', error);
      continue;
    }

    data.forEach(r => {
      const originalAnggaran = backupMap.get(r.db_id);
      if (originalAnggaran !== undefined && originalAnggaran !== Number(r.anggaran)) {
        rowsToUpdate.push({
          id: r.id,
          db_id: r.db_id,
          currentAnggaran: Number(r.anggaran),
          targetAnggaran: originalAnggaran
        });
      }
    });
  }

  console.log(`Ditemukan ${rowsToUpdate.length} baris v1 yang perlu dipulihkan nominalnya.`);

  if (rowsToUpdate.length === 0) {
    console.log('Semua baris v1 sudah sinkron dengan data backup! Tidak ada update yang diperlukan.');
    return;
  }

  console.log('3. Melakukan update pemulihan anggaran v1...');
  let successCount = 0;
  for (let i = 0; i < rowsToUpdate.length; i++) {
    const item = rowsToUpdate[i];
    const { error } = await supabase
      .from('rkat_pengeluaran')
      .update({ anggaran: item.targetAnggaran })
      .eq('id', item.id)
      .eq('versi_anggaran', 'v1');

    if (error) {
      console.error(`Gagal update id ${item.id} (db_id ${item.db_id}):`, error.message);
    } else {
      successCount++;
    }

    if ((i + 1) % 50 === 0 || i === rowsToUpdate.length - 1) {
      console.log(`Progress update: ${i + 1} / ${rowsToUpdate.length} baris...`);
    }
  }

  console.log(`Selesai! Berhasil memperbarui ${successCount} dari ${rowsToUpdate.length} baris.`);
  console.log('=== PEMULIHAN SELESAI ===');
}

restoreV1();
