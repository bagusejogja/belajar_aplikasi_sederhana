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

// 3. Remove step 2 rendering block
// It starts with `{activeStep === 'step2' && (` and ends right before `{activeStep === 'step3' && (`
const step2Start = content.indexOf("{activeStep === 'step2' && (");
const step3Start = content.indexOf("{activeStep === 'step3' && (");

if (step2Start !== -1 && step3Start !== -1) {
  content = content.slice(0, step2Start) + content.slice(step3Start);
}

// 4. Change step 3 rendering block condition to step 2
content = content.replace("{activeStep === 'step3' && (", "{activeStep === 'step2' && (");

// 5. Update "Kembali" and "Selanjutnya" buttons in step 1 and the new step 2
// In step 1: onClick={() => setActiveStep('step2')} (was step2, remains step2 but now means tanggapan)
// In old step 3 (new step 2): onClick={() => setActiveStep('step2')} becomes onClick={() => setActiveStep('step1')}
content = content.replace(
  /<button[\s\S]*?onClick=\{\(\) => setActiveStep\('step2'\)\}[\s\S]*?Kembali[\s\S]*?<\/button>/,
  `<button
                type="button"
                onClick={() => setActiveStep('step1')}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <ChevronLeft size={18} /> Kembali
              </button>`
);

// 6. Hook up AI to filePengajuan
// Right now, onChange for filePengajuan just does setFilePengajuan(file). We need a handlePengajuanUpload function.
// Let's find: const [isScanningTanggapan, setIsScanningTanggapan] = useState(false);
content = content.replace(
  "const [isScanningTanggapan, setIsScanningTanggapan] = useState(false);",
  "const [isScanningTanggapan, setIsScanningTanggapan] = useState(false);\n  const [isScanningPengajuan, setIsScanningPengajuan] = useState(false);"
);

// We need to inject handlePengajuanUpload
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
        alert('Ekstraksi AI Berhasil!');
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

// Inject right before handleTanggapanUpload
const handleTanggapanStart = content.indexOf("const handleTanggapanUpload = async () => {");
if (handleTanggapanStart !== -1) {
  content = content.slice(0, handleTanggapanStart) + uploadFunc + content.slice(handleTanggapanStart);
}

// Replace the onChange handler for filePengajuan
const filePengajuanInputRegex = /onChange=\{\(e\) => \{\s*const file = e\.target\.files\?\.\[0\];\s*if \(file\) setFilePengajuan\(file\);\s*\}\}/;
content = content.replace(filePengajuanInputRegex, "onChange={handlePengajuanUpload}");

// Add a loading spinner next to filePengajuan label if isScanningPengajuan
const filePengajuanLabelRegex = /\{filePengajuan \? filePengajuan\.name : 'Pilih File \(Max 10MB\)'\}/;
content = content.replace(filePengajuanLabelRegex, "{isScanningPengajuan ? 'Memindai dengan AI...' : (filePengajuan ? filePengajuan.name : 'Pilih File (Max 10MB)')}");

fs.writeFileSync(path, content);
console.log('Done refactoring page.tsx');
