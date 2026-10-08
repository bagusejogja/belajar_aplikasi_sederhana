const XLSX = require('xlsx');
const fs = require('fs');
const wb = XLSX.readFile('tempalte lamproran.xlsx');
const sheet = wb.Sheets['Sheet1'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

const templateRows = [];
let currentBlock = '';
let currentRomawi = '';

rows.slice(1).forEach((r, idx) => {
  if (!r || r.length === 0 || !r.some(x => x !== null && x !== undefined && x !== '')) return;
  const no = r[0] !== undefined && r[0] !== null ? String(r[0]).trim() : '';
  const uraian = r[1] !== undefined && r[1] !== null ? String(r[1]).trim() : '';
  const volume = r[2] !== undefined && r[2] !== null && r[2] !== '' ? Number(r[2]) : null;
  const satuan = r[3] !== undefined && r[3] !== null ? String(r[3]).trim() : '';
  const tarif = r[4] !== undefined && r[4] !== null && r[4] !== '' ? Number(r[4]) : null;
  const targetBiaya = r[5] !== undefined && r[5] !== null && r[5] !== '' ? Number(r[5]) : null;

  if (['RUPIAH MURNI (RM)', 'BPPTNBH', 'ALOKASI DARI KEMENDIKTISAINTEK LAINNYA', 'ALOKASI DARI K/L LAINNYA', 'PLN/HLN/RMP/SBSN/KPBU', 'SELAIN APBN'].includes(uraian)) {
    currentBlock = uraian;
    currentRomawi = '';
  } else if (/^[IVXLCDM]+$/.test(no)) {
    currentRomawi = no;
  }

  let level = 3;
  let isBlock = false;
  let isHeader = false;

  if (['RUPIAH MURNI (RM)', 'BPPTNBH', 'ALOKASI DARI KEMENDIKTISAINTEK LAINNYA', 'ALOKASI DARI K/L LAINNYA', 'PLN/HLN/RMP/SBSN/KPBU', 'SELAIN APBN'].includes(uraian)) {
    level = 0;
    isBlock = true;
  } else if (/^[IVXLCDM]+$/.test(no)) {
    level = 1;
    isHeader = true;
  } else if (/^[A-Z]$/.test(no) || /^[IVXLCDM]+\.[A-Z]\.?$/.test(no)) {
    level = 2;
    isHeader = true;
  } else if (uraian.startsWith('- ')) {
    level = 4;
  } else if (/^\d+\./.test(uraian)) {
    level = 3;
  }

  // Generate match keys from uraian and clean string
  const cleanUraian = uraian.replace(/^[-•\d.]+\s*/, '').trim().toLowerCase();
  const matchKeys = [
    cleanUraian,
    uraian.toLowerCase()
  ];
  if (no) {
    matchKeys.push((no + ' ' + cleanUraian).toLowerCase());
  }

  templateRows.push({
    id: 'lrka_' + (idx + 1),
    no,
    uraian,
    volume,
    satuan,
    tarif,
    targetBiaya,
    block: currentBlock,
    romawi: currentRomawi,
    level,
    isBlock,
    isHeader,
    matchKeys: Array.from(new Set(matchKeys))
  });
});

console.log('Processed', templateRows.length, 'rows');
const tsContent = `// Format Struktur Lampiran RKA Kementrian (Sesuai tempalte lamproran.xlsx)
export interface LampiranRkaRow {
  id: string;
  no: string;
  uraian: string;
  volume: number | null;
  satuan: string;
  tarif: number | null;
  targetBiaya: number | null;
  block: string;
  romawi: string;
  level: number;
  isBlock: boolean;
  isHeader: boolean;
  matchKeys: string[];
}

export const LAMPIRAN_RKA_TEMPLATE: LampiranRkaRow[] = ${JSON.stringify(templateRows, null, 2)};
`;

fs.mkdirSync('src/lib/rka', { recursive: true });
fs.writeFileSync('src/lib/rka/lampiranRkaTemplate.ts', tsContent, 'utf8');
console.log('Saved to src/lib/rka/lampiranRkaTemplate.ts successfully!');
