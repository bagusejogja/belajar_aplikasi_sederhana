const fs = require('fs');
const path = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';

let content = fs.readFileSync(path, 'utf8');

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

fs.writeFileSync(path, content);
console.log('Completed all changes.');
