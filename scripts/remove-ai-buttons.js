const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\tambah\\components\\DataFormManual.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // 1. Remove Ringkasan button
  const ringkasanRegex = /<button onClick=\{handleGenerateRingkasan\}[\s\S]*?<\/button>/;
  content = content.replace(ringkasanRegex, '');

  // 2. Remove Rekomendasi button
  const rekomendasiRegex = /<button onClick=\{handleGenerateRekomendasi\}[\s\S]*?<\/button>/;
  content = content.replace(rekomendasiRegex, '');

  // 3. Remove Surat Balasan button
  const balasanRegex = /<button onClick=\{handleGenerateSuratBalasan\}[\s\S]*?<\/button>/;
  content = content.replace(balasanRegex, '');

  fs.writeFileSync(path, content);
}
