const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function exportIkuData() {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(process.cwd(), 'iku.xlsx');
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.getWorksheet('maping') || workbook.worksheets[0];
  console.log('Processing sheet:', sheet.name, 'Rows:', sheet.rowCount);

  // 1. Ekstrak Master Referensi
  const masterList = [];
  let masterIdCounter = 1;

  // Master 2026 (Col 26)
  for (let r = 2; r <= sheet.rowCount; r++) {
    const val = sheet.getRow(r).getCell(26).value;
    if (val && typeof val === 'string' && val.trim()) {
      const trimmed = val.trim();
      if (!masterList.some(m => m.ref_tahun_iku === 2026 && m.nama_ref_iku === trimmed)) {
        masterList.push({
          id: masterIdCounter++,
          ref_tahun_iku: 2026,
          nama_ref_iku: trimmed
        });
      }
    }
  }

  // Master 2025 (Col 27)
  for (let r = 2; r <= sheet.rowCount; r++) {
    const val = sheet.getRow(r).getCell(27).value;
    if (val && typeof val === 'string' && val.trim()) {
      const trimmed = val.trim();
      if (!masterList.some(m => m.ref_tahun_iku === 2025 && m.nama_ref_iku === trimmed)) {
        masterList.push({
          id: masterIdCounter++,
          ref_tahun_iku: 2025,
          nama_ref_iku: trimmed
        });
      }
    }
  }

  console.log('Extracted Master References:', masterList.length);

  // 2. Ekstrak Pemetaan (2995 baris)
  const mappingRows = [];
  let mapIdCounter = 1;

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    
    // Ambil field dasar
    const getCellStr = (colIdx) => {
      const v = row.getCell(colIdx).value;
      if (v === null || v === undefined) return '';
      return String(v).trim();
    };

    const tujuan_id = getCellStr(1);
    const tujuan_kode = getCellStr(2);
    const tujuan_nama = getCellStr(3);

    const indikator_tujuan_id = getCellStr(4);
    const indikator_tujuan_kode = getCellStr(5);
    const indikator_tujuan_nama = getCellStr(6);

    const sasaran_id = getCellStr(7);
    const sasaran_kode = getCellStr(8);
    const sasaran_nama = getCellStr(9);

    const indikator_sasaran_id = getCellStr(10);
    const indikator_sasaran_kode = getCellStr(11);
    const indikator_sasaran_nama = getCellStr(12);

    const program_id = getCellStr(13);
    const program_kode = getCellStr(14);
    const program_nama = getCellStr(15);

    const indikator_program_id = getCellStr(16);
    const indikator_program_kode = getCellStr(17);
    const indikator_program_nama = getCellStr(18);

    const kegiatan_id = getCellStr(19);
    const kegiatan_kode = getCellStr(20);
    const kegiatan_nama = getCellStr(21);

    const ref_2026 = getCellStr(22);
    const ref_2025 = getCellStr(23);

    if (!kegiatan_id && !kegiatan_nama && !program_nama) {
      continue;
    }

    const baseRow = {
      tujuan_id,
      tujuan_kode,
      tujuan_nama,
      indikator_tujuan_id,
      indikator_tujuan_kode,
      indikator_tujuan_nama,
      sasaran_id,
      sasaran_kode,
      sasaran_nama,
      indikator_sasaran_id,
      indikator_sasaran_kode,
      indikator_sasaran_nama,
      program_id,
      program_kode,
      program_nama,
      indikator_program_id,
      indikator_program_kode,
      indikator_program_nama,
      kegiatan_id,
      kegiatan_kode,
      kegiatan_nama,
    };

    // Jika memiliki ref 2026
    if (ref_2026) {
      mappingRows.push({
        id: mapIdCounter++,
        ...baseRow,
        ref_iku: ref_2026,
        ref_tahun_iku: 2026
      });
    }

    // Jika memiliki ref 2025
    if (ref_2025) {
      mappingRows.push({
        id: mapIdCounter++,
        ...baseRow,
        ref_iku: ref_2025,
        ref_tahun_iku: 2025
      });
    }

    // Jika tidak punya keduanya, tetap dicatat sebagai pemetaan umum jika diinginkan atau fallback
    if (!ref_2026 && !ref_2025) {
      mappingRows.push({
        id: mapIdCounter++,
        ...baseRow,
        ref_iku: '-',
        ref_tahun_iku: 0
      });
    }
  }

  console.log('Extracted Mapping Rows:', mappingRows.length);

  const outDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outputPayload = {
    generatedAt: new Date().toISOString(),
    masterReferences: masterList,
    totalMappings: mappingRows.length,
    mappings: mappingRows
  };

  const outFilePath = path.join(outDir, 'iku-data.json');
  fs.writeFileSync(outFilePath, JSON.stringify(outputPayload, null, 2), 'utf-8');
  console.log('Successfully written to:', outFilePath, `(${Math.round(fs.statSync(outFilePath).size / 1024)} KB)`);
}

exportIkuData().catch(console.error);
