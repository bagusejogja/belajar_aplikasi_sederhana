const fs = require('fs');

function updatePageMultistep(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Add states for selectedAnalisisDetail and selectedAnalisisHistoris
  const oldStateAnchor = `  const [ocrRawText, setOcrRawText] = useState('');`;
  const newStateAnchor = `  const [ocrRawText, setOcrRawText] = useState('');
  const [selectedAnalisisDetail, setSelectedAnalisisDetail] = useState<any[]>([]);
  const [selectedAnalisisHistoris, setSelectedAnalisisHistoris] = useState<any[]>([]);`;

  if (content.includes(oldStateAnchor) && !content.includes('selectedAnalisisDetail')) {
    content = content.replace(oldStateAnchor, newStateAnchor);
    console.log(`Detail/Historis states added to ${path}.`);
  }

  // 2. Update handleClearSelection to clear details
  const oldClearSelection = `  const handleClearSelection = () => {
    setSelectedAnalisis(null);
  };`;

  const newClearSelection = `  const handleClearSelection = () => {
    setSelectedAnalisis(null);
    setSelectedAnalisisDetail([]);
    setSelectedAnalisisHistoris([]);
    setFormData((prev: any) => ({
      ...prev,
      id_analisis: null
    }));
  };`;

  if (content.includes(oldClearSelection)) {
    content = content.replace(oldClearSelection, newClearSelection);
    console.log(`handleClearSelection updated in ${path}.`);
  }

  // 3. Update handleSelectAnalisis to fetch details from Supabase
  const oldSelectAnalisis = `    setFormData(prev => ({
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
      ringkasan_surat_pengajuan: item.ringkasan_html ? (item.ringkasan_html + '<!--imported-->') : prev.ringkasan_surat_pengajuan
    }));

    setSelectedAnalisis(item);
    setIsModalOpen(false);
  };`;

  const newSelectAnalisis = `    setFormData(prev => ({
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
    }));

    // Fetch details
    try {
      const [ { data: detailData }, { data: histData } ] = await Promise.all([
        supabase.from('app_detail_realisasi').select('*').eq('id_analisis', item.id_analisis).order('no_urut', { ascending: true }),
        supabase.from('app_pagu_historis').select('*').eq('id_analisis', item.id_analisis).order('tahun', { ascending: true })
      ]);
      
      if (detailData) setSelectedAnalisisDetail(detailData);
      if (histData) setSelectedAnalisisHistoris(histData);
    } catch (err) {
      console.error("Error fetching analysis details:", err);
    }

    setSelectedAnalisis(item);
    setIsModalOpen(false);
  };`;

  if (content.includes(oldSelectAnalisis)) {
    content = content.replace(oldSelectAnalisis, newSelectAnalisis);
    console.log(`handleSelectAnalisis updated in ${path}.`);
  }

  // 4. In page state, change activeStep state type to step1..4
  const oldActiveStepState = `const [activeStep, setActiveStep] = useState<'step1' | 'step2'>('step1');`;
  const newActiveStepState = `const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3' | 'step4'>('step1');`;
  if (content.includes(oldActiveStepState)) {
    content = content.replace(oldActiveStepState, newActiveStepState);
  }

  // 5. Add safety useEffect for activeStep tab bounds
  const oldUseEffectAnchor = `  useEffect(() => {
    fetchInitialData();
  }, []);`;

  const newUseEffectAnchor = `  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedAnalisis && (activeStep === 'step3' || activeStep === 'step4')) {
      setActiveStep('step2');
    }
  }, [selectedAnalisis, activeStep]);`;

  if (content.includes(oldUseEffectAnchor) && !content.includes('activeStep === \'step3\'')) {
    content = content.replace(oldUseEffectAnchor, newUseEffectAnchor);
    console.log(`useEffect safety guard added to ${path}.`);
  }

  // 6. Update step tabs rendering to be dynamic
  const oldStepTabs = `      <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-6">
        {[
          { id: 'step1', step: '1', title: '1. Pengajuan Usulan', subtitle: 'Upload Surat Pengajuan & AI', icon: FileText },
          { id: 'step2', step: '2', title: '2. Tanggapan & Keputusan', subtitle: 'Status Akhir & Simpan', icon: CheckCircle2 },
        ].map((tab) => {`;

  const newStepTabs = `      <div className="flex flex-wrap gap-4 border-b border-gray-200 pb-6">
        {(selectedAnalisis 
          ? [
              { id: 'step1', step: '1', title: '1. Pengajuan Usulan', subtitle: 'Data Surat Pengajuan', icon: FileText },
              { id: 'step2', step: '2', title: '2. Rincian & Pagu', subtitle: 'Detail Kegiatan & Pagu', icon: Layers },
              { id: 'step3', step: '3', title: '3. Ringkasan & Lampiran', subtitle: 'AI Summary & Surat Masuk', icon: Sparkles },
              { id: 'step4', step: '4', title: '4. Tanggapan & Simpan', subtitle: 'Persetujuan & Surat Keluar', icon: CheckCircle2 },
            ]
          : [
              { id: 'step1', step: '1', title: '1. Pengajuan Usulan', subtitle: 'Upload Surat Pengajuan & AI', icon: FileText },
              { id: 'step2', step: '2', title: '2. Tanggapan & Keputusan', subtitle: 'Status Akhir & Simpan', icon: CheckCircle2 },
            ]
        ).map((tab) => {`;

  if (content.includes(oldStepTabs)) {
    content = content.replace(oldStepTabs, newStepTabs);
    console.log(`Dynamic step tabs updated in ${path}.`);
  }

  // 7. Update Step 1 Next Button to go to dynamic next step
  const oldStep1Next = `            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveStep('step2')}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                Selanjutnya: Tanggapan & Keputusan <ChevronRight size={16} />
              </button>
            </div>`;

  const newStep1Next = `            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(selectedAnalisis ? 'step2' : 'step2')}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                Selanjutnya: {selectedAnalisis ? 'Rincian & Pagu' : 'Tanggapan & Keputusan'} <ChevronRight size={16} />
              </button>
            </div>`;

  if (content.includes(oldStep1Next)) {
    content = content.replace(oldStep1Next, newStep1Next);
    console.log(`Step 1 Next button updated in ${path}.`);
  }

  // 8. Change activeStep check for Step 2 Tanggapan container
  const oldStep2Check = `        {/* ================= TAHAP 2: POSISI PAGU & GRAFIK (VIEW) ================= */}
        {activeStep === 'step2' && (`;

  const newStep2Check = `        {/* ================= TAHAP 2/4: TANGGAPAN & KEPUTUSAN ================= */}
        {((activeStep === 'step2' && !selectedAnalisis) || (activeStep === 'step4' && selectedAnalisis)) && (`;

  if (content.includes(oldStep2Check)) {
    content = content.replace(oldStep2Check, newStep2Check);
    console.log(`Step 2/4 conditional check updated in ${path}.`);
  }

  // 9. Update Kembali button in Tanggapan container
  const oldKembaliTanggapan = `            {/* STEP 3 BUTTONS */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setActiveStep('step1')}
                className="px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Kembali Ke Tahap 1
              </button>
            </div>`;

  const newKembaliTanggapan = `            {/* STEP 2/4 BUTTONS */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(selectedAnalisis ? 'step3' : 'step1')}
                className="px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Kembali ke {selectedAnalisis ? 'Ringkasan' : 'Tahap 1'}
              </button>
            </div>`;

  if (content.includes(oldKembaliTanggapan)) {
    content = content.replace(oldKembaliTanggapan, newKembaliTanggapan);
    console.log(`Kembali button in Tanggapan container updated in ${path}.`);
  }

  // 10. Render Step 2 and Step 3 imported pages before Step 4 container
  const oldStep2ContainerMarker = `        {/* ================= TAHAP 2/4: TANGGAPAN & KEPUTUSAN ================= */}`;
  const importedStepsHTML = `        {/* ================= TAHAP 2 (IMPORTED): RINCIAN KEGIATAN & PAGU ================= */}
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
        )}

        {/* ================= TAHAP 2/4: TANGGAPAN & KEPUTUSAN ================= */}`;

  if (content.includes(oldStep2ContainerMarker)) {
    content = content.replace(oldStep2ContainerMarker, importedStepsHTML);
    console.log(`Tahap 2 & Tahap 3 containers added to ${path}.`);
  }

  // 11. Add id_analisis mapping in handleSubmit
  const oldSubmitLogic = `      // Map form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'unit_id') {
          data.append(key, value?.value || '');`;

  const newSubmitLogic = `      // Map form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'unit_id') {
          data.append(key, value?.value || '');
        } else if (key === 'id_analisis' && value) {
          data.append(key, value.toString());`;

  if (content.includes(oldSubmitLogic)) {
    content = content.replace(oldSubmitLogic, newSubmitLogic);
    console.log(`id_analisis added to handleSubmit in ${path}.`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

// Update fetchInitialData logic inside edit/[id]/page.tsx to fetch details on load
const editPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';
if (fs.existsSync(editPath)) {
  let editContent = fs.readFileSync(editPath, 'utf8');
  editContent = editContent.replace(/\r\n/g, '\n');

  const oldFetchDetails = `        // Also look up if this record is matching any of the analisis list to restore selection
        if (pagu.no_surat_pengajuan && allAnalisis && pagu.ringkasan_surat_pengajuan && (pagu.ringkasan_surat_pengajuan.includes('<!--imported-->') || pagu.ringkasan_surat_pengajuan.startsWith('{"'))) {
          const matchedAnalisis = allAnalisis.find(a => a.no_surat === pagu.no_surat_pengajuan);
          if (matchedAnalisis) {
            setSelectedAnalisis(matchedAnalisis);
          }
        }`;

  const newFetchDetails = `        // Also look up if this record is matching any of the analisis list to restore selection
        if (pagu.no_surat_pengajuan && allAnalisis && pagu.ringkasan_surat_pengajuan && (pagu.ringkasan_surat_pengajuan.includes('<!--imported-->') || pagu.ringkasan_surat_pengajuan.startsWith('{"'))) {
          const matchedAnalisis = allAnalisis.find(a => a.no_surat === pagu.no_surat_pengajuan);
          if (matchedAnalisis) {
            setSelectedAnalisis(matchedAnalisis);
            
            // Fetch details for edit page as well
            Promise.all([
              supabase.from('app_detail_realisasi').select('*').eq('id_analisis', matchedAnalisis.id_analisis).order('no_urut', { ascending: true }),
              supabase.from('app_pagu_historis').select('*').eq('id_analisis', matchedAnalisis.id_analisis).order('tahun', { ascending: true })
            ]).then(([ { data: detailData }, { data: histData } ]) => {
              if (detailData) setSelectedAnalisisDetail(detailData);
              if (histData) setSelectedAnalisisHistoris(histData);
            }).catch(err => {
              console.error("Error fetching analysis details in edit mode:", err);
            });
          }
        }`;

  if (editContent.includes(oldFetchDetails)) {
    editContent = editContent.replace(oldFetchDetails, newFetchDetails);
    console.log('fetchInitialData details fetching added to edit/page.tsx.');
  }

  editContent = editContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(editPath, editContent);
}

const tambahPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';

updatePageMultistep(tambahPath);
updatePageMultistep(editPath);

console.log('All dynamic multistep view updates completed.');
