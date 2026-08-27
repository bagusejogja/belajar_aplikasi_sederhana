const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAIImport() {
  const { data: utamaArr } = await supabase.from('app_analisis_utama').select('*').eq('no_surat', '728/UN1/K4L/K-K4L/KU.00.01/2026').limit(1);
  if (!utamaArr || utamaArr.length === 0) {
      console.log('No data found in app_analisis_utama');
      return;
  }
  const utama = utamaArr[0];
  
  let parsed = {};
  if (utama.analisis_html) {
      try { parsed = JSON.parse(utama.analisis_html); } catch (e) { parsed = { analisis: utama.analisis_html }; }
  }
  let parsedTanggapan = parsed.tanggapan || {};

  const mainData = {
     ...utama,
     id_analisis: utama.id_analisis,
     no_surat: utama.no_surat || '',
     tanggal_surat: utama.tanggal_surat || '',
     perihal: utama.perihal || '',
     unit_pengirim: utama.unit_pengirim || '',
     subyek_persuratan_simaster: utama.subyek_persuratan_simaster || parsed.subyek_persuratan_simaster || '',
     total_anggaran: utama.total_anggaran || '0',
     total_realisasi: utama.total_realisasi || '0',
     persen_serapan: utama.persen_serapan || '0',
     ringkasan_ai: utama.ringkasan_ai || parsed.analisis || '',
     analisis_html: parsed.analisis || utama.ringkasan_ai || '',
     jenis_usulan: parsed.jenis_usulan || '',
     rekomendasi_html: parsed.rekomendasi || '',
     pagu_berjalan: parsed.pagu_berjalan || {},
     file_lampiran: utama.file_lampiran || '',
     link_lampiran: utama.link_lampiran || '',
     keputusan: utama.keputusan || parsed.keputusan || 'disetujui semua',
     nominal_disetujui: utama.nominal_disetujui || parsed.nominal_disetujui || '0',
     status_pengajuan: utama.status_pengajuan || 'Di Proses',
     no_surat_tanggapan: parsedTanggapan.no_surat_tanggapan || '',
     tanggal_surat_tanggapan: parsedTanggapan.tanggal_surat_tanggapan || '',
     hal_surat_tanggapan: parsedTanggapan.hal_surat_tanggapan || '',
     nominal_tanggapan: parsedTanggapan.nominal_tanggapan || 0,
     link_surat_tanggapan: parsedTanggapan.link_surat_tanggapan || ''
  };

  // Same logic as page.tsx
  let parsedDate = null;
  if (mainData.tanggal_surat) {
     if (mainData.tanggal_surat.includes('-')) {
        parsedDate = mainData.tanggal_surat;
     } else {
        try {
           const months = {
              'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
              'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
              'september': '09', 'oktober': '10', 'november': '11', 'desember': '12'
           };
           const parts = mainData.tanggal_surat.toLowerCase().split(' ');
           if (parts.length >= 3) {
              const day = parts[0].padStart(2, '0');
              const month = months[parts[1]] || '01';
              const year = parts[2];
              parsedDate = `${year}-${month}-${day}`;
           }
        } catch (e) {}
     }
  }

  let unitId = null;
  if (mainData.unit_pengirim) {
     const { data: govUnit } = await supabase.from('gov_units').select('id').eq('nama_unit', mainData.unit_pengirim).maybeSingle();
     if (govUnit) unitId = govUnit.id;
  }

  const rawStatus = (mainData.status_pengajuan && mainData.status_pengajuan !== 'Di Proses') ? mainData.status_pengajuan : (mainData.keputusan || 'Di Proses');
  const titleCaseStatus = rawStatus.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const allowedJenis = ['Penugasan', 'Inisiatif Unit', 'Pindah Pagu'];
  let safeJenis = mainData.jenis_usulan || 'Penugasan';
  if (!allowedJenis.includes(safeJenis)) {
      if (safeJenis.toLowerCase().includes('inisiatif')) safeJenis = 'Inisiatif Unit';
      else if (safeJenis.toLowerCase().includes('pindah')) safeJenis = 'Pindah Pagu';
      else safeJenis = 'Penugasan';
  }

  const parseSafeNum = (val) => {
     if (!val) return 0;
     let str = val.toString();
     str = str.replace(/\./g, '').replace(/,/g, '.');
     str = str.replace(/[^0-9.-]+/g, '');
     return Number(str) || 0;
  };

  const dataTambahPagu = {
     no_surat_pengajuan: mainData.no_surat,
     tanggal_surat_pengajuan: parsedDate,
     hal_surat_pengajuan: mainData.perihal,
     unit_id: unitId,
     tahun_anggaran: new Date().getFullYear(),
     nominal_diajukan: parseSafeNum(mainData.total_anggaran),
     jenis_tambah_pagu: safeJenis,
     status_pengajuan: titleCaseStatus,
     nominal_tanggapan: parseSafeNum(mainData.nominal_tanggapan),
     file_surat_pengajuan: mainData.file_lampiran || mainData.link_lampiran || '',
     file_surat_tanggapan: mainData.link_surat_tanggapan || '',
     is_active: 1
  };
  
  console.log("dataTambahPagu to insert:", dataTambahPagu);

  const { data, error } = await supabase.from('tambah_pagu').insert([dataTambahPagu]);
  console.log('Insert Error:', error);
}

checkAIImport();
