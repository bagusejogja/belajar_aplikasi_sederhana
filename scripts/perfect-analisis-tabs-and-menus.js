const fs = require('fs');

// 1. Rename menus in mock-db.ts
const mockDbPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/lib/mock-db.ts';
if (fs.existsSync(mockDbPath)) {
  let dbContent = fs.readFileSync(mockDbPath, 'utf8');
  dbContent = dbContent.replace(/\r\n/g, '\n');

  dbContent = dbContent.replace(
    `{ title: 'Laporan Tambah Pagu', path: '/tambah-pagu', icon: 'Layout', roles: ['ADMIN', 'STAFF', 'Pemroses Anggaran'], group: 'Anggaran' }`,
    `{ title: 'Tambah Pagu', path: '/tambah-pagu', icon: 'Layout', roles: ['ADMIN', 'STAFF', 'Pemroses Anggaran'], group: 'Anggaran' }`
  );

  dbContent = dbContent.replace(
    `{ title: 'Analisis Pagu', path: '/analisis', icon: 'FileSpreadsheet', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Anggaran' }`,
    `{ title: 'Analisis Tambah Pagu', path: '/analisis', icon: 'FileSpreadsheet', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Anggaran' }`
  );

  dbContent = dbContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(mockDbPath, dbContent);
  console.log('mock-db.ts menu titles updated successfully.');
}

