const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\tambah\\page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Fix constraint 'Di Proses' -> 'Diajukan'
  content = content.replace(/status_pengajuan: 'Di Proses'/g, "status_pengajuan: 'Diajukan'");
  content = content.replace(/mainData\.status_pengajuan !== 'Di Proses'/g, "mainData.status_pengajuan !== 'Diajukan'");
  content = content.replace(/mainData\.keputusan \|\| 'Di Proses'/g, "mainData.keputusan || 'Diajukan'");
  content = content.replace(/mainData\.keputusan \|\| 'Di Proses'/g, "mainData.keputusan || 'Diajukan'"); // Just in case there are multiple
  content = content.replace(/\|\| 'Di Proses'\)/g, "|| 'Diajukan')");
  
  fs.writeFileSync(path, content);
}
