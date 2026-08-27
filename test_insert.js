const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const mainData = {
     no_surat: "MANUAL-001/TEST/2026",
     tanggal_surat: "15 Agustus 2026", // Manual input uses standard text or datepicker? Let's check how the form returns it.
     perihal: "Test Manual",
     unit_pengirim: "Kantor Keamanan, Keselamatan Kerja, Kedaruratan, dan Lingkungan", // The unit selected in Select
     total_anggaran: "140.600.000",
     jenis_usulan: "Penugasan",
     status_pengajuan: "diajukan",
     nominal_tanggapan: 0,
     file_lampiran: "",
     link_lampiran: "",
     link_surat_tanggapan: ""
  };

  let parsedDate = null;
  if (mainData.tanggal_surat) {
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
        } else {
           // what if it's already YYYY-MM-DD?
           parsedDate = mainData.tanggal_surat; 
        }
     } catch (e) {}
  }

  let unitId = null;
  if (mainData.unit_pengirim) {
     const { data: govUnit } = await supabase.from('gov_units').select('id').eq('nama_unit', mainData.unit_pengirim).maybeSingle();
     if (govUnit) unitId = govUnit.id;
  }

  const rawStatus = (mainData.status_pengajuan && mainData.status_pengajuan !== 'Di Proses') ? mainData.status_pengajuan : (mainData.keputusan || 'Di Proses');
  const titleCaseStatus = rawStatus.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  const dataTambahPagu = {
     no_surat_pengajuan: mainData.no_surat,
     tanggal_surat_pengajuan: parsedDate,
     hal_surat_pengajuan: mainData.perihal,
     unit_id: unitId,
     tahun_anggaran: new Date().getFullYear(),
     nominal_diajukan: mainData.total_anggaran ? Number(mainData.total_anggaran.toString().replace(/[^0-9.-]+/g, '')) : 0,
     jenis_tambah_pagu: mainData.jenis_usulan || 'Penugasan',
     status_pengajuan: titleCaseStatus,
     nominal_tanggapan: mainData.nominal_tanggapan ? Number(mainData.nominal_tanggapan.toString().replace(/[^0-9.-]+/g, '')) : 0,
     file_surat_pengajuan: mainData.file_lampiran || mainData.link_lampiran || '',
     file_surat_tanggapan: mainData.link_surat_tanggapan || '',
     is_active: 1
  };
  
  const { data, error } = await supabase.from('tambah_pagu').insert([dataTambahPagu]);
  console.log('Insert Error:', error);
}

checkDb();
