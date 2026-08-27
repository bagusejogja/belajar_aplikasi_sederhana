const fs = require('fs');

function updatePage(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Add triggerAiSummary function and update handleGenerateAiSummary
  const oldAiSummaryFunc = `  const handleGenerateAiSummary = async () => {
    if (!ocrRawText) return;
    setIsGeneratingSummary(true);
    try {
      let contextArsip = '';
      if (riwayatUsulanUnit && riwayatUsulanUnit.length > 0) {
        contextArsip = riwayatUsulanUnit.map((r: any) => 
          \`- Tanggal: \${r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}, No Surat: \${r.no_surat || '-'}, Perihal: \${r.perihal || '-'}, Pengajuan: Rp \${formatNumber(r.total_anggaran || 0)}, Disetujui: Rp \${formatNumber(r.nominal_disetujui || 0)}, Status Keputusan: \${r.keputusan || 'disetujui'}\`
        ).join('\\n');
      }

      const res = await generateRingkasanFromText(ocrRawText, contextArsip);
      if (res.success && res.data?.ringkasan_html) {
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: res.data.ringkasan_html + '<!--imported-->'
        }));
        alert("Berhasil membuat ringkasan AI (termasuk rekam jejak)!");
      } else {
        alert("Gagal memproses Ringkasan AI: " + (res.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };`;

  const newAiSummaryFunc = `  const triggerAiSummary = async (text: string) => {
    if (!text) return;
    setIsGeneratingSummary(true);
    try {
      let contextArsip = '';
      if (riwayatUsulanUnit && riwayatUsulanUnit.length > 0) {
        contextArsip = riwayatUsulanUnit.map((r: any) => 
          \`- Tanggal: \${r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}, No Surat: \${r.no_surat || '-'}, Perihal: \${r.perihal || '-'}, Pengajuan: Rp \${formatNumber(r.total_anggaran || 0)}, Disetujui: Rp \${formatNumber(r.nominal_disetujui || 0)}, Status Keputusan: \${r.keputusan || 'disetujui'}\`
        ).join('\\n');
      }

      const res = await generateRingkasanFromText(text, contextArsip);
      if (res.success && res.data?.ringkasan_html) {
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: res.data.ringkasan_html + '<!--imported-->'
        }));
      }
    } catch (e: any) {
      console.error("Auto AI Summary failed:", e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!ocrRawText) {
      alert("Harap jalankan Ekstraksi Teks (OCR) terlebih dahulu di atas agar AI dapat membaca isi surat!");
      return;
    }
    setIsGeneratingSummary(true);
    try {
      let contextArsip = '';
      if (riwayatUsulanUnit && riwayatUsulanUnit.length > 0) {
        contextArsip = riwayatUsulanUnit.map((r: any) => 
          \`- Tanggal: \${r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}, No Surat: \${r.no_surat || '-'}, Perihal: \${r.perihal || '-'}, Pengajuan: Rp \${formatNumber(r.total_anggaran || 0)}, Disetujui: Rp \${formatNumber(r.nominal_disetujui || 0)}, Status Keputusan: \${r.keputusan || 'disetujui'}\`
        ).join('\\n');
      }

      const res = await generateRingkasanFromText(ocrRawText, contextArsip);
      if (res.success && res.data?.ringkasan_html) {
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: res.data.ringkasan_html + '<!--imported-->'
        }));
        alert("Berhasil membuat ringkasan AI (termasuk rekam jejak)!");
      } else {
        alert("Gagal memproses Ringkasan AI: " + (res.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };`;

  if (content.includes(oldAiSummaryFunc)) {
    content = content.replace(oldAiSummaryFunc, newAiSummaryFunc);
    console.log(`Updated AI summary functions in ${path}.`);
  }

  // 2. Make the Wand2 AI button ALWAYS visible and trigger auto summary in onOcrComplete
  const oldOcrPanelCall = `                      onOcrComplete={(text) => setOcrRawText(text)}`;
  const newOcrPanelCall = `                      onOcrComplete={(text) => {
                        setOcrRawText(text);
                        triggerAiSummary(text);
                      }}`;

  if (content.includes(oldOcrPanelCall)) {
    content = content.replace(oldOcrPanelCall, newOcrPanelCall);
    console.log(`Updated onOcrComplete in ${path}.`);
  }

  const oldButtonRender = `                    {ocrRawText && (
                      <button
                        type="button"
                        onClick={handleGenerateAiSummary}
                        disabled={isGeneratingSummary}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs border border-indigo-200/60 disabled:opacity-50"
                      >
                        {isGeneratingSummary ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Menganalisis...
                          </>
                        ) : (
                          <>
                            <Wand2 size={14} /> Jalankan Analisis AI
                          </>
                        )}
                      </button>
                    )}`;

  const newButtonRender = `                    <button
                      type="button"
                      onClick={handleGenerateAiSummary}
                      disabled={isGeneratingSummary}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs border border-indigo-200/60 disabled:opacity-50"
                    >
                      {isGeneratingSummary ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Menganalisis...
                        </>
                      ) : (
                        <>
                          <Wand2 size={14} /> Jalankan Analisis AI
                        </>
                      )}
                    </button>`;

  if (content.includes(oldButtonRender)) {
    content = content.replace(oldButtonRender, newButtonRender);
    console.log(`AI Button is now ALWAYS visible in ${path}.`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

const tambahPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

updatePage(tambahPath);
updatePage(editPath);

console.log('All visible and auto-run edits finished.');