// 2. Update analisis/page.tsx: Default to 'riwayat', Header buttons check, exportCurrentToExcel
const pagePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/analisis/page.tsx';
if (fs.existsSync(pagePath)) {
  let pageContent = fs.readFileSync(pagePath, 'utf8');
  pageContent = pageContent.replace(/\r\n/g, '\n');

  // Add XLSX import at the top
  if (!pageContent.includes("import * as XLSX from 'xlsx';")) {
    pageContent = pageContent.replace("import RiwayatList from './components/RiwayatList';", "import RiwayatList from './components/RiwayatList';\nimport * as XLSX from 'xlsx';");
  }

  // Change default activeStep state
  pageContent = pageContent.replace(
    `const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3' | 'pdf' | 'step5' | 'riwayat' | 'all'>('step1');`,
    `const [activeStep, setActiveStep] = useState<'step1' | 'step2' | 'step3' | 'pdf' | 'step5' | 'riwayat' | 'all'>('riwayat');`
  );

  // Add exportCurrentToExcel function
  const oldHandleBaru = `  const handleBaru = () => {`;
  const exportCurrentFunction = `  const exportCurrentToExcel = () => {
    if (!mainData.no_surat) return alert("Belum ada data surat untuk di-export");
    
    const parseNum = (str: string | number) => {
      if (typeof str === 'number') return str;
      let s = (str || '0').toString().trim();
      const cleaned = s.replace(/\\./g, '').replace(/,/g, '.');
      return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
    };
    
    const p = mainData.pagu_berjalan || {};
    const infoRows = [
      { 'Kategori': 'No Surat Pengajuan', 'Nilai': mainData.no_surat },
      { 'Kategori': 'Tanggal Surat', 'Nilai': mainData.tanggal_surat || '-' },
      { 'Kategori': 'Unit Pengirim', 'Nilai': mainData.unit_pengirim || '-' },
      { 'Kategori': 'Perihal', 'Nilai': mainData.perihal || '-' },
      { 'Kategori': 'Total Anggaran Diajukan', 'Nilai': parseNum(mainData.total_anggaran) },
      { 'Kategori': 'Keputusan', 'Nilai': mainData.keputusan || '-' },
      { 'Kategori': 'Nominal Disetujui', 'Nilai': parseNum(mainData.nominal_disetujui) },
      { 'Kategori': '', 'Nilai': '' },
      { 'Kategori': 'MUTASI PAGU BERJALAN 2026', 'Nilai': '' },
      { 'Kategori': 'Pagu Awal', 'Nilai': parseNum(p.pagu_awal) },
      { 'Kategori': 'Pengalihan (+/-)', 'Nilai': parseNum(p.pengalihan) },
      { 'Kategori': 'Tambah Inisiatif (+)', 'Nilai': parseNum(p.tambah_inisiatif) },
      { 'Kategori': 'Tambah Penugasan (+)', 'Nilai': parseNum(p.tambah_penugasan) },
      { 'Kategori': 'Efisiensi (-)', 'Nilai': parseNum(p.efisiensi) },
      { 'Kategori': 'Luncuran (+)', 'Nilai': parseNum(p.luncuran) },
      { 'Kategori': 'Talangan Pindah', 'Nilai': parseNum(p.talangan_pindah) },
      { 'Kategori': 'Total Realisasi Pengeluaran', 'Nilai': parseNum(p.realisasi_keseluruhan) }
    ];
    
    const worksheetInfo = XLSX.utils.json_to_sheet(infoRows);
    worksheetInfo['!cols'] = [{ wch: 30 }, { wch: 45 }];

    const detailRows = detailData.map((d, i) => ({
      'No': d.no_urut || i + 1,
      'Uraian Kegiatan / Belanja': d.uraian_kegiatan,
      'Anggaran': parseNum(d.anggaran),
      'Realisasi': parseNum(d.realisasi),
      'Sisa Anggaran': parseNum(d.anggaran) - parseNum(d.realisasi),
      'Persen Serapan': d.persen_serapan
    }));
    const worksheetDetail = XLSX.utils.json_to_sheet(detailRows);
    worksheetDetail['!cols'] = [{ wch: 6 }, { wch: 45 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }];

    const historisRows = historisData.map(h => ({
      'Tahun': h.tahun,
      'Pagu Awal': parseNum(h.pagu_awal),
      'Pengalihan': parseNum(h.pengalihan),
      'Tambah Penugasan': parseNum(h.tambah_pagu_penugasan),
      'Tambah Inisiatif': parseNum(h.tambah_pagu_inisiatif),
      'Efisiensi': parseNum(h.efisiensi),
      'Talangan': parseNum(h.talangan),
      'Total Pagu': parseNum(h.total_pagu),
      'Realisasi': parseNum(h.realisasi_historis),
      'Serapan': h.persen_serapan
    }));
    const worksheetHistoris = XLSX.utils.json_to_sheet(historisRows);
    worksheetHistoris['!cols'] = [{ wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheetInfo, "Informasi Ringkasan");
    XLSX.utils.book_append_sheet(workbook, worksheetDetail, "Detail Realisasi Belanja");
    XLSX.utils.book_append_sheet(workbook, worksheetHistoris, "Pagu Historis");

    const cleanUnitName = (mainData.unit_pengirim || 'Unit').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, \`Detail_Analisis_Pagu_\${cleanUnitName}.xlsx\`);
  };

  const handleBaru = () => {`;

  if (pageContent.includes(oldHandleBaru) && !pageContent.includes('exportCurrentToExcel')) {
    pageContent = pageContent.replace(oldHandleBaru, exportCurrentFunction);
    console.log('exportCurrentToExcel added to page.tsx');
  }

  // Update header buttons
  const oldHeaderButtons = `            <button 
              onClick={() => setActiveStep('pdf')} 
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 shrink-0"
            >
              <Printer size={14} />
              <span>Cetak PDF</span>
            </button>

            <button 
              onClick={handleSave} 
              disabled={loading} 
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
            >
              {loading ? <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"/> : <Save size={14} />}
              <span>Simpan</span>
            </button>`;

  const newHeaderButtons = `            {activeStep === 'riwayat' ? null : activeStep === 'pdf' ? (
              <button 
                onClick={exportCurrentToExcel} 
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 shrink-0"
              >
                <FileSpreadsheet size={14} />
                <span>Convert to Excel</span>
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setActiveStep('pdf')} 
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-1.5 shrink-0"
                >
                  <Printer size={14} />
                  <span>Cetak PDF</span>
                </button>

                <button 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  {loading ? <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-white rounded-full animate-spin"/> : <Save size={14} />}
                  <span>Simpan</span>
                </button>
              </>
            )}`;

  if (pageContent.includes(oldHeaderButtons)) {
    pageContent = pageContent.replace(oldHeaderButtons, newHeaderButtons);
    console.log('Header buttons adapted based on activeStep.');
  }

  pageContent = pageContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(pagePath, pageContent);
}

