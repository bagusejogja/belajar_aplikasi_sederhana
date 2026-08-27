const fs = require('fs');
const path = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// Normalize line endings to LF for easier replacement
content = content.replace(/\r\n/g, '\n');

// 1. Replace the tabs array
const oldTabsStr = `        {[
          { id: 'step1', step: '1', title: 'Data Utama & Pengajuan', subtitle: 'Surat Masuk & Ringkasan AI', icon: FileText },
          { id: 'step2', step: '2', title: 'Posisi Pagu Unit', subtitle: 'Pagu 2026 & Multi-Tahun', icon: Landmark },
          { id: 'step3', step: '3', title: 'Tanggapan & Keputusan', subtitle: 'Input Surat Keluar & Simpan', icon: CheckCircle2 },
        ].map((tab) => {`;

const newTabsStr = `        {[
          { id: 'step1', step: '1', title: '1. Pengajuan Usulan', subtitle: 'Upload Surat Pengajuan & AI', icon: FileText },
          { id: 'step2', step: '2', title: '2. Tanggapan & Keputusan', subtitle: 'Status Akhir & Simpan', icon: CheckCircle2 },
        ].map((tab) => {`;

if (content.includes(oldTabsStr)) {
  content = content.replace(oldTabsStr, newTabsStr);
  console.log('Tabs replaced.');
} else {
  console.log('Error: oldTabsStr not found!');
}

// 2. Replace Step 1 Next Button text
const oldNextButton = `                onClick={() => setActiveStep('step2')}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                Selanjutnya: Posisi Pagu Unit <ChevronRight size={16} />`;

const newNextButton = `                onClick={() => setActiveStep('step2')}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                Selanjutnya: Tanggapan & Keputusan <ChevronRight size={16} />`;

if (content.includes(oldNextButton)) {
  content = content.replace(oldNextButton, newNextButton);
  console.log('Next button replaced.');
} else {
  console.log('Error: oldNextButton not found!');
}

// 3. Replace Step 2 Back Button
const oldBackButton = `              <button
                type="button"
                onClick={() => setActiveStep('step2')}
                className="px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Kembali Ke Tahap 2`;

const newBackButton = `              <button
                type="button"
                onClick={() => setActiveStep('step1')}
                className="px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Kembali Ke Tahap 1`;

if (content.includes(oldBackButton)) {
  content = content.replace(oldBackButton, newBackButton);
  console.log('Back button replaced.');
} else {
  console.log('Error: oldBackButton not found!');
}

// 4. Change activeStep type from 'step1' | 'step2' | 'step3' to 'step1' | 'step2'
content = content.replace(
  "const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3'>('step1');",
  "const [activeStep, setActiveStep] = useState<'step1' | 'step2'>('step1');"
);

// 5. Remove step 2 rendering block SAFELY
const step2Start = content.indexOf("{activeStep === 'step2' && (");
const step3Start = content.indexOf("{activeStep === 'step3' && (");

if (step2Start !== -1 && step3Start !== -1) {
  content = content.slice(0, step2Start) + content.slice(step3Start);
  console.log('Step 2 removed.');
} else {
  console.log('Error: step2Start or step3Start not found!');
}

// 6. Change step 3 rendering block condition to step 2
content = content.replace("{activeStep === 'step3' && (", "{activeStep === 'step2' && (");

// 7. Inject handlePengajuanUpload logic and update file inputs
content = content.replace(
  "const [isScanningTanggapan, setIsScanningTanggapan] = useState(false);",
  "const [isScanningTanggapan, setIsScanningTanggapan] = useState(false);\n  const [isScanningPengajuan, setIsScanningPengajuan] = useState(false);"
);

const uploadFunc = `
  const handlePengajuanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilePengajuan(file);

    setIsScanningPengajuan(true);
    try {
      const scanFormData = new FormData();
      scanFormData.append('file', file);
      const res = await scanSuratWithAI(scanFormData);
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          no_surat_pengajuan: res.data.no_surat || prev.no_surat_pengajuan,
          tanggal_surat_pengajuan: res.data.tanggal_surat || prev.tanggal_surat_pengajuan,
          hal_surat_pengajuan: res.data.perihal_surat || prev.hal_surat_pengajuan,
          nominal_diajukan: res.data.nominal_usulan || prev.nominal_diajukan
        }));
        alert('Ekstraksi AI Berhasil! Metadata surat pengajuan telah terisi otomatis.');
      } else {
        alert('Gagal mengekstrak metadata dari surat pengajuan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memindai surat pengajuan.');
    } finally {
      setIsScanningPengajuan(false);
    }
  };
`;

const handleTanggapanStart = content.indexOf("const handleAutoExtractTanggapanAI = async () => {");
if (handleTanggapanStart !== -1) {
  content = content.slice(0, handleTanggapanStart) + uploadFunc + content.slice(handleTanggapanStart);
  console.log('handlePengajuanUpload injected.');
} else {
  console.log('Error: handleAutoExtractTanggapanAI not found!');
}

// Replace filePengajuan onChange
content = content.replace(
  `onChange={(e) => setFilePengajuan(e.target.files?.[0] || null)}`,
  `onChange={handlePengajuanUpload}`
);

// Add a loading spinner next to filePengajuan label
content = content.replace(
  `{filePengajuan ? filePengajuan.name : "Pilih File Surat Pengajuan"}`,
  `{isScanningPengajuan ? 'Memindai AI...' : (filePengajuan ? filePengajuan.name : "Pilih File Surat Pengajuan")}`
);

// Re-convert to CRLF for windows friendliness
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(path, content);
console.log('Completed.');
