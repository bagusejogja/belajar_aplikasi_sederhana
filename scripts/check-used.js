const { createClient } = require('@supabase/supabase-js');

const dotenv = require('dotenv');
const fs = require('fs');
if (fs.existsSync('.env')) {
  const env = dotenv.parse(fs.readFileSync('.env'));
  process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: dataTambahPagu } = await supabase
    .from('tambah_pagu')
    .select('id, id_analisis, no_surat_pengajuan, no_surat_tanggapan');
  
  const { data: dataAnalisis } = await supabase
    .from('app_analisis_utama')
    .select('id_analisis, no_surat, perihal');

  console.log('--- TAMBAH PAGU ---');
  console.log(dataTambahPagu);

  console.log('\n--- APP ANALISIS UTAMA ---');
  console.log(dataAnalisis);

  const usedNoSuratSet = new Set();
  const usedIdAnalisisSet = new Set();
  if (dataTambahPagu) {
    dataTambahPagu.forEach(tp => {
      if (tp.no_surat_pengajuan) usedNoSuratSet.add(tp.no_surat_pengajuan.trim().toLowerCase());
      if (tp.no_surat_tanggapan) usedNoSuratSet.add(tp.no_surat_tanggapan.trim().toLowerCase());
      if (tp.id_analisis) usedIdAnalisisSet.add(tp.id_analisis);
    });
  }

  console.log('\n--- MATCHES ---');
  dataAnalisis.forEach(item => {
    const cleanNoSurat = (item.no_surat || '').trim().toLowerCase();
    const byId = usedIdAnalisisSet.has(item.id_analisis);
    const byNoSurat = !!cleanNoSurat && usedNoSuratSet.has(cleanNoSurat);
    if (byId || byNoSurat) {
      console.log(`Matched: ${item.id_analisis} (${item.no_surat}) -> By ID: ${byId}, By No Surat: ${byNoSurat}`);
    }
  });
}

check();
