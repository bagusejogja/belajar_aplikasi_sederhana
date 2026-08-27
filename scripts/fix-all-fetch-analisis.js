const fs = require('fs');

// Fix edit/[id]/page.tsx fetchInitialData to select analisis_html and process it
const editPagePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';
if (fs.existsSync(editPagePath)) {
  let editContent = fs.readFileSync(editPagePath, 'utf8');
  editContent = editContent.replace(/\r\n/g, '\n');

  // Find and update app_analisis_utama select statement in edit/page.tsx
  const oldAnalisisSelect = `      // Fetch analisis list
      const { data: allAnalisis } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, unit_pengirim, perihal, total_anggaran, nominal_disetujui, keputusan, created_at')
        .order('created_at', { ascending: false });

      if (allAnalisis) {
        setListAnalisis(allAnalisis.map((item: any) => ({
          ...item,
          is_used: usedNoSurat.has(item.no_surat)
        })));
      }`;

  const newAnalisisSelect = `      // Fetch analisis list (selecting analisis_html and processing fields)
      const { data: dataAnalisis } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, tanggal_surat, perihal, unit_pengirim, total_anggaran, nominal_disetujui, keputusan, link_lampiran, analisis_html, created_at')
        .order('created_at', { ascending: false });

      let processedAnalisis: any[] = [];
      if (dataAnalisis) {
        processedAnalisis = dataAnalisis.map(item => {
          const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
          const isUsed = usedNoSurat.has(cleanNoSurat);

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
            ringkasan_html: ringkasanHtml,
            is_used: isUsed
          };
        });
        setListAnalisis(processedAnalisis);
      }`;

  if (editContent.includes(oldAnalisisSelect)) {
    editContent = editContent.replace(oldAnalisisSelect, newAnalisisSelect);
    console.log('edit/[id]/page.tsx analisis select statement updated.');
  }

  // Also replace allAnalisis references in matching logic to use processedAnalisis or listAnalisis
  editContent = editContent.replace('if (pagu.id_analisis && allAnalisis)', 'if (pagu.id_analisis && processedAnalisis.length > 0)');
  editContent = editContent.replace('allAnalisis.find(a => a.id_analisis === pagu.id_analisis)', 'processedAnalisis.find(a => a.id_analisis === pagu.id_analisis)');

  // Fix button wrapping for Jalankan Analisis AI in edit/[id]/page.tsx
  const oldEditQuillButton = `                    <button
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

  const newEditQuillButton = `                    {!isReadOnlyPengajuan && (
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

  if (editContent.includes(oldEditQuillButton)) {
    editContent = editContent.replace(oldEditQuillButton, newEditQuillButton);
    console.log('Jalankan Analisis AI button wrapped in edit/[id]/page.tsx');
  }

  editContent = editContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(editPagePath, editContent);
}

// Fix tambah/page.tsx button wrapping
const tambahPagePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
if (fs.existsSync(tambahPagePath)) {
  let tambahContent = fs.readFileSync(tambahPagePath, 'utf8');
  tambahContent = tambahContent.replace(/\r\n/g, '\n');

  const oldTambahQuillButton = `                    <button
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

  const newTambahQuillButton = `                    {!isReadOnlyPengajuan && (
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

  if (tambahContent.includes(oldTambahQuillButton)) {
    tambahContent = tambahContent.replace(oldTambahQuillButton, newTambahQuillButton);
    console.log('Jalankan Analisis AI button wrapped in tambah/page.tsx');
  }

  tambahContent = tambahContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(tambahPagePath, tambahContent);
}

console.log('All fetch and button fixes completed.');
