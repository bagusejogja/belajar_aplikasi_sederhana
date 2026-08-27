const fs = require('fs');

// 1. Update OCRPanelPengajuan.tsx to import generateRingkasanFromText and generate proper AI summary
const pengajuanPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/components/OCRPanelPengajuan.tsx';
if (fs.existsSync(pengajuanPath)) {
  let content = fs.readFileSync(pengajuanPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  // Import generateRingkasanFromText
  if (!content.includes('generateRingkasanFromText')) {
    content = content.replace(
      "import { parseOCRMetadata } from '@/app/(dashboard)/analisis/components/OCRPanel';",
      "import { parseOCRMetadata } from '@/app/(dashboard)/analisis/components/OCRPanel';\nimport { generateRingkasanFromText } from '@/app/actions/ai-scan';"
    );
  }

  // Update processOCR to generate AI summary
  const oldProcessOCR = `      const formattedUnits = listUnit.map((u: any) => ({ id: u.value, nama_unit: u.label }));
      const parsed = parseOCRMetadata(extractedText, formattedUnits);
      
      let matchedUnit = null;
      if (parsed.unit_pengirim) {
        matchedUnit = listUnit.find((u: any) => u.label === parsed.unit_pengirim);
      }

      setMainData((prev: any) => ({
         ...prev,
         unit_id: matchedUnit || prev.unit_id,
         no_surat_pengajuan: parsed.no_surat || prev.no_surat_pengajuan,
         tanggal_surat_pengajuan: parsed.tanggal_surat || prev.tanggal_surat_pengajuan,
         hal_surat_pengajuan: parsed.perihal || prev.hal_surat_pengajuan,
         nominal_diajukan: parsed.nominal_usulan || prev.nominal_diajukan,
         ringkasan_surat_pengajuan: extractedText.replace(/\\n/g, '<br>')
      }));`;

  const newProcessOCR = `      const formattedUnits = listUnit.map((u: any) => ({ id: u.value, nama_unit: u.label }));
      const parsed = parseOCRMetadata(extractedText, formattedUnits);
      
      let matchedUnit = null;
      if (parsed.unit_pengirim) {
        matchedUnit = listUnit.find((u: any) => u.label === parsed.unit_pengirim);
      }

      // Generate real AI summary
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

  if (content.includes(oldProcessOCR)) {
    content = content.replace(oldProcessOCR, newProcessOCR);
    console.log('processOCR AI Summary updated in OCRPanelPengajuan.tsx.');
  } else {
    console.log('Error: oldProcessOCR target not found!');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(pengajuanPath, content);
}

// 2. Update tambah/route.ts to use SUPABASE_SERVICE_ROLE_KEY
const tambahRoutePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/api/tambah-pagu/tambah/route.ts';
if (fs.existsSync(tambahRoutePath)) {
  let content = fs.readFileSync(tambahRoutePath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldClientDef = `const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder');
const supabase = createClient(supabaseUrl, supabaseAnonKey);`;

  const newClientDef = `const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder');
const supabase = createClient(supabaseUrl, supabaseServiceKey);`;

  if (content.includes(oldClientDef)) {
    content = content.replace(oldClientDef, newClientDef);
    console.log('Supabase client updated in tambah/route.ts.');
  } else {
    console.log('Error: oldClientDef not found in tambah/route.ts!');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(tambahRoutePath, content);
}

// 3. Update edit/route.ts to use SUPABASE_SERVICE_ROLE_KEY
const editRoutePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/api/tambah-pagu/edit/route.ts';
if (fs.existsSync(editRoutePath)) {
  let content = fs.readFileSync(editRoutePath, 'utf8');
  content = content.replace(/\r\n/g, '\n');

  const oldClientDef = `const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder');
const supabase = createClient(supabaseUrl, supabaseAnonKey);`;

  const newClientDef = `const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder');
const supabase = createClient(supabaseUrl, supabaseServiceKey);`;

  if (content.includes(oldClientDef)) {
    content = content.replace(oldClientDef, newClientDef);
    console.log('Supabase client updated in edit/route.ts.');
  } else {
    console.log('Error: oldClientDef not found in edit/route.ts!');
  }

  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(editRoutePath, content);
}

console.log('All updates finished.');
