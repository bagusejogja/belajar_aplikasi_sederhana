const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\tambah\\page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Remove the back button that points to 'idle'
  const backBtnRegex = /<button onClick=\{\(\) => setMode\('idle'\)\}[\s\S]*?<\/button>/g;
  content = content.replace(backBtnRegex, '');

  fs.writeFileSync(path, content);
}
