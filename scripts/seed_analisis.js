const fs = require('fs');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const envStr = fs.readFileSync('.env.local', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/[\r\n"']/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function parseCsvLine(text) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && text[i+1] === '"' && inQuotes) {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function getCsvRows(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/10EaZBJ4x8ZMP2zyI_dUE1ljE88Gb5c64_NYtHskGEik/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data));
        });
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('Fetching Sheet1...');
    const sheet1Raw = await getCsvRows('Sheet1');
    const sheet1Lines = sheet1Raw.split('\n').filter(l => l.trim() !== '');
    sheet1Lines.shift(); // remove header
    const utamaData = sheet1Lines.map(line => {
      const cols = parseCsvLine(line);
      return {
        id_analisis: cols[1] || null,
        no_surat: cols[2] || null,
        tanggal_surat: cols[3] || null,
        lampiran: cols[4] || null,
        perihal: cols[5] || null,
        unit_pengirim: cols[6] || null,
        nama_penandatangan: cols[7] || null,
        nominal_tambah_pagu: cols[8] || null,
        ringkasan_ai: cols[9] || null,
        total_anggaran: cols[10] || null,
        total_realisasi: cols[11] || null,
        persen_serapan: cols[12] || null,
        catatan_tambahan: cols[13] || null,
        keputusan: cols[14] || null,
        nominal_disetujui: cols[15] || null,
        alasan_keputusan: cols[16] || null,
        file_surat: cols[17] || null,
        link_pdf: cols[18] || null,
        file_lampiran: cols[19] || null,
        link_lampiran: cols[20] || null,
        analisis_html: cols[21] || null
      };
    }).filter(x => x.id_analisis);

    if (utamaData.length > 0) {
      const { error } = await supabase.from('app_analisis_utama').insert(utamaData);
      if (error) console.error('Error insert utama:', error.message);
      else console.log(`Inserted ${utamaData.length} rows to app_analisis_utama`);
    }

    console.log('Fetching Detail Realisasi...');
    const detailRaw = await getCsvRows('Detail Realisasi');
    const detailLines = detailRaw.split('\n').filter(l => l.trim() !== '');
    detailLines.shift();
    const detailData = detailLines.map(line => {
      const cols = parseCsvLine(line);
      return {
        id_analisis: cols[1] || null,
        no_surat: cols[2] || null,
        no_urut: cols[3] || null,
        uraian_kegiatan: cols[4] || null,
        anggaran: cols[5] || null,
        realisasi: cols[6] || null,
        persen_serapan: cols[7] || null
      };
    }).filter(x => x.id_analisis);

    if (detailData.length > 0) {
      const { error } = await supabase.from('app_detail_realisasi').insert(detailData);
      if (error) console.error('Error insert detail:', error.message);
      else console.log(`Inserted ${detailData.length} rows to app_detail_realisasi`);
    }

    console.log('Fetching Pagu Historis...');
    const historisRaw = await getCsvRows('Pagu Historis');
    const historisLines = historisRaw.split('\n').filter(l => l.trim() !== '');
    historisLines.shift();
    const historisData = historisLines.map(line => {
      const cols = parseCsvLine(line);
      return {
        id_analisis: cols[1] || null,
        no_surat: cols[2] || null,
        tahun: cols[3] || null,
        pagu_awal: cols[4] || null,
        tambah: cols[5] || null,
        kurang: cols[6] || null,
        total_pagu: cols[7] || null,
        realisasi_historis: cols[8] || null
      };
    }).filter(x => x.id_analisis);

    if (historisData.length > 0) {
      const { error } = await supabase.from('app_pagu_historis').insert(historisData);
      if (error) console.error('Error insert historis:', error.message);
      else console.log(`Inserted ${historisData.length} rows to app_pagu_historis`);
    }

    console.log('Data migration complete!');

  } catch (e) {
    console.error(e);
  }
})();
