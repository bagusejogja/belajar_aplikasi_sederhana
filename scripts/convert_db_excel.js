const fs = require('fs');
const XLSX = require('xlsx');

try {
  const wb = XLSX.readFile('D:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/db.xlsx');
  
  // Asumsi sheet 1 adalah Realisasi, sheet 2 (jika ada) adalah Pagu
  const wsRealisasi = wb.Sheets[wb.SheetNames[0]];
  const dataRealisasi = XLSX.utils.sheet_to_json(wsRealisasi);
  
  let sql = '-- =========================================================\n';
  sql += '-- GENERATED SQL DARI db.xlsx (Tanpa Grouping / Baris per Baris)\n';
  sql += '-- =========================================================\n\n';
  
  sql += 'TRUNCATE TABLE public.gov_realisasi_anggaran RESTART IDENTITY CASCADE;\n';
  sql += 'TRUNCATE TABLE public.gov_pagu_anggaran RESTART IDENTITY CASCADE;\n\n';
  
  if (dataRealisasi.length > 0) {
    sql += '-- DATA REALISASI:\n';
    dataRealisasi.forEach(row => {
      // Pastikan ada nilai default agar tidak error jika sel kosong
      const tahun = row.tahun_anggaran || '2026';
      const unit = (row.unit_id === undefined || row.unit_id === null || row.unit_id === '') ? 'NULL' : row.unit_id;
      const dana = row.sumber_dana || 'BOPTN';
      const nominal = row.realisasi || 0;
      
      sql += `INSERT INTO public.gov_realisasi_anggaran (tahun_anggaran, unit_id, sumber_dana, realisasi) VALUES ('${tahun}', ${unit}, '${dana}', ${nominal});\n`;
    });
  }

  // Jika ada sheet kedua untuk Pagu
  if (wb.SheetNames.length > 1) {
    const wsPagu = wb.Sheets[wb.SheetNames[1]];
    const dataPagu = XLSX.utils.sheet_to_json(wsPagu);
    if (dataPagu.length > 0) {
        sql += '\n-- DATA PAGU:\n';
        dataPagu.forEach(row => {
            const tahun = row.tahun_anggaran || '2026';
            const unit = (row.unit_id === undefined || row.unit_id === null || row.unit_id === '') ? 'NULL' : row.unit_id;
            const nominal = row.nominal || 0;
            const dana = row.sumber_dana || 'BOPTN';
            const ket = row.keterangan || 'Pagu Awal';
            const status = row.status_pagu || 'Disetujui';
            const jenis = row.jenis_anggaran || 'Rutin';
            
            sql += `INSERT INTO public.gov_pagu_anggaran (tahun_anggaran, unit_id, nominal, sumber_dana, keterangan, status_pagu, jenis_anggaran) VALUES ('${tahun}', ${unit}, ${nominal}, '${dana}', '${ket}', '${status}', '${jenis}');\n`;
        });
    }
  }
  
  fs.writeFileSync('D:/BK/OneDrive - UGM 365/Desktop/db/insert_dari_excel.sql', sql);
  console.log(`Sukses generate SQL! File disimpan di Desktop/db/insert_dari_excel.sql`);
  
} catch (e) {
  console.error("Gagal membaca Excel: ", e.message);
}
