const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const sb = createClient('https://tkeswcrglwcrxflxkcrc.supabase.co', 'sb_publishable_n02D5Nio17suATl3JVxTdg_OsuJDUqI');

function parseIndoDateToIso(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();

  // Jika sudah format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Format DD/MM/YYYY atau DD-MM-YYYY
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slashMatch) {
    const d = slashMatch[1].padStart(2, '0');
    const m = slashMatch[2].padStart(2, '0');
    const y = slashMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Kamus bulan bahasa Indonesia
  const bulanMap = {
    jan: '01', januari: '01',
    feb: '02', februari: '02',
    mar: '03', maret: '03',
    apr: '04', april: '04',
    mei: '05',
    jun: '06', juni: '06',
    jul: '07', juli: '07',
    agu: '08', agt: '08', agustus: '08', agutus: '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10',
    nov: '11', nop: '11', november: '11', nopember: '11',
    des: '12', desember: '12'
  };

  const textMatch = s.match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/);
  if (textMatch) {
    const d = textMatch[1].padStart(2, '0');
    const mName = textMatch[2];
    const y = textMatch[3];
    const m = bulanMap[mName];
    if (m) {
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

function extractSuratInfo(ket) {
  if (!ket) return { no_surat: null, tgl_surat: null };

  let no_surat = null;
  const noMatch = ket.match(/(?:nomor|no\.?|nota dinas(?:\s+no\.?)?|surat)\s*:?\s*([0-9]+[A-Za-z0-9\.\-\_]*(?:\/[A-Za-z0-9\.\-\_]+){2,})/i) ||
                  ket.match(/([0-9]+(?:\/[A-Za-z0-9\.\-\_]+){2,})/);
  if (noMatch) {
    no_surat = noMatch[1].replace(/[,;]+$/, '').trim();
  }

  let tgl_surat = null;
  const tglMatch = ket.match(/(?:tanggal|tgl\.?|tertanggal)\s*:?\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i) ||
                   ket.match(/(?:tanggal|tgl\.?|tertanggal)\s*:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i) ||
                   ket.match(/([0-9]{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+[0-9]{4})/i);
  if (tglMatch) {
    const rawTgl = tglMatch[1].trim();
    tgl_surat = parseIndoDateToIso(rawTgl);
  }

  return { no_surat, tgl_surat };
}

async function run() {
  console.log('Mengambil seluruh data gov_pagu_anggaran...');
  let allData = [];
  let page = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await sb.from('gov_pagu_anggaran')
      .select('id, keterangan')
      .range(page * limit, (page + 1) * limit - 1);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < limit) break;
    page++;
  }

  console.log('Total record diambil:', allData.length);

  const updates = [];
  let isoDateCount = 0;
  for (const row of allData) {
    if (!row.keterangan) continue;
    const { no_surat, tgl_surat } = extractSuratInfo(row.keterangan);
    if (no_surat || tgl_surat) {
      if (tgl_surat) isoDateCount++;
      updates.push({
        id: row.id,
        no_surat: no_surat || null,
        tgl_surat: tgl_surat || null
      });
    }
  }

  console.log('Total baris dengan nomor/tgl surat:', updates.length);
  console.log('Total baris dengan tanggal ISO valid (YYYY-MM-DD):', isoDateCount);

  let sql = '-- ====================================================================\n';
  sql += '-- SCRIPT MIGRASI: Tambah Kolom no_surat (TEXT) & tgl_surat (DATE)\n';
  sql += '-- Tabel: public.gov_pagu_anggaran\n';
  sql += '-- Total Data Terisi: ' + updates.length + ' baris dari field keterangan\n';
  sql += '-- Format Tanggal: ISO standard YYYY-MM-DD (PostgreSQL DATE Type)\n';
  sql += '-- Petunjuk: Buka Supabase Dashboard -> SQL Editor -> Tempel & Klik Run\n';
  sql += '-- ====================================================================\n\n';
  sql += '-- 1. Tambah kolom no_surat dan tgl_surat (DATE) jika belum ada\n';
  sql += 'ALTER TABLE public.gov_pagu_anggaran ADD COLUMN IF NOT EXISTS no_surat TEXT;\n';
  sql += 'ALTER TABLE public.gov_pagu_anggaran ADD COLUMN IF NOT EXISTS tgl_surat DATE;\n\n';

  sql += '-- 2. Update massal data no_surat dan tgl_surat hasil ekstraksi\n';
  sql += 'UPDATE public.gov_pagu_anggaran AS g\n';
  sql += 'SET \n';
  sql += '  no_surat = v.no_surat,\n';
  sql += '  tgl_surat = v.tgl_surat\n';
  sql += 'FROM (VALUES\n';

  const valuesSql = updates.map(u => {
    const noVal = u.no_surat ? `'${u.no_surat.replace(/'/g, "''")}'` : 'NULL';
    const tglVal = u.tgl_surat ? `'${u.tgl_surat}'::DATE` : 'NULL::DATE';
    return `  (${u.id}, ${noVal}::TEXT, ${tglVal})`;
  }).join(',\n');

  sql += valuesSql + '\n';
  sql += ') AS v(id, no_surat, tgl_surat)\n';
  sql += 'WHERE g.id = v.id;\n';

  fs.writeFileSync('supabase_add_no_surat_tgl_surat.sql', sql, 'utf-8');
  console.log('Sukses! File supabase_add_no_surat_tgl_surat.sql berhasil diperbarui dengan tipe DATE!');
}

run();
