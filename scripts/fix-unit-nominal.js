const fs = require('fs');

// 1. Fix page.tsx
const pagePath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Normalize line endings
pageContent = pageContent.replace(/\r\n/g, '\n');

// Update formatNumber to strip leading zeros
const oldFormatNumber = `  const formatNumber = (num: string | number) => {
    if (!num) return '0';
    const clean = num.toString().replace(/\\D/g, '');
    return clean.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
  };`;

const newFormatNumber = `  const formatNumber = (num: string | number) => {
    if (!num) return '0';
    const clean = num.toString().replace(/\\D/g, '');
    const parsed = parseInt(clean, 10);
    if (isNaN(parsed)) return '0';
    return parsed.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
  };`;

if (pageContent.includes(oldFormatNumber)) {
  pageContent = pageContent.replace(oldFormatNumber, newFormatNumber);
  console.log('formatNumber updated in page.tsx.');
} else {
  console.log('Error: oldFormatNumber not found!');
}

// Update cleanNumericString to handle decimals correctly
const oldCleanNumeric = `  const cleanNumericString = (val: string) => {
    if (!val) return '0';
    const cleaned = val.replace(/\\./g, '');
    return Math.round(parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0).toString();
  };`;

const newCleanNumeric = `  const cleanNumericString = (val: string) => {
    if (!val) return '0';
    let cleaned = val.trim();
    cleaned = cleaned.replace(/[,.]00$/, '');
    cleaned = cleaned.replace(/\\./g, '');
    cleaned = cleaned.replace(/,/g, '.');
    return Math.round(parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0).toString();
  };`;

if (pageContent.includes(oldCleanNumeric)) {
  pageContent = pageContent.replace(oldCleanNumeric, newCleanNumeric);
  console.log('cleanNumericString updated in page.tsx.');
} else {
  console.log('Error: oldCleanNumeric not found!');
}

// Add portal props to Select in page.tsx
const oldSelect = `                  <Select 
                    options={listUnit} 
                    isDisabled={isReadOnlyPengajuan}
                    value={formData.unit_id}
                    onChange={(val) => setFormData({...formData, unit_id: val})}
                    placeholder="Pilih Unit Kerja..."
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        borderRadius: '1.25rem', 
                        padding: '0.4rem', 
                        border: '1px solid #f3f4f6', 
                        backgroundColor: isReadOnlyPengajuan ? '#f1f5f9' : '#f9fafb', 
                        fontWeight: 'bold',
                        opacity: isReadOnlyPengajuan ? 0.9 : 1
                      }),
                    }}
                  />`;

const newSelect = `                  <Select 
                    options={listUnit} 
                    isDisabled={isReadOnlyPengajuan}
                    value={formData.unit_id}
                    onChange={(val) => setFormData({...formData, unit_id: val})}
                    placeholder="Pilih Unit Kerja..."
                    menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
                    styles={{
                      control: (base) => ({ 
                        ...base, 
                        borderRadius: '1.25rem', 
                        padding: '0.4rem', 
                        border: '1px solid #f3f4f6', 
                        backgroundColor: isReadOnlyPengajuan ? '#f1f5f9' : '#f9fafb', 
                        fontWeight: 'bold',
                        opacity: isReadOnlyPengajuan ? 0.9 : 1
                      }),
                      menuPortal: (base) => ({ ...base, zIndex: 9999 })
                    }}
                  />`;

if (pageContent.includes(oldSelect)) {
  pageContent = pageContent.replace(oldSelect, newSelect);
  console.log('Select portal props added in page.tsx.');
} else {
  console.log('Error: oldSelect not found!');
}

// Convert back to CRLF
pageContent = pageContent.replace(/\n/g, '\r\n');
fs.writeFileSync(pagePath, pageContent);

// 2. Fix OCRPanelPengajuan.tsx
const pengajuanPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/components/OCRPanelPengajuan.tsx';
if (fs.existsSync(pengajuanPath)) {
  let content = fs.readFileSync(pengajuanPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');
  
  // Replace parseOCRPengajuan nominal parser
  const oldParser = `  // 4. Parse Nominal Diajukan
  // Mencari "Rp" diikuti angka
  const nominalMatch = ocrText.match(/rp\\s*[.\\s]*([\\d.,]+)/i);
  if (nominalMatch) {
     let cleaned = nominalMatch[1].replace(/\\./g, '');
     if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/,/g, '.');
     }
     nominal_diajukan = parseFloat(cleaned) || 0;
  }`;

  const newParser = `  // 4. Parse Nominal Diajukan
  // Mencari "Rp" diikuti angka
  const nominalMatch = ocrText.match(/rp\\s*[.\\s]*([\\d.,]+)/i);
  if (nominalMatch) {
     let cleaned = nominalMatch[1].trim();
     cleaned = cleaned.replace(/[,.]00$/, '');
     cleaned = cleaned.replace(/\\./g, '');
     cleaned = cleaned.replace(/,/g, '.');
     nominal_diajukan = Math.round(parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0);
  }`;

  if (content.includes(oldParser)) {
    content = content.replace(oldParser, newParser);
    console.log('Parser updated in OCRPanelPengajuan.tsx.');
  }
  
  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(pengajuanPath, content);
}

// 3. Fix OCRPanelTanggapan.tsx
const tanggapanPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/components/OCRPanelTanggapan.tsx';
if (fs.existsSync(tanggapanPath)) {
  let content = fs.readFileSync(tanggapanPath, 'utf8');
  content = content.replace(/\r\n/g, '\n');
  
  // Replace parseOCRTanggapan nominal parser
  const oldParser = `  // 4. Parse Nominal Disetujui
  // Mencari "Rp" diikuti angka
  const nominalMatch = ocrText.match(/rp\\s*[.\\s]*([\\d.,]+)/i);
  if (nominalMatch) {
     let cleaned = nominalMatch[1].replace(/\\./g, '');
     if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/,/g, '.');
     }
     nominal_tanggapan = parseFloat(cleaned) || 0;
  }`;

  const newParser = `  // 4. Parse Nominal Disetujui
  // Mencari "Rp" diikuti angka
  const nominalMatch = ocrText.match(/rp\\s*[.\\s]*([\\d.,]+)/i);
  if (nominalMatch) {
     let cleaned = nominalMatch[1].trim();
     cleaned = cleaned.replace(/[,.]00$/, '');
     cleaned = cleaned.replace(/\\./g, '');
     cleaned = cleaned.replace(/,/g, '.');
     nominal_tanggapan = Math.round(parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0);
  }`;

  if (content.includes(oldParser)) {
    content = content.replace(oldParser, newParser);
    console.log('Parser updated in OCRPanelTanggapan.tsx.');
  }
  
  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(tanggapanPath, content);
}

console.log('All updates finished.');
