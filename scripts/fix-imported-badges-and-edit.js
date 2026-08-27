const fs = require('fs');

// 1. Update tambah-pagu/page.tsx badges
const listPagePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/page.tsx';
if (fs.existsSync(listPagePath)) {
  let listContent = fs.readFileSync(listPagePath, 'utf8');
  listContent = listContent.replace(/\r\n/g, '\n');

  // Main table row badge check replacement
  const oldMainBadge = `                            <div>
                              {item.ringkasan_surat_pengajuan && (item.ringkasan_surat_pengajuan.includes('<!--imported-->') || item.ringkasan_surat_pengajuan.startsWith('{"')) ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full shadow-2xs" title="Bersumber dari halaman Analisis Pagu">
                                  <Sparkles size={10} className="text-indigo-600" /> Impor Analisis AI
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full" title="Data diinput manual">
                                  <Edit3 size={10} className="text-slate-500" /> Input Manual
                                </span>
                              )}
                            </div>`;

  const newMainBadge = `                            <div>
                              {item.id_analisis ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full shadow-2xs" title="Bersumber dari halaman Analisis Pagu">
                                  <Sparkles size={10} className="text-indigo-600" /> Impor Analisis AI
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full" title="Data diinput manual">
                                  <Edit3 size={10} className="text-slate-500" /> Input Manual
                                </span>
                              )}
                            </div>`;

  if (listContent.includes(oldMainBadge)) {
    listContent = listContent.replace(oldMainBadge, newMainBadge);
    console.log('Main page table badge check updated.');
  }

  // Accordion subItem row badge check replacement
  const oldSubBadge = `                                                {analisisNoSuratSet.has((subItem.no_surat_pengajuan || '').trim().toLowerCase()) ? (
                                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-full">
                                                    <Sparkles size={9} className="text-indigo-600" /> AI
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded-full">
                                                    <Edit3 size={9} className="text-slate-500" /> Manual
                                                  </span>
                                                )}`;

  const newSubBadge = `                                                {subItem.id_analisis ? (
                                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded-full">
                                                    <Sparkles size={9} className="text-indigo-600" /> AI
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded-full">
                                                    <Edit3 size={9} className="text-slate-500" /> Manual
                                                  </span>
                                                )}`;

  if (listContent.includes(oldSubBadge)) {
    listContent = listContent.replace(oldSubBadge, newSubBadge);
    console.log('Main page accordion sub-row badge check updated.');
  }

  listContent = listContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(listPagePath, listContent);
}

// 2. Update edit/[id]/page.tsx fetchInitialData matching logic
const editPagePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';
if (fs.existsSync(editPagePath)) {
  let editContent = fs.readFileSync(editPagePath, 'utf8');
  editContent = editContent.replace(/\r\n/g, '\n');

  const oldEditMatching = `        // Also look up if this record is matching any of the analisis list to restore selection
        if (pagu.no_surat_pengajuan && allAnalisis && pagu.ringkasan_surat_pengajuan && (pagu.ringkasan_surat_pengajuan.includes('<!--imported-->') || pagu.ringkasan_surat_pengajuan.startsWith('{"'))) {
          const matchedAnalisis = allAnalisis.find(a => a.no_surat === pagu.no_surat_pengajuan);
          if (matchedAnalisis) {
            let pBerjalanItem = {};
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
            };
            setSelectedAnalisis(selectedItem);
            
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

  const newEditMatching = `        // Also look up if this record is matching any of the analisis list to restore selection
        if (pagu.id_analisis && allAnalisis) {
          const matchedAnalisis = allAnalisis.find(a => a.id_analisis === pagu.id_analisis);
          if (matchedAnalisis) {
            let pBerjalanItem = {};
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
            };
            setSelectedAnalisis(selectedItem);
            
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

  if (editContent.includes(oldEditMatching)) {
    editContent = editContent.replace(oldEditMatching, newEditMatching);
    console.log('Edit page load matching logic updated.');
  }

  editContent = editContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(editPagePath, editContent);
}

console.log('Badge & edit update script executed.');
