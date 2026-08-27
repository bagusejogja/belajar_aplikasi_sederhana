const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\tambah\\page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Find: const titleCaseStatus = ...
  // Replace with:
  // let titleCaseStatus = ...
  // if (titleCaseStatus === 'Di Proses' || titleCaseStatus === 'Di proses') titleCaseStatus = 'Diajukan';

  const targetLine = "const titleCaseStatus = rawStatus.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');";
  
  const replacementLine = `let titleCaseStatus = rawStatus.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      if (titleCaseStatus === 'Di Proses' || titleCaseStatus === 'Di proses' || titleCaseStatus === 'Diproses') titleCaseStatus = 'Diajukan';`;

  content = content.replace(targetLine, replacementLine);
  
  fs.writeFileSync(path, content);
}
