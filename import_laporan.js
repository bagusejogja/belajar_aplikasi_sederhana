const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const treeStructure = [
  { keterangan: 'PENERIMAAN', level: 0, is_sum: false, is_bold: true },
  { keterangan: 'Jumlah Penerimaan Dana Pemerintah', level: 1, is_sum: true, is_bold: true },
  { keterangan: 'Penerimaan Gaji dan Tunjangan PNS', level: 2, is_sum: false, is_bold: false },
  { keterangan: 'Bantuan Pendanaan PTN Badan Hukum', level: 2, is_sum: false, is_bold: false },
  { keterangan: 'Penerimaan Pemerintah lainnya', level: 2, is_sum: true, is_bold: true },
  { keterangan: 'Penelitian', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Beasiswa dan Kontrak Kerjasama Pemerintah', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'HIBAH GDG LOAN JICA', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Penerimaan DAPT', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Insentif Capaian IKU', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'HIBAH SCIENCE TECHNO PARK -ADB', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'HIBAH PUAPT', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'EQUITY', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Pendamping Program Revitalisasi PTN 2024', level: 3, is_sum: false, is_bold: false },
  
  { keterangan: 'Jumlah Penerimaan Dana Masyarakat', level: 1, is_sum: true, is_bold: true },
  { keterangan: 'Penerimaan Pendidikan', level: 2, is_sum: true, is_bold: true },
  { keterangan: 'Penerimaan Pendidikan Utama', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Penerimaan Pendidikan Lainnya', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Penerimaan Non Pendidikan', level: 2, is_sum: true, is_bold: true },
  { keterangan: 'Penerimaan Hibah dan Donasi', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Penerimaan Jasa Universitas', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Penerimaan Pemanfaatan Aset', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Penerimaan Kerjasama', level: 3, is_sum: false, is_bold: false },
  { keterangan: 'Penerimaan dari UPU', level: 3, is_sum: false, is_bold: false },
  
  { keterangan: 'JUMLAH PENERIMAAN', level: 0, is_sum: true, is_bold: true },
  
  { keterangan: 'PENGELUARAN', level: 0, is_sum: false, is_bold: true },
  { keterangan: 'Belanja Pegawai', level: 1, is_sum: false, is_bold: false },
  { keterangan: 'Belanja Barang & Jasa', level: 1, is_sum: false, is_bold: false },
  { keterangan: 'Belanja Perbaikan dan Pemeliharaan', level: 1, is_sum: false, is_bold: false },
  { keterangan: 'Belanja Perjalanan', level: 1, is_sum: false, is_bold: false },
  { keterangan: 'Belanja Modal', level: 1, is_sum: false, is_bold: false },
  { keterangan: 'Belanja SCIENCE TECHNO PARK -ADB', level: 1, is_sum: false, is_bold: false },
  { keterangan: 'Belanja PUAPT', level: 1, is_sum: false, is_bold: false },
  { keterangan: 'Belanja Pendamping Program Revitalisasi PTN 2024', level: 1, is_sum: false, is_bold: false },
  { keterangan: 'Belanja EQUITY', level: 1, is_sum: false, is_bold: false },
  
  { keterangan: 'JUMLAH PENGELUARAN', level: 0, is_sum: true, is_bold: true },
  
  { keterangan: 'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA', level: 0, is_sum: false, is_bold: true },
  { keterangan: 'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA', level: 0, is_sum: false, is_bold: true },
  { keterangan: 'SURPLUS/(DEFISIT) ANGGARAN', level: 0, is_sum: false, is_bold: true },
  { keterangan: 'PENAMBAHAN DANA ABADI', level: 0, is_sum: false, is_bold: true },
  { keterangan: 'Belanja Tambahan SCIENCE TECHNO PARK -ADB', level: 0, is_sum: false, is_bold: true },
];

const data2023 = {
  'Penerimaan Gaji dan Tunjangan PNS': [448027397000, 418809948819],
  'Bantuan Pendanaan PTN Badan Hukum': [210262000000, 210261984238],
  'Penelitian': [45000000000, 30377666000],
  'Beasiswa dan Kontrak Kerjasama Pemerintah': [115367166462, 167723042788],
  'HIBAH GDG LOAN JICA': [0, 0],
  'Penerimaan DAPT': [34395710533, 39753200000],
  'Insentif Capaian IKU': [0, 6516000000],
  'HIBAH SCIENCE TECHNO PARK -ADB': [0, 24630115000],
  'HIBAH PUAPT': [0, 0],
  'EQUITY': [0, 0],
  'Pendamping Program Revitalisasi PTN 2024': [0, 0],
  'Penerimaan Pendidikan Utama': [1132868403812, 1142240929143],
  'Penerimaan Pendidikan Lainnya': [58035292168, 251117074446],
  'Penerimaan Hibah dan Donasi': [117252672071, 78825400902],
  'Penerimaan Jasa Universitas': [49842328203, 117060859334],
  'Penerimaan Pemanfaatan Aset': [159516942255, 31971301948],
  'Penerimaan Kerjasama': [149762876995, 423175096838],
  'Penerimaan dari UPU': [278427053515, 291365383911],
  'Belanja Pegawai': [1625235740109, 1556176765700],
  'Belanja Barang & Jasa': [943826867428, 1008335547088],
  'Belanja Perbaikan dan Pemeliharaan': [136292406618, 98015139231],
  'Belanja Perjalanan': [161017282908, 156421372665],
  'Belanja Modal': [224800558705, 316574364639],
  'Belanja SCIENCE TECHNO PARK -ADB': [0, 19774872059],
  'Belanja PUAPT': [0, 0],
  'Belanja Pendamping Program Revitalisasi PTN 2024': [0, 0],
  'Belanja EQUITY': [0, 0],
  'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA': [-292415012754, 78529941985],
  'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA': [484983484172, 484983484172],
  'SURPLUS/(DEFISIT) ANGGARAN': [192568471418, 563513426157],
  'PENAMBAHAN DANA ABADI': [100000000000, 82215672284],
  'Belanja Tambahan SCIENCE TECHNO PARK -ADB': [38607805623, 45521842000]
};

const data2024 = {
  'Penerimaan Gaji dan Tunjangan PNS': [461630800000, 467809800000],
  'Bantuan Pendanaan PTN Badan Hukum': [194975250000, 194975234238],
  'Penelitian': [45000000000, 38488953341],
  'Beasiswa dan Kontrak Kerjasama Pemerintah': [167809278335, 0],
  'HIBAH GDG LOAN JICA': [0, 0],
  'Penerimaan DAPT': [45938300000, 9938300000],
  'Insentif Capaian IKU': [15500000000, 6336000000],
  'HIBAH SCIENCE TECHNO PARK -ADB': [84678556165, 10743147470],
  'HIBAH PUAPT': [190000000000, 171371658000],
  'EQUITY': [0, 0],
  'Pendamping Program Revitalisasi PTN 2024': [1500000000, 1500000000],
  'Penerimaan Pendidikan Utama': [1335596311190, 1421236751018],
  'Penerimaan Pendidikan Lainnya': [61005465000, 64865230188],
  'Penerimaan Hibah dan Donasi': [35592282454, 63113758243],
  'Penerimaan Jasa Universitas': [69412573574, 110016554952],
  'Penerimaan Pemanfaatan Aset': [19813062000, 12054024956],
  'Penerimaan Kerjasama': [326268476138, 489050578772],
  'Penerimaan dari UPU': [449945164189, 436975274205],
  'Belanja Pegawai': [1435388429101, 1742053759593],
  'Belanja Barang & Jasa': [1138180150009, 1192935340748],
  'Belanja Perbaikan dan Pemeliharaan': [135064103354, 106928592997],
  'Belanja Perjalanan': [200872130325, 168599768478],
  'Belanja Modal': [282430165692, 326586180789],
  'Belanja SCIENCE TECHNO PARK -ADB': [84678556165, 10108956245],
  'Belanja PUAPT': [190000000000, 152641041140],
  'Belanja Pendamping Program Revitalisasi PTN 2024': [1500000000, 0],
  'Belanja EQUITY': [0, 0],
  'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA': [36551984399, -201378374607],
  'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA': [574473623877, 574473623877],
  'SURPLUS/(DEFISIT) ANGGARAN': [611025608276, 373095249270],
  'PENAMBAHAN DANA ABADI': [50000000000, 49327539150],
  'Belanja Tambahan SCIENCE TECHNO PARK -ADB': [38619244228, 9912115849]
};

const data2025 = {
  'Penerimaan Gaji dan Tunjangan PNS': [461630800000, 478372749847],
  'Bantuan Pendanaan PTN Badan Hukum': [191047000000, 171663481335],
  'Penelitian': [47122140662, 43690548822],
  'Beasiswa dan Kontrak Kerjasama Pemerintah': [115942177000, 155169884094],
  'HIBAH GDG LOAN JICA': [0, 0],
  'Penerimaan DAPT': [41344470000, 0],
  'Insentif Capaian IKU': [6336000000, 0],
  'HIBAH SCIENCE TECHNO PARK -ADB': [42961384000, 16735531363],
  'HIBAH PUAPT': [50000000000, 0],
  'EQUITY': [0, 55639639640],
  'Pendamping Program Revitalisasi PTN 2024': [0, 0],
  'Penerimaan Pendidikan Utama': [1455147170750, 1331426684273],
  'Penerimaan Pendidikan Lainnya': [33938342000, 81594741576],
  'Penerimaan Hibah dan Donasi': [91789161170, 189621689313],
  'Penerimaan Jasa Universitas': [217769701426, 59876232916],
  'Penerimaan Pemanfaatan Aset': [26383684036, 29667870769],
  'Penerimaan Kerjasama': [324494128354, 591539147321],
  'Penerimaan dari UPU': [539208742631, 519514426193],
  'Belanja Pegawai': [1598383098685, 1789885544450],
  'Belanja Barang & Jasa': [1073641806673, 1226973353502],
  'Belanja Perbaikan dan Pemeliharaan': [106928592997, 85337188816],
  'Belanja Perjalanan': [168599768478, 128948344993],
  'Belanja Modal': [350852611194, 227169248300],
  'Belanja SCIENCE TECHNO PARK -ADB': [42961384000, 16735531363],
  'Belanja PUAPT': [50000000000, 0],
  'Belanja Pendamping Program Revitalisasi PTN 2024': [0, 0],
  'Belanja EQUITY': [0, 27950320079],
  'SURPLUS/(DEFISIT) ANGGARAN SEBELUMNYA': [253747640002, 221513095959],
  'SISA LEBIH PERHITUNGAN TAHUN SEBELUMNYA': [549475758655, 658417263963],
  'SURPLUS/(DEFISIT) ANGGARAN': [803223398657, 879930359922],
  'PENAMBAHAN DANA ABADI': [70000000000, 22451008009],
  'Belanja Tambahan SCIENCE TECHNO PARK -ADB': [0, 0]
};

const datasets = [
  { tahun: 2023, data: data2023 },
  { tahun: 2024, data: data2024 },
  { tahun: 2025, data: data2025 }
];

async function run() {
  console.log("Menghapus data lama di app_laporan_statis...");
  await supabase.from('app_laporan_statis').delete().neq('id', 0);

  for (const ds of datasets) {
    console.log(`Mengisi data untuk tahun ${ds.tahun}...`);
    let levelIds = {}; 
    let urutan = 1;

    for (const item of treeStructure) {
      let anggaran = 0;
      let realisasi = 0;
      
      if (ds.data[item.keterangan]) {
        anggaran = ds.data[item.keterangan][0];
        realisasi = ds.data[item.keterangan][1];
      }

      let parent_id = null;
      if (item.level > 0) {
         parent_id = levelIds[item.level - 1]; 
      }

      const { data, error } = await supabase.from('app_laporan_statis').insert([{
        tahun: ds.tahun,
        keterangan: item.keterangan,
        urutan: urutan++,
        level: item.level,
        is_sum: item.is_sum,
        is_bold: item.is_bold,
        anggaran: anggaran,
        realisasi: realisasi,
        parent_id: parent_id
      }]).select('id').single();

      if (error) {
        console.error("Error inserting", item.keterangan, error);
      } else {
        levelIds[item.level] = data.id; 
      }
    }
  }
  console.log("Selesai import data!");
}

run();
