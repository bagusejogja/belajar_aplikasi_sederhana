const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\tambah\\page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace(/status_pengajuan: utama\.status_pengajuan \|\| 'Di Proses'/g, "status_pengajuan: utama.status_pengajuan || 'Diajukan'");
  content = content.replace(/<option value="Di Proses">Di Proses \(Pending\)<\/option>/g, '<option value="Diajukan">Diajukan (Pending)</option>');
  
  fs.writeFileSync(path, content);
}
