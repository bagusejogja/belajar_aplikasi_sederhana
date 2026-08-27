const fs = require('fs');

// 1. Update DataForm.tsx to hide Generate Rekomendasi (AI) button if readOnly is true
const dataFormPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/analisis/components/DataForm.tsx';
if (fs.existsSync(dataFormPath)) {
  let formContent = fs.readFileSync(dataFormPath, 'utf8');
  formContent = formContent.replace(/\r\n/g, '\n');

  const oldGenButton = `                <button onClick={handleGenerateRekomendasi} disabled={isGeneratingAI} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
                  {isGeneratingAI ? <div className="w-3 h-3 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin"/> : <Wand2 size={12}/>} 
                  Generate Rekomendasi (AI)
                </button>`;

  const newGenButton = `                {!readOnly && (
                  <button onClick={handleGenerateRekomendasi} disabled={isGeneratingAI} className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50">
                    {isGeneratingAI ? <div className="w-3 h-3 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin"/> : <Wand2 size={12}/>} 
                    Generate Rekomendasi (AI)
                  </button>
                )}`;

  if (formContent.includes(oldGenButton)) {
    formContent = formContent.replace(oldGenButton, newGenButton);
    console.log('Generate Rekomendasi button locked in DataForm.tsx');
  }

  formContent = formContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(dataFormPath, formContent);
}

// 2. Update DataPendukung.tsx to hide Paste Rekap Realisasi (Excel) section if readOnly is true
const dataPendukungPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/analisis/components/DataPendukung.tsx';
if (fs.existsSync(dataPendukungPath)) {
  let pendContent = fs.readFileSync(dataPendukungPath, 'utf8');
  pendContent = pendContent.replace(/\r\n/g, '\n');

  const oldPasteSection = `                     <div className="mt-4 bg-gray-50 border border-gray-200 p-3 rounded-xl">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><ClipboardPaste size={14}/> Paste Rekap Realisasi (Excel)</label>
                      <textarea 
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs text-gray-700 focus:border-emerald-500 focus:bg-white transition-colors shadow-sm" 
                        rows={2} 
                        placeholder="Klik di sini lalu Paste (Ctrl+V) tabel dari Excel (Kolom 1: No, 2: Unit, 3: Anggaran, 4: Realisasi)" 
                        onPaste={handlePasteRealisasi}
                        value={""}
                        onChange={() => {}}
                      />
                      {parsedPreview.length > 0 && (
                        <div className="mt-3 bg-white rounded-lg border border-cyan-200 overflow-hidden text-xs max-h-60 overflow-y-auto shadow-inner">
                          <div className="bg-cyan-50 p-2 font-bold text-cyan-800 border-b border-cyan-200 flex justify-between">
                            <span>Data Terdeteksi ({parsedPreview.length} Unit)</span>
                            <button onClick={() => setParsedPreview([])} className="text-gray-500 hover:text-red-500 underline text-[10px]">Tutup Preview</button>
                          </div>
                          <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100">
                              {parsedPreview.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="p-2 text-gray-500 w-16">{item.kode}</td>
                                  <td className="p-2 text-gray-700">{item.nama}</td>
                                  <td className="p-2 text-right font-bold text-emerald-600">Rp {formatRp(item.val)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>`;

  const newPasteSection = `                     {!readOnly && (
                      <div className="mt-4 bg-gray-50 border border-gray-200 p-3 rounded-xl">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><ClipboardPaste size={14}/> Paste Rekap Realisasi (Excel)</label>
                        <textarea 
                          className="w-full p-2 bg-white border border-gray-200 rounded-lg outline-none text-xs text-gray-700 focus:border-emerald-500 focus:bg-white transition-colors shadow-sm" 
                          rows={2} 
                          placeholder="Klik di sini lalu Paste (Ctrl+V) tabel dari Excel (Kolom 1: No, 2: Unit, 3: Anggaran, 4: Realisasi)" 
                          onPaste={handlePasteRealisasi}
                          value={""}
                          onChange={() => {}}
                        />
                        {parsedPreview.length > 0 && (
                          <div className="mt-3 bg-white rounded-lg border border-cyan-200 overflow-hidden text-xs max-h-60 overflow-y-auto shadow-inner">
                            <div className="bg-cyan-50 p-2 font-bold text-cyan-800 border-b border-cyan-200 flex justify-between">
                              <span>Data Terdeteksi ({parsedPreview.length} Unit)</span>
                              <button onClick={() => setParsedPreview([])} className="text-gray-500 hover:text-red-500 underline text-[10px]">Tutup Preview</button>
                            </div>
                            <table className="w-full text-left">
                              <tbody className="divide-y divide-gray-100">
                                {parsedPreview.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-2 text-gray-500 w-16">{item.kode}</td>
                                    <td className="p-2 text-gray-700">{item.nama}</td>
                                    <td className="p-2 text-right font-bold text-emerald-600">Rp {formatRp(item.val)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}`;

  if (pendContent.includes(oldPasteSection)) {
    pendContent = pendContent.replace(oldPasteSection, newPasteSection);
    console.log('Paste Excel section locked/hidden in DataPendukung.tsx');
  }

  pendContent = pendContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(dataPendukungPath, pendContent);
}

