const fs = require('fs');

// 1. Update ai-scan.ts to use stable gemini-1.5-flash and gemini-1.5-flash-8b fallback
const aiScanPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/actions/ai-scan.ts';
if (fs.existsSync(aiScanPath)) {
  let content = fs.readFileSync(aiScanPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldModelCall = `    try {
      var model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      result = await model.generateContent(request);
    } catch (err) {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      result = await fallbackModel.generateContent(request);
    }`;

  const newModelCall = `    try {
      var model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      result = await model.generateContent(request);
    } catch (err) {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
      result = await fallbackModel.generateContent(request);
    }`;

  if (content.includes(oldModelCall)) {
    content = content.replace(oldModelCall, newModelCall);
    console.log('Model names updated to stable 1.5-flash in ai-scan.ts.');
  } else {
    console.log('Warning: oldModelCall not found in ai-scan.ts. Trying single replacements...');
    content = content.replace(/"gemini-flash-latest"/g, '"gemini-1.5-flash"');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(aiScanPath, content);
}

// 2. Helper to update page components with local fallback summary logic
function updatePageFallback(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldTrigger = `  const triggerAiSummary = async (text: string) => {
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
  };`;

  const newTrigger = `  const triggerAiSummary = async (text: string) => {
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
      } else {
        // Fallback local summary
        const localFallback = \`
          <p><strong>Ringkasan Usulan (Sistem Fallback Lokal - AI Sedang Sibuk):</strong></p>
          <ul>
            <li><strong>Unit Pengusul:</strong> \${formData.unit_id?.label || '-'}</li>
            <li><strong>No. Surat Usulan:</strong> \${formData.no_surat_pengajuan || '-'}</li>
            <li><strong>Hal Surat:</strong> \${formData.hal_surat_pengajuan || '-'}</li>
            <li><strong>Nominal yang Diajukan:</strong> Rp \${formatNumber(formData.nominal_diajukan || 0)}</li>
          </ul>
        \`;
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: localFallback
        }));
      }
    } catch (e: any) {
      console.error("Auto AI Summary failed:", e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };`;

  const oldHandle = `  const handleGenerateAiSummary = async () => {
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

  const newHandle = `  const handleGenerateAiSummary = async () => {
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
        const localFallback = \`
          <p><strong>Ringkasan Usulan (Sistem Fallback Lokal - AI Sedang Sibuk):</strong></p>
          <ul>
            <li><strong>Unit Pengusul:</strong> \${formData.unit_id?.label || '-'}</li>
            <li><strong>No. Surat Usulan:</strong> \${formData.no_surat_pengajuan || '-'}</li>
            <li><strong>Hal Surat:</strong> \${formData.hal_surat_pengajuan || '-'}</li>
            <li><strong>Nominal yang Diajukan:</strong> Rp \${formatNumber(formData.nominal_diajukan || 0)}</li>
          </ul>
        \`;
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: localFallback
        }));
        alert("Gemini AI sedang mengalami lonjakan trafik (503). Sistem otomatis mengaktifkan Ringkasan Lokal Fallback agar Anda tetap bisa menyimpan data!");
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };`;

  if (content.includes(oldTrigger)) {
    content = content.replace(oldTrigger, newTrigger);
    console.log(`Auto trigger fallback logic updated in ${path}.`);
  }

  if (content.includes(oldHandle)) {
    content = content.replace(oldHandle, newHandle);
    console.log(`Manual trigger fallback logic updated in ${path}.`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

const tambahPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

updatePageFallback(tambahPath);
updatePageFallback(editPath);

console.log('All fallback edits completed.');
