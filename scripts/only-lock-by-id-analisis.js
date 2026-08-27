const fs = require('fs');

function applyOnlyIdLocking(path) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Change usedNoSuratSet usage to only check usedIdAnalisisSet
  const oldFetchMapping = `      const usedNoSuratSet = new Set<string>();
      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.no_surat_pengajuan && tp.no_surat_pengajuan.trim()) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
          if (tp.no_surat_tanggapan && tp.no_surat_tanggapan.trim()) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }`;

  const newFetchMapping = `      const usedIdAnalisisSet = new Set<string>();
      if (dataTambahPagu) {
        dataTambahPagu.forEach(tp => {
          if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
        });
      }`;

  if (content.includes(oldFetchMapping)) {
    content = content.replace(oldFetchMapping, newFetchMapping);
    console.log(`usedIdAnalisisSet mapping updated in ${path}`);
  }

  // Update check logic to only check usedIdAnalisisSet
  const oldIsUsedCheck1 = `          const isUsed = !isCurrentRecord && (usedIdAnalisisSet.has(item.id_analisis) || (cleanNoSurat && usedNoSuratSet.has(cleanNoSurat)));`;
  const newIsUsedCheck1 = `          const isUsed = !isCurrentRecord && !!item.id_analisis && usedIdAnalisisSet.has(item.id_analisis);`;

  if (content.includes(oldIsUsedCheck1)) {
    content = content.replace(oldIsUsedCheck1, newIsUsedCheck1);
    console.log(`isUsed expression updated in ${path}`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

const tambahPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPage = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

applyOnlyIdLocking(tambahPage);
applyOnlyIdLocking(editPage);


// 2. Uniform Save and Cancel buttons in tambah/page.tsx for manual mode
let pageContent = fs.readFileSync(tambahPage, 'utf8');
pageContent = pageContent.replace(/\r\n/g, '\n');

// 2a. Modify Step 1 next button container to show Batal button in manual mode
const oldStep1NextBtn = `            {/* STEP 1 NEXT BUTTON */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(selectedAnalisis ? 'step2' : 'step2')}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                Selanjutnya: {selectedAnalisis ? 'Rincian & Pagu' : 'Tanggapan & Keputusan'} <ChevronRight size={16} />
              </button>
            </div>`;

const newStep1NextBtn = `            {/* STEP 1 NEXT BUTTON */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-8">
              {!selectedAnalisis ? (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-8 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm"
                >
                  Batal
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setActiveStep(selectedAnalisis ? 'step2' : 'step2')}
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all"
              >
                Selanjutnya: {selectedAnalisis ? 'Rincian & Pagu' : 'Tanggapan & Keputusan'} <ChevronRight size={16} />
              </button>
            </div>`;

if (pageContent.includes(oldStep1NextBtn)) {
  pageContent = pageContent.replace(oldStep1NextBtn, newStep1NextBtn);
  console.log('Step 1 navigation buttons updated in page.tsx');
}

// 2b. Modify Step 2 back button container to show Batal and Save buttons in manual mode
const oldStep2BackBtn = `            {/* STEP 2/4 BUTTONS */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setActiveStep(selectedAnalisis ? 'step3' : 'step1')}
                className="px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Kembali ke {selectedAnalisis ? 'Ringkasan' : 'Tahap 1'}
              </button>
            </div>`;

const newStep2BackBtn = `            {/* STEP 2/4 BUTTONS */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-8">
              <button
                type="button"
                onClick={() => setActiveStep(selectedAnalisis ? 'step3' : 'step1')}
                className="px-6 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
              >
                <ChevronLeft size={16} /> Kembali ke {selectedAnalisis ? 'Ringkasan' : 'Tahap 1'}
              </button>

              {!selectedAnalisis && (
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => router.back()}
                    className="px-8 py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSaving ? "MENYIMPAN..." : "SIMPAN USULAN PAGU"}
                  </button>
                </div>
              )}
            </div>`;

if (pageContent.includes(oldStep2BackBtn)) {
  pageContent = pageContent.replace(oldStep2BackBtn, newStep2BackBtn);
  console.log('Step 2 navigation and save buttons updated in page.tsx');
}

// 2c. Only render Floating action bar if selectedAnalisis is true
const oldFloatingBar = `        {/* FLOATING ACTION BAR */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-40">`;

const newFloatingBar = `        {/* FLOATING ACTION BAR */}
        {selectedAnalisis && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-40">`;

const oldFloatingBarEnd = `          </div>
        </div>
      </form>`;

const newFloatingBarEnd = `          </div>
        </div>
        )}
      </form>`;

if (pageContent.includes(oldFloatingBar) && pageContent.includes(oldFloatingBarEnd)) {
  pageContent = pageContent.replace(oldFloatingBar, newFloatingBar);
  pageContent = pageContent.replace(oldFloatingBarEnd, newFloatingBarEnd);
  console.log('Floating Action Bar condition set to selectedAnalisis only.');
}

pageContent = pageContent.replace(/\n/g, '\r\n');
fs.writeFileSync(tambahPage, pageContent);

console.log('All manual buttons and id_analisis locking checks applied.');
