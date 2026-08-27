const fs = require('fs');

const filePaths = [
  'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\actions\\ai-scan.ts',
  'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\lib\\aiReview.ts'
];

filePaths.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/gemini-2\.5-flash/g, 'gemini-1.5-flash');
    content = content.replace(/gemini-2\.0-flash/g, 'gemini-1.5-pro');
    content = content.replace(/Gemini 2\.5/g, 'Gemini 1.5');
    fs.writeFileSync(filePath, content);
  }
});
