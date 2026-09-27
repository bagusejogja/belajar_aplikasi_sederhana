const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const sb = createClient('https://tkeswcrglwcrxflxkcrc.supabase.co', 'sb_publishable_n02D5Nio17suATl3JVxTdg_OsuJDUqI');

function extractSuratInfo(ket) {
  if (!ket) return { no_surat: null, tgl_surat: null };

  let no_surat = null;
  // Pola nomor surat khas UGM: ada kata nomor/no/nota dinas/surat atau format angka/.../...
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
    tgl_surat = tglMatch[1].trim();
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
  for (const row of allData) {
    if (!row.keterangan) continue;
    const { no_surat, tgl_surat } = extractSuratInfo(row.keterangan);
    if (no_surat || tgl_surat) {
      updates.push({
        id: row.id,
        no_surat: no_surat || null,
        tgl_surat: tgl_surat || null
      });
    }
  }

  console.log('Total baris yang berhasil diekstrak:', updates.length);

  let sql = '-- ====================================================================\n';
  sql += '-- SCRIPT MIGRASI: Tambah Kolom no_surat & tgl_surat di gov_pagu_anggaran\n';
  sql += '-- Total Data Terisi: ' + updates.length + ' baris dari field keterangan\n';
  sql += '-- Petunjuk: Buka Supabase Dashboard -> SQL Editor -> Tempel & Klik Run\n';
  sql += '-- ====================================================================\n\n';
  sql += '-- 1. Tambah kolom no_surat dan tgl_surat jika belum ada\n';
  sql += 'ALTER TABLE public.gov_pagu_anggaran ADD COLUMN IF NOT EXISTS no_surat TEXT;\n';
  sql += 'ALTER TABLE public.gov_pagu_anggaran ADD COLUMN IF NOT EXISTS tgl_surat TEXT;\n\n';

  sql += '-- 2. Update massal data yang diekstrak dari field keterangan\n';
  sql += 'UPDATE public.gov_pagu_anggaran AS g\n';
  sql += 'SET \n';
  sql += '  no_surat = v.no_surat,\n';
  sql += '  tgl_surat = v.tgl_surat\n';
  sql += 'FROM (VALUES\n';

  const valuesSql = updates.map(u => {
    const noVal = u.no_surat ? `'${u.no_surat.replace(/'/g, "''")}'` : 'NULL';
    const tglVal = u.tgl_surat ? `'${u.tgl_surat.replace(/'/g, "''")}'` : 'NULL';
    return `  (${u.id}, ${noVal}::TEXT, ${tglVal}::TEXT)`;
  }).join(',\n');

  sql += valuesSql + '\n';
  sql += ') AS v(id, no_surat, tgl_surat)\n';
  sql += 'WHERE g.id = v.id;\n';

  fs.writeFileSync('supabase_add_no_surat_tgl_surat.sql', sql, 'utf-8');
  console.log('Sukses! File supabase_add_no_surat_tgl_surat.sql berhasil digenerate.');
}

run();
