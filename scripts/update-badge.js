const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace(/> Impor Analisis AI<\/span>/g, '> Dari Analisis</span>');
  content = content.replace(/> Impor Analisis AI \(\/analisis\)<\/span>/g, '> Dari Analisis</span>');
  content = content.replace(/title="Diimpor dari Dokumen Analisis AI \(\/analisis\)"/g, 'title="Bersumber dari halaman Analisis Pagu"');

  // Let's also change the Sparkles icon to something else like FileText if possible, but leaving Sparkles is fine.
  // Actually the user just complained about the text, so let's just change the text.
  
  fs.writeFileSync(path, content);
}
