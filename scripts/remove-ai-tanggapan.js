const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\tambah\\components\\OCRPanelTanggapan.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Remove import
  content = content.replace("import { extractTanggapanFromText } from '@/app/actions/ai-scan';", "");

  // Replace the AI processing block with the Regex manual parse block
  const aiBlockRegex = /setIsAiProcessing\(true\);\s*const res = await extractTanggapanFromText\(extractedText\);\s*if \(res\.success && res\.data\) \{\s*setMainData\(\(prev: any\) => \(\{ \.\.\.prev, \.\.\.res\.data \}\)\);\s*\} else \{\s*alert\("AI Gagal mengekstrak struktur tanggapan\. Silakan isi manual\."\);\s*\}\s*setIsAiProcessing\(false\);/;
  
  const replacement = `
        const parsed = parseOCRTanggapan(extractedText);
        setMainData((prev: any) => ({
           ...prev,
           no_surat_tanggapan: parsed.no_surat_tanggapan || prev.no_surat_tanggapan,
           tanggal_surat_tanggapan: parsed.tanggal_surat_tanggapan || prev.tanggal_surat_tanggapan,
           hal_surat_tanggapan: parsed.hal_surat_tanggapan || prev.hal_surat_tanggapan,
           nominal_tanggapan: parsed.nominal_tanggapan || prev.nominal_tanggapan
        }));
        alert('Ekstraksi teks selesai! Metadata tanggapan telah terisi.');
  `;
  
  content = content.replace(aiBlockRegex, replacement);
  fs.writeFileSync(path, content);
}
