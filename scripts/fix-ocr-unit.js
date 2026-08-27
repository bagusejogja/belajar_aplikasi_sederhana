const fs = require('fs');

// 1. Fix page.tsx to pass listUnit to OCRPanelPengajuan
const pagePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

pageContent = pageContent.replace(/\r\n/g, '\n');

const oldPanelRender = `                    <OCRPanelPengajuan 
                      mainData={formData} 
                      setMainData={setFormData} 
                      setExternalFile={setFilePengajuan} 
                    />`;

const newPanelRender = `                    <OCRPanelPengajuan 
                      mainData={formData} 
                      setMainData={setFormData} 
                      setExternalFile={setFilePengajuan} 
                      listUnit={listUnit}
                    />`;

if (pageContent.includes(oldPanelRender)) {
  pageContent = pageContent.replace(oldPanelRender, newPanelRender);
  console.log('Passed listUnit to OCRPanelPengajuan in page.tsx.');
} else {
  console.log('Error: oldPanelRender not found!');
}

pageContent = pageContent.replace(/\n/g, '\r\n');
fs.writeFileSync(pagePath, pageContent);

// 2. Fix OCRPanelPengajuan.tsx to import parseOCRMetadata and perform unit matching
const pengajuanPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/components/OCRPanelPengajuan.tsx';
let pengajuanContent = fs.readFileSync(pengajuanPath, 'utf8');

pengajuanContent = pengajuanContent.replace(/\r\n/g, '\n');

// Replace top import section to import parseOCRMetadata
const oldImport = `import { supabase } from '@/lib/supabase';`;
const newImport = `import { supabase } from '@/lib/supabase';
import { parseOCRMetadata } from '@/app/(dashboard)/analisis/components/OCRPanel';`;

if (pengajuanContent.includes(oldImport)) {
  pengajuanContent = pengajuanContent.replace(oldImport, newImport);
  console.log('Imported parseOCRMetadata in OCRPanelPengajuan.tsx.');
} else {
  console.log('Error: oldImport not found!');
}

// Modify component function signature to accept listUnit
const oldComponentSig = `export default function OCRPanelPengajuan({ mainData, setMainData, setExternalFile }: any) {`;
const newComponentSig = `export default function OCRPanelPengajuan({ mainData, setMainData, setExternalFile, listUnit = [] }: any) {`;

if (pengajuanContent.includes(oldComponentSig)) {
  pengajuanContent = pengajuanContent.replace(oldComponentSig, newComponentSig);
  console.log('Component signature updated in OCRPanelPengajuan.tsx.');
} else {
  console.log('Error: oldComponentSig not found!');
}

// Update processOCR to use parseOCRMetadata
const oldProcessOCR = `      const parsed = parseOCRPengajuan(extractedText);
      setMainData((prev: any) => ({
         ...prev,
         no_surat_pengajuan: parsed.no_surat_pengajuan || prev.no_surat_pengajuan,
         tanggal_surat_pengajuan: parsed.tanggal_surat_pengajuan || prev.tanggal_surat_pengajuan,
         hal_surat_pengajuan: parsed.hal_surat_pengajuan || prev.hal_surat_pengajuan,
         nominal_diajukan: parsed.nominal_diajukan || prev.nominal_diajukan
      }));`;

const newProcessOCR = `      const formattedUnits = listUnit.map((u: any) => ({ id: u.value, nama_unit: u.label }));
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
         nominal_diajukan: parsed.nominal_usulan || prev.nominal_diajukan
      }));`;

if (pengajuanContent.includes(oldProcessOCR)) {
  pengajuanContent = pengajuanContent.replace(oldProcessOCR, newProcessOCR);
  console.log('processOCR updated in OCRPanelPengajuan.tsx.');
} else {
  console.log('Error: oldProcessOCR not found!');
}

pengajuanContent = pengajuanContent.replace(/\n/g, '\r\n');
fs.writeFileSync(pengajuanPath, pengajuanContent);

console.log('All OCR updates completed.');
