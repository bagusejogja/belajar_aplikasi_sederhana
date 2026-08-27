const fs = require('fs');
const path = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Change activeStep type from 'step1' | 'step2' | 'step3' to 'step1' | 'step2'
content = content.replace(
  "const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3'>('step1');",
  "const [activeStep, setActiveStep] = useState<'step1' | 'step2'>('step1');"
);

// 2. Remove step 2 (Substansi) tab
const tabsRegex = /const formTabs = \[\s*\{\s*id: 'step1',[\s\S]*?\},\s*\{\s*id: 'step2',[\s\S]*?\},\s*\{\s*id: 'step3',[\s\S]*?\}\s*\];/;
const newTabs = `const formTabs = [
      { 
        id: 'step1', 
        label: '1. Pengajuan Usulan', 
        icon: FileText,
        desc: 'Upload Surat Pengajuan'
      },
      { 
        id: 'step2', 
        label: '2. Tanggapan & Keputusan', 
        icon: CheckCircle,
        desc: 'Status Akhir'
      }
    ];`;
content = content.replace(tabsRegex, newTabs);

// 3. Remove step 2 rendering block SAFELY
const step2Start = content.indexOf("{activeStep === 'step2' && (");
const step3Start = content.indexOf("{activeStep === 'step3' && (");

if (step2Start !== -1 && step3Start !== -1) {
  content = content.slice(0, step2Start) + content.slice(step3Start);
}

// 4. Change step 3 rendering block condition to step 2
content = content.replace("{activeStep === 'step3' && (", "{activeStep === 'step2' && (");

// 5. Update the "Kembali Ke Tahap 2" button in the new step 2
content = content.replace(
  "onClick={() => setActiveStep('step2')}\n                className=\"px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm\"\n              >\n                <ChevronLeft size={16} /> Kembali Ke Tahap 2",
  "onClick={() => setActiveStep('step1')}\n                className=\"px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm\"\n              >\n                <ChevronLeft size={16} /> Kembali Ke Tahap 1"
);

// 6. Update the "Selanjutnya Ke Tahap 2" button in step 1
content = content.replace(
  "<span className=\"hidden sm:inline\">Selanjutnya Ke Tahap 2</span>",
  "<span className=\"hidden sm:inline\">Selanjutnya Ke Tahap 2</span>"
);
content = content.replace(
  "Lanjut Ke Tahap 2 (Substansi)",
  "Lanjut Ke Tahap 2 (Tanggapan)"
);

// 7. Inject handlePengajuanUpload logic
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

const handleTanggapanStart = content.indexOf("const handleTanggapanUpload = async () => {");
if (handleTanggapanStart !== -1) {
  content = content.slice(0, handleTanggapanStart) + uploadFunc + content.slice(handleTanggapanStart);
}

// Replace the onChange handler for filePengajuan (using precise replacement)
const filePengajuanInputRegex = /onChange=\{\(e\) => \{\s*const file = e\.target\.files\?\.\[0\];\s*if \(file\) setFilePengajuan\(file\);\s*\}\}/;
content = content.replace(filePengajuanInputRegex, "onChange={handlePengajuanUpload}");

// Add a loading spinner next to filePengajuan label
content = content.replace(
  "{filePengajuan ? filePengajuan.name : 'Pilih File (Max 10MB)'}",
  "{isScanningPengajuan ? 'Memindai dengan AI...' : (filePengajuan ? filePengajuan.name : 'Pilih File (Max 10MB)')}"
);

// We need to restore the Diajukan status fix since we reverted page.tsx!
content = content.replace(
  "let status = mainData.status_pengajuan || 'Draft';",
  "let status = mainData.status_pengajuan || 'Draft';\n    if (status === 'Di Proses') status = 'Diajukan';"
);
content = content.replace(
  "if (tp.status_pengajuan === 'Di Proses') tp.status_pengajuan = 'Diajukan';",
  "if (tp.status_pengajuan === 'Di Proses') tp.status_pengajuan = 'Diajukan';"
);

// Replace "Di Proses" in the dropdown with "Diajukan"
content = content.replace(
  `<option value="Di Proses">Di Proses</option>`,
  `<option value="Diajukan">Diajukan</option>`
);

fs.writeFileSync(path, content);
console.log('Fixed page.tsx');
