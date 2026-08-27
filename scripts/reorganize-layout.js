const fs = require('fs');
const path = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';

let content = fs.readFileSync(path, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// 1. Move OCRPanelPengajuan to the top of Step 1 card
const ocrPanelPengajuanBlock = `                {!isReadOnlyPengajuan && (
                  <div className="md:col-span-3 space-y-6 pt-6 border-t border-gray-100">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Link GDrive / SharePoint Lampiran (Optional)</label>
                      <div className="relative">
                        <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                          type="text" 
                          name="link_surat_pengajuan"
                          value={formData.link_surat_pengajuan}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-blue-100 transition-all text-sm italic text-blue-600"
                          placeholder="https://drive.google.com/..."
                        />
                      </div>
                    </div>
                    
                    <OCRPanelPengajuan 
                      mainData={formData} 
                      setMainData={setFormData} 
                      setExternalFile={setFilePengajuan} 
                    />
                  </div>
                )}`;

// We will delete it from its old position and put it at the top
if (content.includes(ocrPanelPengajuanBlock)) {
  content = content.replace(ocrPanelPengajuanBlock, '');
  console.log('Removed OCRPanelPengajuan from old position.');
} else {
  console.log('Error: ocrPanelPengajuanBlock not found!');
}

// Now insert OCRPanelPengajuan at the top of the card (right after the header / currentPengajuanLink check block)
const headerMarker = `                    )}
                  </div>
                )}
              </div>`;

const insertionIndex = content.indexOf(headerMarker);
if (insertionIndex !== -1) {
  const insertAt = insertionIndex + headerMarker.length;
  const ocrPanelAtTop = `

              {/* LOCAL OCR PANEL PENGAJUAN (DI ATAS AGAR BISA MEMENUHI ISIAN DI BAWAHNYA) */}
              {!isReadOnlyPengajuan && (
                <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm">
                  <OCRPanelPengajuan 
                    mainData={formData} 
                    setMainData={setFormData} 
                    setExternalFile={setFilePengajuan} 
                  />
                </div>
              )}`;
  
  content = content.slice(0, insertAt) + ocrPanelAtTop + content.slice(insertAt);
  console.log('Inserted OCRPanelPengajuan at the top.');
} else {
  console.log('Error: headerMarker not found!');
}

// Insert GDrive link with paperclip at the bottom of Step 1 form grid
const step1GridEnd = `                <div className="space-y-2 md:col-span-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subyek Pengajuan di Simaster</label>
                  <input 
                    type="text" 
                    name="subyek_pengajuan_di_simaster_persuratan"
                    readOnly={isReadOnlyPengajuan}
                    value={formData.subyek_pengajuan_di_simaster_persuratan}
                    onChange={handleInputChange}
                    className={\`w-full border rounded-2xl p-4 outline-none transition-all font-medium text-xs italic \${
                      isReadOnlyPengajuan ? 'bg-slate-100/80 text-slate-800 border-slate-200 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-600 focus:ring-2 ring-blue-100'
                    }\`}
                    placeholder="Salin subyek lengkap dari Simaster..."
                  />
                </div>`;

const linkWithClipStep1 = `

                {/* LINK SURAT PENGAJUAN (LINK DIBAWAH BEGAMBAR CLIP) */}
                <div className="md:col-span-3 space-y-2 pt-6 border-t border-gray-100">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                    <Paperclip size={14} className="text-gray-400" /> Link GDrive / SharePoint Lampiran (Optional)
                  </label>
                  <div className="relative">
                    <Paperclip size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      name="link_surat_pengajuan"
                      value={formData.link_surat_pengajuan}
                      onChange={handleInputChange}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-blue-100 transition-all text-sm italic text-blue-600 shadow-sm"
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>`;

if (content.includes(step1GridEnd)) {
  content = content.replace(step1GridEnd, step1GridEnd + linkWithClipStep1);
  console.log('Link with clip added to Step 1.');
} else {
  console.log('Error: step1GridEnd not found!');
}

// 2. Reorganize Step 2 (Tanggapan)
const oldStep2OCRBlock = `                {/* 1. TOP SECTION: UPLOAD FILE & LINK SURAT TANGGAPAN + LOCAL OCR PANEL */}
                <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Link Surat Tanggapan (GDrive / SharePoint - Optional)</label>
                    <div className="relative">
                      <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        name="link_surat_tanggapan"
                        value={formData.link_surat_tanggapan}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-gray-200 text-slate-700 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-indigo-200 transition-all text-sm italic placeholder-slate-400 shadow-sm"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <OCRPanelTanggapan 
                      mainData={formData} 
                      setMainData={setFormData} 
                      setExternalFile={setFileTanggapan} 
                    />
                  </div>
                </div>`;

const newStep2OCRBlock = `                {/* 1. TOP SECTION: LOCAL OCR PANEL FOR TANGGAPAN */}
                <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-[2rem] shadow-sm">
                  <OCRPanelTanggapan 
                    mainData={formData} 
                    setMainData={setFormData} 
                    setExternalFile={setFileTanggapan} 
                  />
                </div>`;

if (content.includes(oldStep2OCRBlock)) {
  content = content.replace(oldStep2OCRBlock, newStep2OCRBlock);
  console.log('Replaced old Step 2 OCR block.');
} else {
  console.log('Error: oldStep2OCRBlock not found!');
}

// Add Link to GDrive at the bottom of Step 2 form fields (right after Nominal input)
const step2GridEnd = `                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nominal Disetujui Pimpinan (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-indigo-500">Rp</span>
                      <input 
                        type="text" 
                        name="nominal_tanggapan"
                        value={formatNumber(formData.nominal_tanggapan)}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-indigo-100 transition-all font-black text-indigo-800 text-lg"
                      />
                    </div>
                  </div>`;

const linkWithClipStep2 = `

                  {/* LINK SURAT TANGGAPAN (LINK DIBAWAH BEGAMBAR CLIP) */}
                  <div className="space-y-2 pt-6 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                      <Paperclip size={14} className="text-gray-400" /> Link Surat Tanggapan (GDrive / SharePoint - Optional)
                    </label>
                    <div className="relative">
                      <Paperclip size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        name="link_surat_tanggapan"
                        value={formData.link_surat_tanggapan}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 ring-indigo-200 transition-all text-sm italic text-blue-600 shadow-sm"
                        placeholder="https://drive.google.com/..."
                      />
                    </div>
                  </div>`;

if (content.includes(step2GridEnd)) {
  content = content.replace(step2GridEnd, step2GridEnd + linkWithClipStep2);
  console.log('Link with clip added to Step 2.');
} else {
  console.log('Error: step2GridEnd not found!');
}

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(path, content);
console.log('Completed layout reorganization.');
