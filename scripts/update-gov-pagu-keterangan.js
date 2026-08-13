const { createClient } = require('../node_modules/@supabase/supabase-js');
const XLSX = require('../node_modules/xlsx');
const path = require('path');

const SUPABASE_URL = 'https://tkeswcrglwcrxflxkcrc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_n02D5Nio17suATl3JVxTdg_OsuJDUqI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runUpdate() {
  console.log('🚀 Memulai proses update keterangan gov_pagu_anggaran dari updatedel.xlsx...');

  const excelPath = path.join(__dirname, '../updatedel.xlsx');
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0]; // 'asli (2)'
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📄 Total baris dalam Excel: ${rawRows.length}`);

  const itemsToUpdate = rawRows.filter(r => 
    r.unit_kerja && 
    r.keterangan !== undefined && 
    r.keterangan !== null && 
    String(r.keterangan).trim() !== ''
  );

  console.log(`🎯 Total baris dengan Keterangan yang akan di-update: ${itemsToUpdate.length}`);

  let successCount = 0;
  let failCount = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < itemsToUpdate.length; i += BATCH_SIZE) {
    const batch = itemsToUpdate.slice(i, i + BATCH_SIZE);

    const updatePromises = batch.map(async (item) => {
      const targetId = Number(item.unit_kerja);
      const newKeterangan = String(item.keterangan).trim();

      const { error } = await supabase
        .from('gov_pagu_anggaran')
        .update({ keterangan: newKeterangan })
        .eq('id', targetId);

      if (error) {
        console.error(`❌ Gagal update ID ${targetId}:`, error.message);
        return false;
      } else {
        return true;
      }
    });

    const results = await Promise.all(updatePromises);
    const batchSuccess = results.filter(Boolean).length;
    const batchFail = results.length - batchSuccess;

    successCount += batchSuccess;
    failCount += batchFail;

    const progressPct = Math.round(((i + batch.length) / itemsToUpdate.length) * 100);
    console.log(`⏳ Progress: ${progressPct}% (${i + batch.length}/${itemsToUpdate.length}) - Sukses: ${successCount}, Gagal: ${failCount}`);
  }

  console.log('\n========================================');
  console.log('✅ Selesai memperbarui keterangan DB!');
  console.log(`📊 Hasil Akhir: ${successCount} Berhasil, ${failCount} Gagal dari Total ${itemsToUpdate.length} Data.`);
  console.log('========================================');
}

runUpdate().catch(err => {
  console.error('Fatal Error:', err);
});
