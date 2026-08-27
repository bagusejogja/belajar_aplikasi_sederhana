const fs = require('fs');
const path = 'd:\\BK\\OneDrive - UGM 365\\Desktop\\verifikasi-online\\src\\app\\(dashboard)\\tambah-pagu\\tambah\\components\\DataFormManual.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Ringkasan Button
  const ringkasanLabel = '<label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest">Ringkasan Substansi (Ringkasan Surat dengan AI)</label>';
  const ringkasanBtn = `
                <button onClick={handleGenerateRingkasan} disabled={isGeneratingRingkasan} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
                  {isGeneratingRingkasan ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-emerald-700 rounded-full animate-spin"/> : <Wand2 size={12}/>} 
                  Generate Ringkasan (AI)
                </button>`;
  content = content.replace(ringkasanLabel, ringkasanLabel + ringkasanBtn);

  // Rekomendasi Button
  const rekomendasiLabel = '<label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest">Analisis & Rekomendasi (AI Analysis)</label>';
  const rekomendasiBtn = `
                <button onClick={handleGenerateRekomendasi} disabled={isGeneratingAI} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
                  {isGeneratingAI ? <div className="w-3 h-3 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin"/> : <Wand2 size={12}/>} 
                  Generate Rekomendasi (AI)
                </button>`;
  content = content.replace(rekomendasiLabel, rekomendasiLabel + rekomendasiBtn);

  // Balasan Button
  const balasanLabel = '<label className="block text-xs font-bold text-emerald-700 uppercase tracking-widest">Draft Surat Balasan Resmi (UGM Format)</label>';
  const balasanBtn = `
                <button onClick={handleGenerateSuratBalasan} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm">
                  <Wand2 size={13}/> Generate Draft Surat Balasan (AI)
                </button>`;
  content = content.replace(balasanLabel, balasanLabel + balasanBtn);

  fs.writeFileSync(path, content);
}
