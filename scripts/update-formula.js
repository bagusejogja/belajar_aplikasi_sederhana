const ExcelJS = require('exceljs');
const fs = require('fs');

async function updateFormula() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('Template_Rencana_Kinerja_dan_Anggaran.xlsx');
  const ws = wb.getWorksheet('utuh');
  const years = [2023, 2024, 2025, 2026, 2027];
  
  for (let r = 4; r <= 25; r++) {
    years.forEach((yr, idx) => {
      const colNum = 11 + idx; // 11=K, 12=L, 13=M, 14=N, 15=O
      const colLetter = String.fromCharCode(64 + colNum);
      const formulaStr = `SUM(SUMIFS(anggaran!$L:$L, anggaran!$A:$A, ${colLetter}$3, anggaran!$F:$F, $Q${r}:$Z${r})) / 1000000`;
      ws.getCell(`${colLetter}${r}`).value = { formula: formulaStr };
    });
  }
  
  wb.calcProperties.fullCalcOnLoad = true;
  await wb.xlsx.writeFile('Template_Rencana_Kinerja_dan_Anggaran.xlsx');
  fs.copyFileSync('Template_Rencana_Kinerja_dan_Anggaran.xlsx', 'public/Template_Rencana_Kinerja_dan_Anggaran.xlsx');
  console.log('Successfully updated pure formula!');
}

updateFormula().catch(console.error);

