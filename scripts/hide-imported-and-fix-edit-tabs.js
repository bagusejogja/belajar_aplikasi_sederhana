const fs = require('fs');

// 1. Fix edit/[id]/page.tsx selection lookup by no_surat_pengajuan
const editPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';
if (fs.existsSync(editPage)) {
  let content = fs.readFileSync(editPage, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldLookup = `        // Also look up if this record is matching any of the analisis list to restore selection
        if (pagu.id_analisis && processedAnalisis.length > 0) {
          const matchedAnalisis = processedAnalisis.find(a => a.id_analisis === pagu.id_analisis);`;

  const newLookup = `        // Also look up if this record is matching any of the analisis list to restore selection
        if (processedAnalisis.length > 0) {
          const cleanPaguNoSurat = (pagu.no_surat_pengajuan || '').trim().toLowerCase();
          const matchedAnalisis = processedAnalisis.find(a => 
            (pagu.id_analisis && a.id_analisis === pagu.id_analisis) || 
            (cleanPaguNoSurat && a.no_surat && a.no_surat.trim().toLowerCase() === cleanPaguNoSurat)
          );`;

  if (content.includes(oldLookup)) {
    content = content.replace(oldLookup, newLookup);
    console.log('edit/[id]/page.tsx lookup logic updated to include cleanPaguNoSurat');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(editPage, content);
}

// 2. Hide already imported/used items in filteredAnalisisList in both pages
function hideImportedInList(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldFilter = `  const filteredAnalisisList = listAnalisis.filter(item => {
    if (!searchAnalisis) return true;`;

  const newFilter = `  const filteredAnalisisList = listAnalisis.filter(item => {
    // Hide already imported/used items
    if (item.is_used) return false;
    if (!searchAnalisis) return true;`;

  if (content.includes(oldFilter)) {
    content = content.replace(oldFilter, newFilter);
    console.log(`Hiding imported items in filteredAnalisisList in ${path}`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

const tambahPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
hideImportedInList(tambahPage);
hideImportedInList(editPage);

console.log('All updates for edit tabs restoration and import hiding completed.');
