const fs = require('fs');

function applyLockingToPage(path, isEdit = false) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Update fetchAnalisisAndUsed to check usedIdAnalisisSet
  const oldFetchAnalisis = `      const { data: dataTambahPagu } = await supabase
        .from('tambah_pagu')
        .select('no_surat_pengajuan, no_surat_tanggapan');

      const usedNoSuratSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
        });
      }

      if (dataAnalisis) {
        const processed = dataAnalisis.map(item => {
          const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
          const isUsed = usedNoSuratSet.has(cleanNoSurat);`;

  const newFetchAnalisis = `      const { data: dataTambahPagu } = await supabase
        .from('tambah_pagu')
        .select('id_analisis, no_surat_pengajuan, no_surat_tanggapan');

      const usedNoSuratSet = new Set<string>();
      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }

      if (dataAnalisis) {
        const processed = dataAnalisis.map(item => {
          const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
          // Exclude checking current record if in edit page
          const isCurrentRecord = ${isEdit} && pagu?.id_analisis === item.id_analisis;
          const isUsed = !isCurrentRecord && (usedIdAnalisisSet.has(item.id_analisis) || usedNoSuratSet.has(cleanNoSurat));`;

  if (content.includes(oldFetchAnalisis)) {
    content = content.replace(oldFetchAnalisis, newFetchAnalisis);
    console.log(`fetchAnalisisAndUsed updated in ${path}`);
  }

  // 2. Update Modal list items rendering (container click & style)
  const oldModalItemDiv = `                  {filteredAnalisisList.map((item, idx) => (
                    <div 
                      key={item.id_analisis || idx}
                      className="p-5 bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-lg rounded-3xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                      onClick={() => handleSelectAnalisis(item)}
                    >`;

  const newModalItemDiv = `                  {filteredAnalisisList.map((item, idx) => (
                    <div 
                      key={item.id_analisis || idx}
                      className={\`p-5 bg-white border rounded-3xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 \${
                        item.is_used 
                          ? 'border-gray-200 bg-slate-50/50 opacity-60 cursor-not-allowed' 
                          : 'border-gray-200 hover:border-indigo-400 hover:shadow-lg cursor-pointer'
                      }\`}
                      onClick={() => {
                        if (item.is_used) {
                          alert("Analisis ini sudah diimpor ke Tambah Pagu dan tidak dapat dipilih lagi.");
                          return;
                        }
                        handleSelectAnalisis(item);
                      }}
                    >`;

  if (content.includes(oldModalItemDiv)) {
    content = content.replace(oldModalItemDiv, newModalItemDiv);
    console.log(`Modal item container style & click updated in ${path}`);
  }

  // 3. Update Modal button rendering
  const oldModalSelectBtn = `                        <button
                          onClick={() => handleSelectAnalisis(item)}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                        >
                          Impor Data Ini <ArrowLeft size={14} className="rotate-180" />
                        </button>`;

  const newModalSelectBtn = `                        {item.is_used ? (
                          <button
                            type="button"
                            disabled
                            className="px-5 py-2.5 bg-slate-200 text-slate-400 text-xs font-black uppercase tracking-wider rounded-xl cursor-not-allowed border border-slate-300"
                          >
                            Sudah Diimpor
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAnalisis(item);
                            }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                          >
                            Impor Data Ini <ArrowLeft size={14} className="rotate-180" />
                          </button>
                        )}`;

  if (content.includes(oldModalSelectBtn)) {
    content = content.replace(oldModalSelectBtn, newModalSelectBtn);
    console.log(`Modal select button disabled logic updated in ${path}`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

// Apply fixes to pages
const tambahPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

applyLockingToPage(tambahPage, false);
applyLockingToPage(editPage, true);


// 4. Update RiwayatList.tsx to show "Diambil" badge
const riwayatListPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/analisis/components/RiwayatList.tsx';
if (fs.existsSync(riwayatListPath)) {
  let listContent = fs.readFileSync(riwayatListPath, 'utf8');
  listContent = listContent.replace(/\r\n/g, '\n');

  // Update fetchRiwayat in RiwayatList.tsx
  const oldFetchRiwayatList = `  const fetchRiwayat = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('app_analisis_utama')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      const processed = data.map(r => {
         let keputusan = r.keputusan;
         let nominalDisetujui = r.nominal_disetujui;
         let subyekSimaster = '';
         let ringkasanAi = '';
         let ketKeputusan = '';
         let rekomendasiAi = '';
         let suratBalasanHtml = '';
         if (r.analisis_html) {
            try {
               const parsed = JSON.parse(r.analisis_html);
               if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
               if (!nominalDisetujui && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
               if (parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
               if (parsed.analisis) ringkasanAi = parsed.analisis;
               if (parsed.keterangan_keputusan) ketKeputusan = parsed.keterangan_keputusan;
               if (parsed.rekomendasi) rekomendasiAi = parsed.rekomendasi;
               if (parsed.surat_balasan_html) suratBalasanHtml = parsed.surat_balasan_html;
            } catch(e) {
               ringkasanAi = r.analisis_html;
            }
         }
         return {
            ...r,
            subyek_persuratan_simaster: (r as any).subyek_persuratan_simaster || subyekSimaster || '',
            ringkasan_ai: ringkasanAi || r.ringkasan_ai || '',
            rekomendasi_ai: rekomendasiAi,
            surat_balasan_html: suratBalasanHtml,
            keterangan_keputusan: ketKeputusan,
            keputusan: keputusan || 'diajukan',
            nominal_disetujui: nominalDisetujui || '0'
         };
      });
      setRiwayat(processed);
      setFiltered(processed);
    }
    setLoading(false);
  };`;

  const newFetchRiwayatList = `  const fetchRiwayat = async () => {
    setLoading(true);
    try {
      const [ { data: listAnalisis }, { data: listTambahPagu } ] = await Promise.all([
        supabase.from('app_analisis_utama').select('*').order('created_at', { ascending: false }),
        supabase.from('tambah_pagu').select('id_analisis')
      ]);

      const importedIds = new Set<string>();
      if (listTambahPagu) {
        listTambahPagu.forEach(tp => {
          if (tp.id_analisis) importedIds.add(tp.id_analisis);
        });
      }

      if (listAnalisis) {
        const processed = listAnalisis.map(r => {
           let keputusan = r.keputusan;
           let nominalDisetujui = r.nominal_disetujui;
           let subyekSimaster = '';
           let ringkasanAi = '';
           let ketKeputusan = '';
           let rekomendasiAi = '';
           let suratBalasanHtml = '';
           if (r.analisis_html) {
              try {
                 const parsed = JSON.parse(r.analisis_html);
                 if (!keputusan && parsed.keputusan) keputusan = parsed.keputusan;
                 if (!nominalDisetujui && parsed.nominal_disetujui) nominalDisetujui = parsed.nominal_disetujui;
                 if (parsed.subyek_persuratan_simaster) subyekSimaster = parsed.subyek_persuratan_simaster;
                 if (parsed.analisis) ringkasanAi = parsed.analisis;
                 if (parsed.keterangan_keputusan) ketKeputusan = parsed.keterangan_keputusan;
                 if (parsed.rekomendasi) rekomendasiAi = parsed.rekomendasi;
                 if (parsed.surat_balasan_html) suratBalasanHtml = parsed.surat_balasan_html;
              } catch(e) {
                 ringkasanAi = r.analisis_html;
              }
           }
           return {
              ...r,
              is_imported: importedIds.has(r.id_analisis),
              subyek_persuratan_simaster: (r as any).subyek_persuratan_simaster || subyekSimaster || '',
              ringkasan_ai: ringkasanAi || r.ringkasan_ai || '',
              rekomendasi_ai: rekomendasiAi,
              surat_balasan_html: suratBalasanHtml,
              keterangan_keputusan: ketKeputusan,
              keputusan: keputusan || 'diajukan',
              nominal_disetujui: nominalDisetujui || '0'
           };
        });
        setRiwayat(processed);
        setFiltered(processed);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };`;

  if (listContent.includes(oldFetchRiwayatList)) {
    listContent = listContent.replace(oldFetchRiwayatList, newFetchRiwayatList);
    console.log('RiwayatList.tsx fetchRiwayat implementation updated.');
  }

  // Render "Diambil" badge under status in the main row
  const oldMainStatusCol = `                          <td className="px-4 py-4 text-center align-top pt-5">
                            {getStatusBadge(r.keputusan)}
                          </td>`;

  const newMainStatusCol = `                          <td className="px-4 py-4 text-center align-top pt-5 space-y-1.5">
                            {getStatusBadge(r.keputusan)}
                            {r.is_imported && (
                              <div>
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
                                  <Check size={10} className="text-emerald-600" /> Diambil
                                </span>
                              </div>
                            )}
                          </td>`;

  if (listContent.includes(oldMainStatusCol)) {
    listContent = listContent.replace(oldMainStatusCol, newMainStatusCol);
    console.log('RiwayatList.tsx main row status column updated with imported badge.');
  }

  // Render "Sudah Diambil ke Tambah Pagu" badge in expanded row header
  const oldExpandedHeader = `                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(r.keputusan)}
                                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                                      ID: {r.id_analisis}
                                    </span>
                                  </div>`;

  const newExpandedHeader = `                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(r.keputusan)}
                                    {r.is_imported && (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/50 px-2.5 py-1 rounded-xl shadow-xs uppercase tracking-wider">
                                        <Check size={10} className="text-emerald-400" /> Sudah Diambil ke Tambah Pagu
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700">
                                      ID: {r.id_analisis}
                                    </span>
                                  </div>`;

  if (listContent.includes(oldExpandedHeader)) {
    listContent = listContent.replace(oldExpandedHeader, newExpandedHeader);
    console.log('RiwayatList.tsx expanded header updated with imported badge.');
  }

  listContent = listContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(riwayatListPath, listContent);
}

console.log('All analysis locking updates completed.');
