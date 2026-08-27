const fs = require('fs');
const tambahPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

// 1. Update OCRPanelPengajuan.tsx to remove inline AI summary call and add onOcrComplete callback
const pengajuanPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/components/OCRPanelPengajuan.tsx';
if (fs.existsSync(pengajuanPath)) {
  let content = fs.readFileSync(pengajuanPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Modify props to accept onOcrComplete
  const oldProps = `export default function OCRPanelPengajuan({ mainData, setMainData, setExternalFile, listUnit = [] }: any) {`;
  const newProps = `export default function OCRPanelPengajuan({ mainData, setMainData, setExternalFile, listUnit = [], onOcrComplete }: any) {`;
  
  if (content.includes(oldProps)) {
    content = content.replace(oldProps, newProps);
    console.log('Props updated in OCRPanelPengajuan.tsx.');
  }

  // Replace processOCR ending to call onOcrComplete instead of local AI call
  const oldProcessOCR = `      // Generate real AI summary
      let aiSummary = '';
      setIsAiProcessing(true);
      try {
        const res = await generateRingkasanFromText(extractedText);
        if (res.success && res.data?.ringkasan_html) {
          aiSummary = res.data.ringkasan_html;
        }
      } catch (err) {
        console.error("AI Summary generation failed:", err);
      } finally {
        setIsAiProcessing(false);
      }

      if (!aiSummary) {
        aiSummary = \`<p><strong>Ringkasan Usulan:</strong> Surat usulan penambahan pagu RKAT dari unit kerja dengan hal <em>\${parsed.perihal || '-'}</em>.</p>\`;
      }

      setMainData((prev: any) => ({
         ...prev,
         unit_id: matchedUnit || prev.unit_id,
         no_surat_pengajuan: parsed.no_surat || prev.no_surat_pengajuan,
         tanggal_surat_pengajuan: parsed.tanggal_surat || prev.tanggal_surat_pengajuan,
         hal_surat_pengajuan: parsed.perihal || prev.hal_surat_pengajuan,
         nominal_diajukan: parsed.nominal_usulan || prev.nominal_diajukan,
         ringkasan_surat_pengajuan: aiSummary
      }));`;

  const newProcessOCR = `      setMainData((prev: any) => ({
         ...prev,
         unit_id: matchedUnit || prev.unit_id,
         no_surat_pengajuan: parsed.no_surat || prev.no_surat_pengajuan,
         tanggal_surat_pengajuan: parsed.tanggal_surat || prev.tanggal_surat_pengajuan,
         hal_surat_pengajuan: parsed.perihal || prev.hal_surat_pengajuan,
         nominal_diajukan: parsed.nominal_usulan || prev.nominal_diajukan
      }));
      
      if (onOcrComplete) {
         onOcrComplete(extractedText);
      }`;

  if (content.includes(oldProcessOCR)) {
    content = content.replace(oldProcessOCR, newProcessOCR);
    console.log('processOCR updated in OCRPanelPengajuan.tsx.');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(pengajuanPath, content);
}

// 2. Helper to modify page file (tambah/page.tsx or edit/[id]/page.tsx)
function updatePage(path, isEdit) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Dynamic import react-quill-new
  if (!content.includes("const ReactQuill = dynamic")) {
    content = content.replace(
      "import { parseOCRMetadata } from '@/app/(dashboard)/analisis/components/OCRPanel';",
      `import { parseOCRMetadata } from '@/app/(dashboard)/analisis/components/OCRPanel';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });`
    );
  }

  // Add raw OCR state and generator function
  const oldStates = `  const [formData, setFormData] = useState({
    tahun_anggaran: 2026,
    unit_id: null as any,
    jenis_tambah_pagu: 'Penugasan',
    status_pengajuan: 'Draft',`;

  const newStates = `  const [ocrRawText, setOcrRawText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleGenerateAiSummary = async () => {
    if (!ocrRawText) return;
    setIsGeneratingSummary(true);
    try {
      let contextArsip = '';
      if (riwayatUsulanUnit && riwayatUsulanUnit.length > 0) {
        contextArsip = riwayatUsulanUnit.map((r: any) => 
          \`- Tanggal: \${r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}, No Surat: \${r.no_surat || '-'}, Perihal: \${r.perihal || '-'}, Pengajuan: Rp \${formatNumber(r.total_anggaran || 0)}, Disetujui: Rp \${formatNumber(r.nominal_disetujui || 0)}, Status Keputusan: \${r.keputusan || 'disetujui'}\`
        ).join('\\n');
      }

      const res = await generateRingkasanFromText(ocrRawText, contextArsip);
      if (res.success && res.data?.ringkasan_html) {
        setFormData((prev: any) => ({
          ...prev,
          ringkasan_surat_pengajuan: res.data.ringkasan_html + '<!--imported-->'
        }));
        alert("Berhasil membuat ringkasan AI (termasuk rekam jejak)!");
      } else {
        alert("Gagal memproses Ringkasan AI: " + (res.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Terjadi kesalahan: " + e.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const [formData, setFormData] = useState({
    tahun_anggaran: 2026,
    unit_id: null as any,
    jenis_tambah_pagu: 'Penugasan',
    status_pengajuan: 'Disetujui Semua',`;

  if (content.includes(oldStates)) {
    content = content.replace(oldStates, newStates);
    console.log(`States and AI generator function added to ${path}.`);
  }

  // Pass raw OCR handler to OCRPanelPengajuan
  const oldOCRPanel = `                    <OCRPanelPengajuan \n                      mainData={formData} \n                      setMainData={setFormData} \n                      setExternalFile={setFilePengajuan} \n                      listUnit={listUnit}\n                    />`;
  const newOCRPanel = `                    <OCRPanelPengajuan 
                      mainData={formData} 
                      setMainData={setFormData} 
                      setExternalFile={setFilePengajuan} 
                      listUnit={listUnit}
                      onOcrComplete={(text) => setOcrRawText(text)}
                    />`;

  if (content.includes(oldOCRPanel)) {
    content = content.replace(oldOCRPanel, newOCRPanel);
  } else {
    // Try single line search
    const oldOCRPanelSingle = `listUnit={listUnit}\n                    />`;
    const newOCRPanelSingle = `listUnit={listUnit}\n                      onOcrComplete={(text) => setOcrRawText(text)}\n                    />`;
    content = content.replace(oldOCRPanelSingle, newOCRPanelSingle);
  }

  // Replace read-only summary card with editable ReactQuill editor card
  const oldSummaryCard = `                {/* RINGKASAN SUBSTANSI (AI READ ONLY - FIXED CONTAINER WRAPPING) */}
                {formData.ringkasan_surat_pengajuan && (
                  <div className="space-y-2 md:col-span-3 pt-6 border-t border-gray-100 w-full overflow-hidden">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1 flex items-center gap-1.5 mb-2">
                      <Sparkles size={14} className="text-amber-500" /> Ringkasan AI Substansi Surat Usulan
                    </label>
                    <div 
                      className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-3xl text-sm text-slate-800 leading-relaxed max-w-full overflow-hidden break-words [word-break:break-word] shadow-inner font-sans [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-bold"
                      dangerouslySetInnerHTML={{ __html: formData.ringkasan_surat_pengajuan }}
                    />
                  </div>
                )}`;

  const newSummaryCard = `                {/* RINGKASAN SUBSTANSI DENGAN AI EDITOR (SEPERTI DI ANALISIS) */}
                <div className="space-y-4 md:col-span-3 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" /> Ringkasan AI Substansi Surat Usulan
                    </label>
                    
                    {ocrRawText && (
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
                    )}
                  </div>

                  <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-200">
                    <ReactQuill 
                      theme="snow"
                      value={formData.ringkasan_surat_pengajuan || ''}
                      onChange={(val) => setFormData((prev: any) => ({ ...prev, ringkasan_surat_pengajuan: val }))}
                      className="h-[250px] pb-10 [&_.ql-editor_p]:text-justify"
                      placeholder="Tulis ringkasan substansi di sini, atau jalankan Analisis AI setelah upload surat..."
                    />
                  </div>
                </div>`;

  if (content.includes(oldSummaryCard)) {
    content = content.replace(oldSummaryCard, newSummaryCard);
    console.log(`Summary card updated to ReactQuill editor in ${path}.`);
  } else {
    console.log(`Error: oldSummaryCard not found in ${path}!`);
  }

  // Remove options Draft and Diajukan from Step 2 select dropdown
  const oldSelectOptions = `<select 
                      name="status_pengajuan"
                      value={formData.status_pengajuan}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-indigo-200 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-200 transition-all font-black text-indigo-900 text-base cursor-pointer shadow-sm"
                    >
                      <option value="Draft">Draft (Belum Ditanggapi)</option>
                      <option value="Diajukan">Diajukan</option>
                      <option value="Disetujui Sebagian">Disetujui Sebagian</option>
                      <option value="Disetujui Semua">Disetujui Semua (100%)</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>`;

  const newSelectOptions = `<select 
                      name="status_pengajuan"
                      value={formData.status_pengajuan}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-indigo-200 rounded-2xl p-4 outline-none focus:ring-2 ring-indigo-200 transition-all font-black text-indigo-900 text-base cursor-pointer shadow-sm"
                    >
                      <option value="Disetujui Semua">Disetujui Semua (100%)</option>
                      <option value="Disetujui Sebagian">Disetujui Sebagian</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>`;

  if (content.includes(oldSelectOptions)) {
    content = content.replace(oldSelectOptions, newSelectOptions);
    console.log(`Select options Draft/Diajukan removed in ${path}.`);
  } else {
    // Try without spaces/indents
    const oldSelectOptionsStrip = `<option value="Draft">Draft (Belum Ditanggapi)</option>\n                      <option value="Diajukan">Diajukan</option>`;
    content = content.replace(oldSelectOptionsStrip, '');
    console.log(`Select options Draft/Diajukan removed (fallback mode) in ${path}.`);
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(path, content);
}

updatePage(tambahPath, false);
updatePage(editPath, true);

console.log('All changes applied successfully.');
