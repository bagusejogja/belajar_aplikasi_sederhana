const ExcelJS = require('exceljs');

async function inspect() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('iku.xlsx');
  
  console.log('Worksheet names:');
  workbook.eachSheet(sheet => console.log(' - ' + sheet.name));

  const sheet = workbook.getWorksheet('maping') || workbook.worksheets[0];
  console.log(`Sheet "${sheet.name}" rowCount:`, sheet.rowCount);

  const headerRow = sheet.getRow(1);
  console.log('\nHeader columns:');
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    console.log(`Col ${colNumber}: ${cell.value}`);
  });

  console.log('\nSample Row 2:');
  const row2 = sheet.getRow(2);
  row2.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (cell.value !== null && cell.value !== undefined) {
      console.log(`Col ${colNumber}: ${cell.value}`);
    }
  });

  const ref2026Set = new Set();
  const ref2025Set = new Set();
  const master2026 = [];
  const master2025 = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const c22 = row.getCell(22).value; // ref 2026
    const c23 = row.getCell(23).value; // ref 2025
    const c26 = row.getCell(26).value; // master 2026
    const c27 = row.getCell(27).value; // master 2025

    if (c22) ref2026Set.add(c22);
    if (c23) ref2025Set.add(c23);
    if (c26 && !master2026.includes(c26)) master2026.push(c26);
    if (c27 && !master2025.includes(c27)) master2025.push(c27);
  }

  console.log('\nRef 2026 count in mapping:', ref2026Set.size);
  console.log('Ref 2025 count in mapping:', ref2025Set.size);
  console.log('\nMaster 2026 (col 26):', master2026);
  console.log('\nMaster 2025 (col 27):', master2025);
}

inspect().catch(console.error);

