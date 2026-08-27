const fs = require('fs');

// 1. Revert and unify logic in tambah/page.tsx
const tambahPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
if (fs.existsSync(tambahPage)) {
  let content = fs.readFileSync(tambahPage, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Change back usedNoSuratSet mapping
  const oldMapping = `      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }`;

  const newMapping = `      const usedNoSuratSet = new Set<string>();
      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan && tp.no_surat_pengajuan.trim()) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan && tp.no_surat_tanggapan.trim()) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }`;

  if (content.includes(oldMapping)) {
    content = content.replace(oldMapping, newMapping);
    console.log('tambah/page.tsx mapping reverted to include usedNoSuratSet');
  }

  // Change back isUsed logic
  const oldIsUsed = `          const isUsed = !isCurrentRecord && !!item.id_analisis && usedIdAnalisisSet.has(item.id_analisis);`;
  const newIsUsed = `          const isUsed = !isCurrentRecord && (usedIdAnalisisSet.has(item.id_analisis) || (cleanNoSurat && usedNoSuratSet.has(cleanNoSurat)));`;

  if (content.includes(oldIsUsed)) {
    content = content.replace(oldIsUsed, newIsUsed);
    console.log('tambah/page.tsx isUsed reverted to check both id and no_surat');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(tambahPage, content);
}

// 2. Revert and unify logic in edit/[id]/page.tsx
const editPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';
if (fs.existsSync(editPage)) {
  let content = fs.readFileSync(editPage, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Change back usedNoSuratSet mapping
  const oldMapping = `      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }`;

  const newMapping = `      const usedNoSuratSet = new Set<string>();
      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan && tp.no_surat_pengajuan.trim()) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan && tp.no_surat_tanggapan.trim()) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }`;

  if (content.includes(oldMapping)) {
    content = content.replace(oldMapping, newMapping);
    console.log('edit/[id]/page.tsx mapping reverted to include usedNoSuratSet');
  }

  // Change back isUsed logic
  const oldIsUsed = `          const isUsed = !isCurrentRecord && !!item.id_analisis && usedIdAnalisisSet.has(item.id_analisis);`;
  const newIsUsed = `          const isUsed = !isCurrentRecord && (usedIdAnalisisSet.has(item.id_analisis) || (cleanNoSurat && usedNoSuratSet.has(cleanNoSurat)));`;

  if (content.includes(oldIsUsed)) {
    content = content.replace(oldIsUsed, newIsUsed);
    console.log('edit/[id]/page.tsx isUsed reverted to check both id and no_surat');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(editPage, content);
}

// 3. Make RiwayatList.tsx check both id_analisis and no_surat for the "diambil" badge
const riwayatListPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/analisis/components/RiwayatList.tsx';
if (fs.existsSync(riwayatListPath)) {
  let content = fs.readFileSync(riwayatListPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldFetchRiwayat = `      const importedIds = new Set<string>();
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
              is_imported: importedIds.has(r.id_analisis),`;

  const newFetchRiwayat = `      const importedIds = new Set<string>();
      const usedNoSuratSet = new Set<string>();
      if (listTambahPagu) {
        listTambahPagu.forEach(tp => {
          if (tp.id_analisis) importedIds.add(tp.id_analisis);
          if (tp.no_surat_pengajuan && tp.no_surat_pengajuan.trim()) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan && tp.no_surat_tanggapan.trim()) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
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
           const cleanNoSurat = (r.no_surat || '').trim().toLowerCase();
           return {
              ...r,
              is_imported: importedIds.has(r.id_analisis) || (cleanNoSurat && usedNoSuratSet.has(cleanNoSurat)),`;

  if (content.includes(oldFetchRiwayat)) {
    content = content.replace(oldFetchRiwayat, newFetchRiwayat);
    console.log('RiwayatList.tsx fetchRiwayat logic updated to check both ID and no_surat');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(riwayatListPath, content);
}

// 4. Update tambah-pagu/page.tsx table cell rendering
const listPagePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/page.tsx';
if (fs.existsSync(listPagePath)) {
  let content = fs.readFileSync(listPagePath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldCellLabel = `                            <div>
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

  const newCellLabel = `                            <div>
                              {(item.id_analisis || (item.no_surat_pengajuan && analisisNoSuratSet.has(item.no_surat_pengajuan.trim().toLowerCase()))) ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full shadow-2xs" title="Bersumber dari halaman Analisis Pagu">
                                  <Sparkles size={10} className="text-indigo-600" /> Impor Analisis AI
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full" title="Data diinput manual">
                                  <Edit3 size={10} className="text-slate-500" /> Input Manual
                                </span>
                              )}
                            </div>`;

  if (content.includes(oldCellLabel)) {
    content = content.replace(oldCellLabel, newCellLabel);
    console.log('tambah-pagu/page.tsx table cell rendering updated to show Impor Analisis AI badge for matches');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(listPagePath, content);
}

console.log('Consistency script execution completed.');