// 3. Update RiwayatList.tsx: Add exportToExcel
const listPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/analisis/components/RiwayatList.tsx';
if (fs.existsSync(listPath)) {
  let listContent = fs.readFileSync(listPath, 'utf8');
  listContent = listContent.replace(/\r\n/g, '\n');

  if (!listContent.includes("import * as XLSX from 'xlsx';")) {
    listContent = listContent.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\nimport * as XLSX from 'xlsx';");
  }

  // Add exportToExcel function implementation
  const oldDeleteFunction = `  const handleDelete = async (id_analisis: string, e: React.MouseEvent) => {`;
  const exportToExcelFunction = `  const exportToExcel = () => {
    if (filtered.length === 0) return alert("Tidak ada data untuk di-export");

    const mappedExcelData = filtered.map((r, index) => {
      const totalUsulan = parseNum(r.total_anggaran);
      const totalDisetujui = parseNum(r.nominal_disetujui);
      return {
        'No': index + 1,
        'ID Analisis': r.id_analisis,
        'Tanggal Analisis': new Date(r.created_at).toLocaleDateString('id-ID'),
        'No Surat': r.no_surat || '-',
        'Unit Kerja': r.unit_pengirim || '-',
        'Subyek Simaster': r.subyek_persuratan_simaster || '-',
        'Perihal': r.perihal || '-',
        'Nominal Diajukan (Rp)': totalUsulan,
        'Nominal Disetujui (Rp)': totalDisetujui,
        'Keputusan': r.keputusan || 'Diajukan',
        'Status Impor': r.is_imported ? 'Sudah Diambil' : 'Belum Diambil'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedExcelData);
    
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 25 },
      { wch: 18 },
      { wch: 30 },
      { wch: 35 },
      { wch: 30 },
      { wch: 45 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Analisis Pagu");

    const fileName = \`Riwayat_Analisis_Pagu_\${new Date().getTime()}.xlsx\`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDelete = async (id_analisis: string, e: React.MouseEvent) => {`;

  if (listContent.includes(oldDeleteFunction) && !listContent.includes('exportToExcel = () =>')) {
    listContent = listContent.replace(oldDeleteFunction, exportToExcelFunction);
    console.log('exportToExcel function added to RiwayatList.tsx');
  }

  // Render Export Excel button in RiwayatList toolbar
  const oldSortDropdown = `           <select 
             value={sortBy}
             onChange={e => setSortBy(e.target.value)}
             className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
           >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="nominal_tertinggi">Nominal Usulan Tertinggi</option>
           </select>`;

  const newSortDropdown = `           <select 
             value={sortBy}
             onChange={e => setSortBy(e.target.value)}
             className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer mr-2"
           >
              <option value="terbaru">Terbaru</option>
              <option value="terlama">Terlama</option>
              <option value="nominal_tertinggi">Nominal Usulan Tertinggi</option>
           </select>
           <button
             onClick={exportToExcel}
             className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl px-4 py-3 shadow-sm transition-all flex items-center gap-1.5"
             title="Download Excel Seluruh Riwayat Analisis"
           >
             <FileSpreadsheet size={14} />
             <span>Export Excel</span>
           </button>`;

  if (listContent.includes(oldSortDropdown)) {
    listContent = listContent.replace(oldSortDropdown, newSortDropdown);
    console.log('Export Excel button rendered in RiwayatList.tsx toolbar');
  }

  listContent = listContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(listPath, listContent);
}

// 4. Fix empty no_surat check in usedNoSuratSet mapping in tambah/page.tsx and edit/[id]/page.tsx
function fixEmptyNoSuratCheck(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldUsedNoSuratMapping = `      const usedNoSuratSet = new Set<string>();
      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }`;

  const newUsedNoSuratMapping = `      const usedNoSuratSet = new Set<string>();
      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan && tp.no_surat_pengajuan.trim()) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan && tp.no_surat_tanggapan.trim()) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }`;

  if (content.includes(oldUsedNoSuratMapping)) {
    content = content.replace(oldUsedNoSuratMapping, newUsedNoSuratMapping);
    console.log(`usedNoSuratSet mapping fixed in ${path}`);
  }

  const oldIsUsedCheck = `          const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
          const isUsed = !isCurrentRecord && (usedIdAnalisisSet.has(item.id_analisis) || usedNoSuratSet.has(cleanNoSurat));`;

  const newIsUsedCheck = `          const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
          const isUsed = !isCurrentRecord && (usedIdAnalisisSet.has(item.id_analisis) || (cleanNoSurat && usedNoSuratSet.has(cleanNoSurat)));`;

  if (content.includes(oldIsUsedCheck)) {
    content = content.replace(oldIsUsedCheck, newIsUsedCheck);
    console.log(`isUsed check expression fixed in ${path}`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

const tambahPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

fixEmptyNoSuratCheck(tambahPage);
fixEmptyNoSuratCheck(editPage);

console.log('All tabs and menus edits completed.');
