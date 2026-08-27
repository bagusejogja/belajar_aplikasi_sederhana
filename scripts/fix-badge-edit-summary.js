const fs = require('fs');

// 1. Fix tambah-pagu/page.tsx (the list page badge logic)
const listPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/page.tsx';
if (fs.existsSync(listPath)) {
  let content = fs.readFileSync(listPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldBadgeBlock = `                              <div>
                                {analisisNoSuratSet.has((item.no_surat_pengajuan || '').trim().toLowerCase()) ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full shadow-2xs" title="Bersumber dari halaman Analisis Pagu">
                                    <Sparkles size={10} className="text-indigo-600" /> Impor Analisis AI
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full" title="Data diinput manual">
                                    <Edit3 size={10} className="text-slate-500" /> Input Manual
                                  </span>
                                )}
                              </div>`;

  const newBadgeBlock = `                              <div>
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

  if (content.includes(oldBadgeBlock)) {
    content = content.replace(oldBadgeBlock, newBadgeBlock);
    console.log('Badge logic updated in tambah-pagu/page.tsx.');
  } else {
    console.log('Error: oldBadgeBlock not found in tambah-pagu/page.tsx!');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(listPath, content);
}

// 2. Fix tambah-pagu/tambah/page.tsx
const tambahPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
if (fs.existsSync(tambahPath)) {
  let content = fs.readFileSync(tambahPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Change handleSelectAnalisis to add tag to ringkasan_surat_pengajuan
  const oldImportMapping = `      ringkasan_surat_pengajuan: item.ringkasan_html || prev.ringkasan_surat_pengajuan`;
  const newImportMapping = `      ringkasan_surat_pengajuan: item.ringkasan_html ? (item.ringkasan_html + '<!--imported-->') : prev.ringkasan_surat_pengajuan`;

  if (content.includes(oldImportMapping)) {
    content = content.replace(oldImportMapping, newImportMapping);
    console.log('Added imported tag to ringkasan_surat_pengajuan on import in tambah/page.tsx.');
  } else {
    console.log('Error: oldImportMapping not found in tambah/page.tsx!');
  }

  // Beautiful styling for summary box (force list bullets)
  const oldStyle = `                      className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-800 leading-relaxed prose-custom max-w-full overflow-hidden break-words [word-break:break-word] shadow-inner"`;
  const newStyle = `                      className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-800 leading-relaxed max-w-full overflow-hidden break-words [word-break:break-word] shadow-inner font-sans [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-bold"`;

  if (content.includes(oldStyle)) {
    content = content.replace(oldStyle, newStyle);
    console.log('Summary box styles updated in tambah/page.tsx.');
  } else {
    console.log('Error: oldStyle not found in tambah/page.tsx!');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(tambahPath, content);
}

// 3. Fix tambah-pagu/edit/[id]/page.tsx
const editPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';
if (fs.existsSync(editPath)) {
  let content = fs.readFileSync(editPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Change handleSelectAnalisis to add tag to ringkasan_surat_pengajuan
  const oldImportMapping = `      ringkasan_surat_pengajuan: item.ringkasan_html || prev.ringkasan_surat_pengajuan`;
  const newImportMapping = `      ringkasan_surat_pengajuan: item.ringkasan_html ? (item.ringkasan_html + '<!--imported-->') : prev.ringkasan_surat_pengajuan`;

  if (content.includes(oldImportMapping)) {
    content = content.replace(oldImportMapping, newImportMapping);
    console.log('Added imported tag to ringkasan_surat_pengajuan on import in edit/page.tsx.');
  } else {
    console.log('Error: oldImportMapping not found in edit/page.tsx!');
  }

  // Change fetchInitialData to verify imported tag before locking form
  const oldRestoreSelection = `        // Also look up if this record is matching any of the analisis list to restore selection
        if (pagu.no_surat_pengajuan && allAnalisis) {
          const matchedAnalisis = allAnalisis.find(a => a.no_surat === pagu.no_surat_pengajuan);
          if (matchedAnalisis) {
            setSelectedAnalisis(matchedAnalisis);
          }
        }`;

  const newRestoreSelection = `        // Also look up if this record is matching any of the analisis list to restore selection
        if (pagu.no_surat_pengajuan && allAnalisis && pagu.ringkasan_surat_pengajuan && (pagu.ringkasan_surat_pengajuan.includes('<!--imported-->') || pagu.ringkasan_surat_pengajuan.startsWith('{"'))) {
          const matchedAnalisis = allAnalisis.find(a => a.no_surat === pagu.no_surat_pengajuan);
          if (matchedAnalisis) {
            setSelectedAnalisis(matchedAnalisis);
          }
        }`;

  if (content.includes(oldRestoreSelection)) {
    content = content.replace(oldRestoreSelection, newRestoreSelection);
    console.log('Restore selection RLS check updated in edit/page.tsx.');
  } else {
    console.log('Error: oldRestoreSelection not found in edit/page.tsx!');
  }

  // Update handleSubmit to preserve imported tag during updates
  const oldSubmitMapping = `        } else if (value !== null && value !== undefined) {
          data.append(key, value.toString());
        }`;

  const newSubmitMapping = `        } else if (key === 'ringkasan_surat_pengajuan' && selectedAnalisis) {
          const valStr = (value || '').toString();
          data.append(key, valStr.includes('<!--imported-->') ? valStr : valStr + '<!--imported-->');
        } else if (value !== null && value !== undefined) {
          data.append(key, value.toString());
        }`;

  if (content.includes(oldSubmitMapping)) {
    content = content.replace(oldSubmitMapping, newSubmitMapping);
    console.log('handleSubmit tag preservation added in edit/page.tsx.');
  } else {
    console.log('Error: oldSubmitMapping not found in edit/page.tsx!');
  }

  // Beautiful styling for summary box (force list bullets)
  const oldStyle = `                      className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-800 leading-relaxed prose-custom max-w-full overflow-hidden break-words [word-break:break-word] shadow-inner"`;
  const newStyle = `                      className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-800 leading-relaxed max-w-full overflow-hidden break-words [word-break:break-word] shadow-inner font-sans [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-bold"`;

  if (content.includes(oldStyle)) {
    content = content.replace(oldStyle, newStyle);
    console.log('Summary box styles updated in edit/page.tsx.');
  } else {
    console.log('Error: oldStyle not found in edit/page.tsx!');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(editPath, content);
}

console.log('All styling and logic updates finished.');
