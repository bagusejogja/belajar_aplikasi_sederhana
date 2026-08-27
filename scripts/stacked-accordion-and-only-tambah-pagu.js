const fs = require('fs');

const path = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/komparasi/page.tsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // 1. Update uGovRows filtering logic to only fetch 'tambah pagu - inisiatif' and 'tambah pagu - penugasan'
  const oldUGovRows = `      // Data dari gov_pagu_anggaran milik unit ini
      const uGovRows = rawGovPagu.filter(r => r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString()));`;

  const newUGovRows = `      // Data dari gov_pagu_anggaran milik unit ini (hanya Tambah Pagu - Inisiatif dan Tambah Pagu - Penugasan)
      const uGovRows = rawGovPagu.filter(r => 
        (r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())) &&
        ((r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - inisiatif' || (r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - penugasan')
      );`;

  if (content.includes(oldUGovRows)) {
    content = content.replace(oldUGovRows, newUGovRows);
    console.log('uGovRows filter updated in komparasi/page.tsx');
  }

  // 2. Change layout of expand details from side-by-side grid to top-bottom stack
  const oldExpandRow = `                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              
                              {/* LEFT TABLE: Rincian Surat Usulan */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">`;

  const newExpandRow = `                            <div className="space-y-6">
                              
                              {/* LEFT TABLE: Rincian Surat Usulan */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">`;

  if (content.includes(oldExpandRow)) {
    content = content.replace(oldExpandRow, newExpandRow);
    console.log('Expand row grid changed to space-y-6 (top-bottom stack) in komparasi/page.tsx');
  }

  // 3. Update dbRows filtering in details table to match uGovRows filter
  const oldDbRows = `                                        const dbRows = rawGovPagu.filter(r => r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString()));`;
  const newDbRows = `                                        const dbRows = rawGovPagu.filter(r => 
                                          (r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())) &&
                                          ((r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - inisiatif' || (r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - penugasan')
                                        );`;

  if (content.includes(oldDbRows)) {
    content = content.replace(oldDbRows, newDbRows);
    console.log('dbRows filter in detail table updated in komparasi/page.tsx');
  }

  // 4. Remove Sinkronkan button and display Terverifikasi or hyphen
  const oldActionSync = `                        {/* ACTION SINKRONISASI */}
                        <TableCell className="text-center align-top pt-3">
                          {u.audit_status === 'KELEWAT' || u.audit_status === 'SELISIH' ? (
                            <Button
                              size="sm"
                              disabled={isSyncing === u.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSyncTargetUnit(u);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-xl h-8 px-3 shadow-sm"
                            >
                              {isSyncing === u.id ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} className="mr-1 text-amber-300" />}
                              Sinkronkan
                            </Button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <Check size={12} /> Terverifikasi
                            </span>
                          )}
                        </TableCell>`;

  const newActionSync = `                        {/* ACTION SINKRONISASI */}
                        <TableCell className="text-center align-top pt-3">
                          {u.audit_status === 'MATCH' ? (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <Check size={12} /> Terverifikasi
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              -
                            </span>
                          )}
                        </TableCell>`;

  if (content.includes(oldActionSync)) {
    content = content.replace(oldActionSync, newActionSync);
    console.log('Sinkronkan action button replaced with simple hyphen/Terverifikasi status in komparasi/page.tsx');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

console.log('Komparasi page update completed.');
