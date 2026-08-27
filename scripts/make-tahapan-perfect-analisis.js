const fs = require('fs');

function applyPerfectAnalisis(path, isEditPage = false) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Add imports at the top
  const oldImportAnchor = `import OCRPanelPengajuan from`;
  const newImports = `import DataPendukung from '@/app/(dashboard)/analisis/components/DataPendukung';\nimport DataForm from '@/app/(dashboard)/analisis/components/DataForm';\nimport OCRPanelPengajuan from`;
  
  if (content.includes(oldImportAnchor) && !content.includes('import DataPendukung')) {
    content = content.replace(oldImportAnchor, newImports);
    console.log(`Imports added to ${path}`);
  }

  // 2. Update fetchRiwayatUnit implementation
  const oldFetchRiwayat = `  const fetchRiwayatUnit = async (unitName: string) => {
    if (!unitName) return;
    try {
      const { data } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, perihal, total_anggaran, nominal_disetujui, keputusan, created_at')
        .ilike('unit_pengirim', \`%\${unitName}%\`)
        .order('created_at', { ascending: false });

      if (data) {
        setRiwayatUsulanUnit(data);
      }
    } catch (e) {
      console.error("Gagal load riwayat unit:", e);
    }
  };`;

  const newFetchRiwayat = `  const fetchRiwayatUnit = async (unitName: string) => {
    if (!unitName) return;
    try {
      const { data } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, perihal, total_anggaran, nominal_disetujui, keputusan, analisis_html, created_at')
        .ilike('unit_pengirim', \`%\${unitName}%\`)
        .order('created_at', { ascending: false });

      if (data) {
        const processed = data.map(item => {
          let subyekSimaster = (item as any).subyek_persuratan_simaster || '';
          let keputusan = item.keputusan || '';
          let nominalDisetujui = item.nominal_disetujui || '0';
          let ringkasanHtml = '';

          if (item.analisis_html) {
            try {
              const parsed = JSON.parse(item.analisis_html);
              if (!subyekSimaster && parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
              if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
              if (nominalDisetujui === '0' && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
              if (parsed.analisis) ringkasanHtml = parsed.analisis;
            } catch(e) {
              ringkasanHtml = item.analisis_html;
            }
          }

          return {
            ...item,
            subyek_persuratan_simaster: subyekSimaster,
            keputusan: keputusan || 'diajukan',
            nominal_disetujui: nominalDisetujui,
            ringkasan_html: ringkasanHtml
          };
        });
        setRiwayatUsulanUnit(processed);
      }
    } catch (e) {
      console.error("Gagal load riwayat unit:", e);
    }
  };`;

  if (content.includes(oldFetchRiwayat)) {
    content = content.replace(oldFetchRiwayat, newFetchRiwayat);
    console.log(`fetchRiwayatUnit updated in ${path}`);
  }

  // 3. Update handleSelectAnalisis mapping to include rekomendasi_html
  const oldSetSelectedAnalisis = `    setSelectedAnalisis(item);
    setIsModalOpen(false);
  };`;

  const newSetSelectedAnalisis = `    const selectedItem = {
      ...item,
      rekomendasi_html: item.ringkasan_html || item.analisis_html || ''
    };
    setSelectedAnalisis(selectedItem);
    setIsModalOpen(false);
  };`;

  if (content.includes(oldSetSelectedAnalisis)) {
    content = content.replace(oldSetSelectedAnalisis, newSetSelectedAnalisis);
    console.log(`handleSelectAnalisis mapping updated in ${path}`);
  }

  // 4. Update initial loading details mapping in edit/[id]/page.tsx
  if (isEditPage) {
    const oldEditFetchInitial = `        if (pagu.no_surat_pengajuan && allAnalisis && pagu.ringkasan_surat_pengajuan && (pagu.ringkasan_surat_pengajuan.includes('<!--imported-->') || pagu.ringkasan_surat_pengajuan.startsWith('{"'))) {
          const matchedAnalisis = allAnalisis.find(a => a.no_surat === pagu.no_surat_pengajuan);
          if (matchedAnalisis) {
            setSelectedAnalisis(matchedAnalisis);`;

    const newEditFetchInitial = `        if (pagu.no_surat_pengajuan && allAnalisis && pagu.ringkasan_surat_pengajuan && (pagu.ringkasan_surat_pengajuan.includes('<!--imported-->') || pagu.ringkasan_surat_pengajuan.startsWith('{"'))) {
          const matchedAnalisis = allAnalisis.find(a => a.no_surat === pagu.no_surat_pengajuan);
          if (matchedAnalisis) {
            const selectedItem = {
              ...matchedAnalisis,
              rekomendasi_html: matchedAnalisis.ringkasan_html || matchedAnalisis.analisis_html || ''
            };
            setSelectedAnalisis(selectedItem);`;

    if (content.includes(oldEditFetchInitial)) {
      content = content.replace(oldEditFetchInitial, newEditFetchInitial);
      console.log(`fetchInitialData selectedItem mapped in ${path}`);
    }
  }

  // 5. Replace Stage 2 and Stage 3 Containers
  const oldStage2and3Containers = `        {/* ================= TAHAP 2 (IMPORTED): RINCIAN KEGIATAN & PAGU ================= */}
        {activeStep === 'step2' && selectedAnalisis && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Pagu Historis / Posisi Pagu Card */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-200/80 space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <BarChart3 className="text-indigo-600" /> Posisi Pagu Unit Kerja (per tahun usulan)
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Kalkulasi posisi pagu berjalan dan pagu setelah penambahan/efisiensi.
                </p>
              </div>

              {selectedAnalisisHistoris.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Tidak ada data posisi pagu untuk analisis ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedAnalisisHistoris.map((hRow: any, index: number) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4">
                      <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-800 font-sans">Tahun Anggaran {hRow.tahun}</span>
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-md">
                          {hRow.keterangan || 'Data Pagu'}
                        </span>
                      </div>
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-100 font-mono">
                          <tr>
                            <td className="py-2 text-slate-600 font-sans">Pagu Awal:</td>
                            <td className="py-2 text-right font-bold text-slate-900">Rp {formatNumber(hRow.pagu_awal || 0)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-slate-600 font-sans">Pengalihan (+/-):</td>
                            <td className="py-2 text-right font-bold text-slate-900">Rp {formatNumber(hRow.pengalihan || 0)}</td>
                          </tr>
                          {hRow.tambah_pagu_penugasan > 0 && (
                            <tr className="text-emerald-700 font-bold">
                              <td className="py-2 font-sans">Tambah Pagu Penugasan +:</td>
                              <td className="py-2 text-right">+ Rp {formatNumber(hRow.tambah_pagu_penugasan)}</td>
                            </tr>
                          )}
                          {hRow.tambah_pagu_inisiatif > 0 && (
                            <tr className="text-emerald-700 font-bold">
                              <td className="py-2 font-sans">Tambah Pagu Inisiatif +:</td>
                              <td className="py-2 text-right">+ Rp {formatNumber(hRow.tambah_pagu_inisiatif)}</td>
                            </tr>
                          )}
                          {hRow.efisiensi > 0 && (
                            <tr className="text-rose-700 font-bold">
                              <td className="py-2 font-sans">Efisiensi -:</td>
                              <td className="py-2 text-right">- Rp {formatNumber(hRow.efisiensi)}</td>
                            </tr>
                          )}
                          <tr className="border-t border-slate-300 font-bold text-indigo-900 text-sm">
                            <td className="py-2 font-sans">Total Pagu:</td>
                            <td className="py-2 text-right">Rp {formatNumber(hRow.total_pagu || 0)}</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-slate-600 font-sans">Realisasi:</td>
                            <td className="py-2 text-right font-bold text-rose-700">Rp {formatNumber(hRow.realisasi || 0)}</td>
                          </tr>
                          <tr className="border-t border-slate-300 font-bold text-slate-900">
                            <td className="py-2 font-sans">Sisa Pagu:</td>
                            <td className="py-2 text-right">Rp {formatNumber(hRow.sisa_pagu || 0)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail Kegiatan/Rincian Belanja Card */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-200/80 space-y-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Layers className="text-indigo-600" /> Rincian Belanja & Rencana Kegiatan
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Daftar item kegiatan usulan penambahan pagu yang divalidasi.
                </p>
              </div>

              {selectedAnalisisDetail.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Tidak ada rincian belanja untuk analisis ini.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-3.5 text-center w-10">No</th>
                        <th className="px-4 py-3.5">Uraian Kegiatan / Belanja</th>
                        <th className="px-4 py-3.5 text-right">Pagu Anggaran</th>
                        <th className="px-4 py-3.5 text-right">Realisasi</th>
                        <th className="px-4 py-3.5 text-right">Sisa Pagu</th>
                        <th className="px-4 py-3.5 text-center w-28">% Serapan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {selectedAnalisisDetail.map((item: any, i: number) => {
                        const pagu = Number(item.anggaran || 0);
                        const real = Number(item.realisasi || 0);
                        const sisa = pagu - real;
                        const pct = pagu > 0 ? Math.min(100, Math.round((real / pagu) * 100)) : 0;
                        return (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="px-3 py-3 text-center text-slate-400 font-bold">{item.no_urut || i + 1}</td>
                            <td className="px-4 py-3 font-sans font-medium text-slate-800">{item.uraian_kegiatan}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">Rp {formatNumber(pagu)}</td>
                            <td className="px-4 py-3 text-right text-emerald-700 font-bold">Rp {formatNumber(real)}</td>
                            <td className="px-4 py-3 text-right text-amber-800 font-bold">Rp {formatNumber(sisa)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={\`h-full rounded-full \${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-amber-500'}\`}
                                    style={{ width: \`\${pct}%\` }}
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 w-8 text-right font-mono">\${pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => setActiveStep('step1')}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('step3')}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all"
              >
                Lanjutkan ke Ringkasan
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 3 (IMPORTED): RINGKASAN AI & PRATINJAU PDF ================= */}
        {activeStep === 'step3' && selectedAnalisis && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Kiri: Ringkasan AI */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-200/80 space-y-6">
                <div>
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-indigo-600" /> Ringkasan Analisis AI
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 font-sans">
                    Hasil ringkasan usulan dan validasi kriteria aturan RKAT dari AI.
                  </p>
                </div>
                <div 
                  className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-800 leading-relaxed font-sans [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-bold max-h-[500px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: formData.ringkasan_surat_pengajuan }}
                />
              </div>

              {/* Kanan: PDF Preview */}
              <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-200/80 space-y-6 flex flex-col min-h-[500px]">
                <div>
                  <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Paperclip className="text-indigo-600" /> Lampiran Surat Usulan
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Pratinjau dokumen surat pengusul yang dianalisis.
                  </p>
                </div>
                {formData.link_surat_pengajuan || selectedAnalisis.link_lampiran ? (
                  <div className="flex-1 min-h-[400px] border border-slate-200 rounded-3xl overflow-hidden relative shadow-sm">
                    <iframe 
                      src={\`\${formData.link_surat_pengajuan || selectedAnalisis.link_lampiran}#toolbar=0\`}
                      className="w-full h-full min-h-[400px] border-0"
                      title="PDF Preview"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                    <Info className="text-slate-400 mb-2" size={24} />
                    <span className="text-xs font-medium text-slate-500">Tidak ada lampiran PDF surat pengajuan.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => setActiveStep('step2')}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('step4')}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all"
              >
                Lanjutkan ke Tanggapan
              </button>
            </div>
          </div>
        )}`;

  const newStage2and3Containers = `        {/* ================= TAHAP 2 (IMPORTED): RINCIAN KEGIATAN & PAGU (EXACTLY LIKE ANALISIS) ================= */}
        {activeStep === 'step2' && selectedAnalisis && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 lg:p-8 shadow-sm">
              <DataPendukung 
                mainData={selectedAnalisis} 
                setMainData={() => {}} 
                detailData={selectedAnalisisDetail} 
                setDetailData={() => {}} 
                historisData={selectedAnalisisHistoris} 
                setHistorisData={() => {}} 
                renderMode="tabs" 
                readOnly={true} 
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => setActiveStep('step1')}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('step3')}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all"
              >
                Lanjutkan ke Posisi Pagu & AI
              </button>
            </div>
          </div>
        )}

        {/* ================= TAHAP 3 (IMPORTED): POSISI PAGU & AI ANALYSIS (EXACTLY LIKE ANALISIS) ================= */}
        {activeStep === 'step3' && selectedAnalisis && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 lg:p-8 shadow-sm">
              <DataForm 
                mainData={selectedAnalisis} 
                setMainData={(newVal: any) => {
                  if (newVal && newVal.rekomendasi_html) {
                    setFormData((prev: any) => ({
                      ...prev,
                      ringkasan_surat_pengajuan: newVal.rekomendasi_html
                    }));
                    setSelectedAnalisis((prev: any) => ({
                      ...prev,
                      rekomendasi_html: newVal.rekomendasi_html
                    }));
                  }
                }} 
                detailData={selectedAnalisisDetail} 
                setDetailData={() => {}} 
                historisData={selectedAnalisisHistoris} 
                setHistorisData={() => {}} 
                section="step3"
                readOnly={true} 
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-end gap-3 pb-8">
              <button
                type="button"
                onClick={() => setActiveStep('step2')}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => setActiveStep('step4')}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all"
              >
                Lanjutkan ke Tanggapan
              </button>
            </div>
          </div>
        )}`;

  if (content.includes(oldStage2and3Containers)) {
    content = content.replace(oldStage2and3Containers, newStage2and3Containers);
    console.log(`Stage 2 & 3 replaced with exact Analisis view for ${path}`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

const tambahPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

applyPerfectAnalisis(tambahPage, false);
applyPerfectAnalisis(editPage, true);

console.log('Tahapan perfect analisis update completed.');