// 3. Update both tambah/page.tsx and edit/[id]/page.tsx to pass pagu_berjalan, make Link GDrive read-only, and Quill read-only
function applyPageFixes(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Parse pagu_berjalan inside handleSelectAnalisis
  const oldMapping = `      ringkasan_surat_pengajuan: item.ringkasan_html ? (item.ringkasan_html + '<!--imported-->') : prev.ringkasan_surat_pengajuan,
      id_analisis: item.id_analisis
    }));`;

  const newMapping = `      ringkasan_surat_pengajuan: item.ringkasan_html ? (item.ringkasan_html + '<!--imported-->') : prev.ringkasan_surat_pengajuan,
      id_analisis: item.id_analisis
    }));`;

  // Actually, we need to map pagu_berjalan:
  const oldSelectMapping = `    setFormData(prev => ({
      ...prev,
      unit_id: matchedUnit || prev.unit_id,
      no_surat_pengajuan: item.no_surat || prev.no_surat_pengajuan,
      tanggal_surat_pengajuan: item.tanggal_surat || prev.tanggal_surat_pengajuan,
      hal_surat_pengajuan: item.perihal || prev.hal_surat_pengajuan,
      subyek_pengajuan_di_simaster_persuratan: item.subyek_persuratan_simaster || prev.subyek_pengajuan_di_simaster_persuratan,
      nominal_diajukan: numDiajukan || prev.nominal_diajukan,
      nominal_tanggapan: numDisetujui !== '0' ? numDisetujui : prev.nominal_tanggapan,
      status_pengajuan: statusMapped,
      link_surat_pengajuan: item.link_lampiran || prev.link_surat_pengajuan,
      ringkasan_surat_pengajuan: item.ringkasan_html ? (item.ringkasan_html + '<!--imported-->') : prev.ringkasan_surat_pengajuan,
      id_analisis: item.id_analisis
    }));`;

  const newSelectMapping = `    let paguBerjalan = {};
    if (item.analisis_html) {
      try {
        const parsed = JSON.parse(item.analisis_html);
        if (parsed.pagu_berjalan) paguBerjalan = parsed.pagu_berjalan;
      } catch(e) {}
    }

    setFormData(prev => ({
      ...prev,
      unit_id: matchedUnit || prev.unit_id,
      no_surat_pengajuan: item.no_surat || prev.no_surat_pengajuan,
      tanggal_surat_pengajuan: item.tanggal_surat || prev.tanggal_surat_pengajuan,
      hal_surat_pengajuan: item.perihal || prev.hal_surat_pengajuan,
      subyek_pengajuan_di_simaster_persuratan: item.subyek_persuratan_simaster || prev.subyek_pengajuan_di_simaster_persuratan,
      nominal_diajukan: numDiajukan || prev.nominal_diajukan,
      nominal_tanggapan: numDisetujui !== '0' ? numDisetujui : prev.nominal_tanggapan,
      status_pengajuan: statusMapped,
      link_surat_pengajuan: item.link_lampiran || prev.link_surat_pengajuan,
      ringkasan_surat_pengajuan: item.ringkasan_html ? (item.ringkasan_html + '<!--imported-->') : prev.ringkasan_surat_pengajuan,
      id_analisis: item.id_analisis
    }));`;

  if (content.includes(oldSelectMapping)) {
    content = content.replace(oldSelectMapping, newSelectMapping);
    console.log(`handleSelectAnalisis pagu_berjalan parsing added to ${path}`);
  }

  // Update selectedItem initialization in handleSelectAnalisis
  const oldSelectedItem = `    const selectedItem = {
      ...item,
      rekomendasi_html: item.ringkasan_html || item.analisis_html || ''
    };`;

  const newSelectedItem = `    let pBerjalanItem = {};
    if (item.analisis_html) {
      try {
        const parsed = JSON.parse(item.analisis_html);
        if (parsed.pagu_berjalan) pBerjalanItem = parsed.pagu_berjalan;
      } catch(e) {}
    }
    const selectedItem = {
      ...item,
      pagu_berjalan: pBerjalanItem,
      rekomendasi_html: item.ringkasan_html || item.analisis_html || ''
    };`;

  if (content.includes(oldSelectedItem)) {
    content = content.replace(oldSelectedItem, newSelectedItem);
  }

  // If edit page, update fetchInitialData load mapping for pagu_berjalan
  const oldEditLoad = `            const selectedItem = {
              ...matchedAnalisis,
              rekomendasi_html: (matchedAnalisis as any).ringkasan_html || (matchedAnalisis as any).analisis_html || ''
            };`;

  const newEditLoad = `            let pBerjalanItem = {};
            if ((matchedAnalisis as any).analisis_html) {
              try {
                const parsed = JSON.parse((matchedAnalisis as any).analisis_html);
                if (parsed.pagu_berjalan) pBerjalanItem = parsed.pagu_berjalan;
              } catch(e) {}
            }
            const selectedItem = {
              ...matchedAnalisis,
              pagu_berjalan: pBerjalanItem,
              rekomendasi_html: (matchedAnalisis as any).ringkasan_html || (matchedAnalisis as any).analisis_html || ''
            };`;

  if (content.includes(oldEditLoad)) {
    content = content.replace(oldEditLoad, newEditLoad);
    console.log(`fetchInitialData selectedItem pagu_berjalan mapping added to ${path}`);
  }

  // Make Link GDrive input read-only
  const oldLinkInput = `                  <div className="relative">
                    <Paperclip size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      name="link_surat_pengajuan"
                      value={formData.link_surat_pengajuan}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-blue-100 transition-all text-sm italic text-blue-600 shadow-sm"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>`;

  const newLinkInput = `                  <div className="relative">
                    <Paperclip size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      name="link_surat_pengajuan"
                      readOnly={isReadOnlyPengajuan}
                      value={formData.link_surat_pengajuan}
                      onChange={handleInputChange}
                      className={\`w-full border rounded-2xl pl-12 pr-4 py-4 outline-none transition-all text-sm italic shadow-sm \${
                        isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-800 border-slate-200 cursor-not-allowed font-mono' : 'bg-gray-50 border-gray-100 text-blue-600 focus:ring-2 ring-blue-100'
                      }\`}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>`;

  if (content.includes(oldLinkInput)) {
    content = content.replace(oldLinkInput, newLinkInput);
    console.log(`Link GDrive input locked in ${path}`);
  }

  // Make Quill editor read-only in Tab 1
  const oldQuillEditor = `                  <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-200">
                    <ReactQuill 
                      theme="snow"
                      value={formData.ringkasan_surat_pengajuan || ''}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, ringkasan_surat_pengajuan: val }))}
                      className="h-[250px] pb-10 [&_.ql-editor_p]:text-justify"
                      placeholder="Tulis ringkasan substansi di sini, atau jalankan Analisis AI setelah upload surat..."
                    />
                  </div>`;

  const newQuillEditor = `                  <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-200">
                    <ReactQuill 
                      theme="snow"
                      value={formData.ringkasan_surat_pengajuan || ''}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, ringkasan_surat_pengajuan: val }))}
                      className="h-[250px] pb-10 [&_.ql-editor_p]:text-justify"
                      placeholder="Tulis ringkasan substansi di sini, atau jalankan Analisis AI setelah upload surat..."
                      readOnly={isReadOnlyPengajuan}
                    />
                  </div>`;

  if (content.includes(oldQuillEditor)) {
    content = content.replace(oldQuillEditor, newQuillEditor);
    console.log(`Quill editor locked in ${path}`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

const tambahPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

applyPageFixes(tambahPage);
applyPageFixes(editPage);

console.log('All lock updates completed.');
