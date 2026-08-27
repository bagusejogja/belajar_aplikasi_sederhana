const fs = require('fs');

const path = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/komparasi/page.tsx';
if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Find the exact block starting with LEFT TABLE to replace it
  const oldTablesBlock = `                              {/* LEFT TABLE: Rincian Surat Usulan */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} className="text-indigo-600" />
                                    Rincian Surat Usulan: {u.nama_unit} ({u.letters.length} Surat)
                                  </h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                      <TableRow>
                                        <TableHead className="w-10">No</TableHead>
                                        <TableHead>Surat Pengajuan (No, Tanggal, Hal)</TableHead>
                                        <TableHead className="text-right">Nominal Diajukan (Rp)</TableHead>
                                        <TableHead className="text-right text-emerald-700">Nominal Disetujui (Rp)</TableHead>
                                        <TableHead className="text-center">Jenis</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {u.letters.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center py-4 text-slate-400">Tidak ada rincian surat usulan untuk unit ini.</TableCell>
                                        </TableRow>
                                      ) : (
                                        u.letters.map((subItem: any, subIdx: number) => {
                                          const isApproved = (subItem.status_pengajuan || '').toLowerCase().includes('disetujui') || Number(subItem.nominal_tanggapan || subItem.nominal_disetujui || 0) > 0;
                                          return (
                                            <TableRow key={subItem.id || subIdx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                                              <TableCell className="font-bold text-slate-400 text-center text-[11px]">{subIdx + 1}</TableCell>
                                              <TableCell className="space-y-0.5">
                                                <div className="font-bold text-slate-900 font-mono text-[11px]">📄 {subItem.no_surat_pengajuan || '-'}</div>
                                                <div className="text-[10px] text-slate-400">📅 {subItem.tanggal_surat_pengajuan || '-'}</div>
                                                <div className="text-slate-600 text-[11px] truncate max-w-[200px]">{subItem.hal_surat_pengajuan || '-'}</div>
                                              </TableCell>
                                              <TableCell className="text-right font-mono font-bold text-amber-900 text-xs">
                                                Rp {formatRp(subItem.nominal_diajukan)}
                                              </TableCell>
                                              <TableCell className="text-right font-mono font-black text-emerald-700 text-xs">
                                                Rp {formatRp(subItem.nominal_tanggapan || subItem.nominal_disetujui || 0)}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[9px] font-bold">
                                                  {subItem.jenis_tambah_pagu || 'Penugasan'}
                                                </Badge>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              {/* RIGHT TABLE: Rincian Pagu Tercatat DB */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={14} className="text-emerald-600" />
                                    Detail DB Pagu Tambahan: {u.nama_unit} ({rawGovPagu.filter(r => r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())).length} Record)
                                  </h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                      <TableRow>
                                        <TableHead className="w-10">No</TableHead>
                                        <TableHead>Jenis Anggaran Pagu</TableHead>
                                        <TableHead className="text-right">Nominal Tercatat DB (Rp)</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(() => {
                                        const dbRows = rawGovPagu.filter(r => 
                                          (r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())) &&
                                          ((r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - inisiatif' || (r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - penugasan')
                                        );
                                        if (dbRows.length === 0) {
                                          return (
                                            <TableRow>
                                              <TableCell colSpan={4} className="text-center py-4 text-slate-400">Tidak ada data pagu tambahan tercatat di DB.</TableCell>
                                            </TableRow>
                                          );
                                        }
                                        return dbRows.map((dbRow: any, dbIdx: number) => (
                                          <TableRow key={dbRow.id || dbIdx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                                            <TableCell className="font-bold text-slate-400 text-center text-[11px]">{dbIdx + 1}</TableCell>
                                            <TableCell className="font-bold text-slate-900 font-mono text-[11px] capitalize">
                                              {dbRow.jenis_anggaran || '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-black text-emerald-800 text-xs">
                                              Rp {formatRp(dbRow.nominal)}
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-medium max-w-[150px] truncate">
                                              {dbRow.keterangan || '-'}
                                            </TableCell>
                                          </TableRow>
                                        ));
                                      })()}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>`;

  const newTablesBlock = `                              {/* LEFT TABLE: Rincian Surat Usulan */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} className="text-indigo-600" />
                                    Rincian Surat Usulan: {u.nama_unit} ({u.letters.length} Surat)
                                  </h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                      <TableRow>
                                        <TableHead className="w-10">No</TableHead>
                                        <TableHead>Surat Pengajuan (No, Tanggal, Hal & Jenis)</TableHead>
                                        <TableHead className="text-right text-emerald-700 w-[200px]">Nominal Disetujui (Rp)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {u.letters.length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={3} className="text-center py-4 text-slate-400">Tidak ada rincian surat usulan untuk unit ini.</TableCell>
                                        </TableRow>
                                      ) : (
                                        u.letters.map((subItem: any, subIdx: number) => {
                                          return (
                                            <TableRow key={subItem.id || subIdx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                                              <TableCell className="font-bold text-slate-400 text-center text-[11px] align-top pt-3">{subIdx + 1}</TableCell>
                                              <TableCell className="space-y-1">
                                                <div className="font-bold text-slate-900 font-mono text-[11px]">📄 {subItem.no_surat_pengajuan || '-'}</div>
                                                <div className="text-[10px] text-slate-400">📅 {subItem.tanggal_surat_pengajuan || '-'}</div>
                                                <div className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-wrap">{subItem.hal_surat_pengajuan || '-'}</div>
                                                <div className="pt-1">
                                                  <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-[9px] font-bold">
                                                    {subItem.jenis_tambah_pagu || 'Penugasan'}
                                                  </Badge>
                                                </div>
                                              </TableCell>
                                              <TableCell className="text-right font-mono font-black text-emerald-700 text-xs align-top pt-3">
                                                Rp {formatRp(subItem.nominal_tanggapan || subItem.nominal_disetujui || 0)}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>

                              {/* RIGHT TABLE: Rincian Pagu Tercatat DB */}
                              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-inner space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                    <Layers size={14} className="text-emerald-600" />
                                    Detail DB Pagu Tambahan: {u.nama_unit} ({rawGovPagu.filter(r => r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())).length} Record)
                                  </h4>
                                </div>
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                                      <TableRow>
                                        <TableHead className="w-10">No</TableHead>
                                        <TableHead>Jenis Anggaran Pagu & Keterangan</TableHead>
                                        <TableHead className="text-right w-[200px]">Nominal Tercatat DB (Rp)</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(() => {
                                        const dbRows = rawGovPagu.filter(r => 
                                          (r.unit_id === u.id || (r.unit_id && u.id && r.unit_id.toString() === u.id.toString())) &&
                                          ((r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - inisiatif' || (r.jenis_anggaran || '').toLowerCase() === 'tambah pagu - penugasan')
                                        );
                                        if (dbRows.length === 0) {
                                          return (
                                            <TableRow>
                                              <TableCell colSpan={3} className="text-center py-4 text-slate-400">Tidak ada data pagu tambahan tercatat di DB.</TableCell>
                                            </TableRow>
                                          );
                                        }
                                        return dbRows.map((dbRow: any, dbIdx: number) => (
                                          <TableRow key={dbRow.id || dbIdx} className="hover:bg-slate-50 border-b border-slate-100 text-xs">
                                            <TableCell className="font-bold text-slate-400 text-center text-[11px] align-top pt-3">{dbIdx + 1}</TableCell>
                                            <TableCell className="space-y-1">
                                              <div className="font-bold text-slate-900 font-mono text-[11px] capitalize">
                                                {dbRow.jenis_anggaran || '-'}
                                              </div>
                                              {dbRow.keterangan && (
                                                <div className="text-[10px] text-slate-500 font-medium whitespace-pre-wrap leading-relaxed">
                                                  Keterangan: {dbRow.keterangan}
                                                </div>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-black text-emerald-800 text-xs align-top pt-3">
                                              Rp {formatRp(dbRow.nominal)}
                                            </TableCell>
                                          </TableRow>
                                        ));
                                      })()}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>`;

  if (content.includes(oldTablesBlock)) {
    content = content.replace(oldTablesBlock, newTablesBlock);
    console.log('Accordion child tables reformatted successfully.');
  } else {
    console.log('Error: oldTablesBlock not found in komparasi/page.tsx!');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

console.log('Script execution finished.');
