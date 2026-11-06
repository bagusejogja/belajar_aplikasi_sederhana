const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistem Manajemen Kinerja & Anggaran';
  wb.created = new Date();

  // -------------------------------------------------------------
  // 1. DATA MASTER ANGGARAN
  // -------------------------------------------------------------
  const rawAnggaranData = [
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.1 Layanan akreditasi, sertifkasi dan perankingan",
      indikatorProgram: "1.1.2.1.1.1 Terselenggaranya akreditasi, sertifikasi, dan perankingan",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 5049298295
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.2 Layanan pengembangan program studi dan kurikulum",
      indikatorProgram: "1.1.2.1.2.1 Terselenggaranya operasional program studi dan kurikulum",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 29560400021
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.3 Layanan penjaminan mutu akademik",
      indikatorProgram: "1.1.2.1.3.1 Terselenggaranya penjaminan mutu",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 7619132900
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.4 Layanan perkuliahan",
      indikatorProgram: "1.1.2.1.4.1 Terselenggaranya perkuliahan",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 143347458499
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.5 Layanan perpustakaan",
      indikatorProgram: "1.1.2.1.5.1 Terselenggaranya layanan perpustakaan",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 7650213972
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.6 Layanan persiapan pembelajaran program studi",
      indikatorProgram: "1.1.2.1.6.1 Terselenggaranya persiapan pembelajaran oleh program studi",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 5240818814
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.7 Layanan ujian dan yudisium",
      indikatorProgram: "1.1.2.1.7.1 Terselenggaranya ujian dan yudisium",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 24984196882
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.8 Layanan upacara dan event akademik",
      indikatorProgram: "1.1.2.1.8.1 Terselenggaranya upacara dan event akademik",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 21000534351
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.9 Layanan monitor dan evaluasi pembelajaran",
      indikatorProgram: "1.1.2.1.9.1 Terselenggaranya monitor dan evaluasi pembelajaran",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 1653265859
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.10 Layanan museum dan pusat kebudayaan",
      indikatorProgram: "1.1.2.1.10.1 Terselenggaranya operasional museum dan pusat kebudayaan",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 187910000
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.11 Layanan pembelajaran jarak jauh",
      indikatorProgram: "1.1.2.1.11.1 Terselenggaranya pembelajaran jarak jauh",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 40000000
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.12 Layanan pembimbingan skripsi, tesis, disertasi, atau tugas akhir",
      indikatorProgram: "1.1.2.1.12.1 Terselenggaranya pembimbingan skripsi, tesis, disertasi, atau tugas akhir",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 36085032900
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.13 Layanan pendidikan lintas institusi",
      indikatorProgram: "1.1.2.1.13.1 Terselenggaranya pendidikan tinggi lintas institusi",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 83308808313
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.14 Layanan pendukung pendidikan",
      indikatorProgram: "1.1.2.1.14.1 Terselenggaranya pendukung pendidikan",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 11953633831
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.15 Layanan penerimaan mahasiswa baru",
      indikatorProgram: "1.1.2.1.15.1 Terselenggaranya penerimaan mahasiswa baru",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 17771426363
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran",
      indikatorSasaran: "1.1.2.1 Penyelenggaran operasional bidang pendidikan dan pengajaran yang unggul dan berkelanjutan",
      program: "1.1.2.1.16 Layanan Pengelolaan Ranking Bereputasi",
      indikatorProgram: "1.1.2.1.16.1 Terselenggaranya proses pengusulan partisipasi ranking bereputasi",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 416677625
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.3 Peningkatan kualitas keberlanjutan operasional bidang rumah sakit dan klinik universitas",
      indikatorSasaran: "1.1.3.1 Penyelenggaran operasional bidang urusan rumah sakit dan klinik yang komprehensif, kuratif, preventif, dan berkelanjutan",
      program: "1.1.3.1.1 Layanan Rumah Sakit atau Klinik Universitas",
      indikatorProgram: "1.1.3.1.1.1 Terselenggaranya layanan kesehatan di rumah sakit atau klinik",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 207135361477
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.1.4 Peningkatan kualitas keberlanjutan operasional bidang tugas dan fungsi organ/perangkat",
      indikatorSasaran: "1.1.4.1 Penyelenggaran operasional bidang urusan tugas dan fungsi organ/perangkat yang sinergis dan berkelanjutan",
      program: "1.1.4.1.1 Layanan Tugas Organ/Perangkat",
      indikatorProgram: "1.1.4.1.1.1 Terselenggaranya tugas dan fungsi organ/perangkat",
      target: 12,
      satuan: "bulan",
      kelompok: "Keberlanjutan Operasional",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 3767249950
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.2.1 Meningkatnya kualitas kurikulum yang inovatif, inklusif, dan aplikatif",
      indikatorSasaran: "1.2.1.1 Persentase mahasiswa sarjana, sarjana terapan dan pascasarjana dari latar belakang yang beragam",
      program: "1.2.1.1.1 Pengembangan sistem penerimaan mahasiswa yang mengakomodir keberagaman",
      indikatorProgram: "1.2.1.1.1.2 Persentase mahasiswa sarjana dan sarjana terapan yang menerima penyaluran beasiswa dari Direktorat, Fakultas, atau Sekolah",
      target: 55,
      satuan: "persen",
      kelompok: "Rencana Strategis",
      sumberdana: "Dana Masyarakat Mengikat (Kontraktual)",
      prioritas: "Pertama",
      anggaran: 7242750000
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.2.1 Meningkatnya kualitas kurikulum yang inovatif, inklusif, dan aplikatif",
      indikatorSasaran: "1.2.1.1 Persentase mahasiswa sarjana, sarjana terapan dan pascasarjana dari latar belakang yang beragam",
      program: "1.2.1.1.1 Pengembangan sistem penerimaan mahasiswa yang mengakomodir keberagaman",
      indikatorProgram: "1.2.1.1.1.5 Jumlah mahasiswa asing semua jenjang Non Gelar",
      target: 121,
      satuan: "Mahasiswa",
      kelompok: "Rencana Strategis",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 3334589589
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.2.1 Meningkatnya kualitas kurikulum yang inovatif, inklusif, dan aplikatif",
      indikatorSasaran: "1.2.1.1 Persentase mahasiswa sarjana, sarjana terapan dan pascasarjana dari latar belakang yang beragam",
      program: "1.2.1.1.1 Pengembangan sistem penerimaan mahasiswa yang mengakomodir keberagaman",
      indikatorProgram: "1.2.1.1.1.6 Jumlah mahasiswa asing semua jenjang Gelar",
      target: 32,
      satuan: "Mahasiswa",
      kelompok: "Rencana Strategis",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 15554410577
    },
    {
      tahun: 2024,
      tujuan: "Mewujudkan pendidikan transdisiplin yang unggul, inovatif inklusif dan aplikatif",
      sasaran: "1.2.1 Meningkatnya kualitas kurikulum yang inovatif, inklusif, dan aplikatif",
      indikatorSasaran: "1.2.1.1 Persentase mahasiswa sarjana, sarjana terapan dan pascasarjana dari latar belakang yang beragam",
      program: "1.2.1.1.1 Pengembangan sistem penerimaan mahasiswa yang mengakomodir keberagaman",
      indikatorProgram: "1.2.1.1.1.9 Jumlah mahasiswa sarjana, sarjana terapan, pascasarjana yang memiliki latar belakang beragam secara ekonomi (UKT level 0-2, KIP-K dan/atau UKT PU Bersubsidi 100%), geografis (luar Jawa), dan difabel. (Tiap prodi diharapkan jumlah minimal 20% dari mahasiswa aktif)",
      target: 11958,
      satuan: "Mahasiswa",
      kelompok: "Rencana Strategis",
      sumberdana: "Dana Masyarakat Tidak Mengikat",
      prioritas: "Pertama",
      anggaran: 3338099600
    }
  ];

  // -------------------------------------------------------------
  // SHEET 1: "utuh"
  // -------------------------------------------------------------
  const wsUtuh = wb.addWorksheet('utuh', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 3 }]
  });

  // Columns A sampai W (Menyediakan 7 Kolom Filter: Q, R, S, T, U, V, W)
  wsUtuh.columns = [
    { key: 'sasaran', width: 35 },     // A
    { key: 'indikator', width: 45 },   // B
    { key: 'lokasi', width: 14 },      // C
    { key: 'satuan', width: 12 },      // D
    { key: 'base_2021', width: 15 },   // E
    { key: 't_2023', width: 12 },      // F
    { key: 't_2024', width: 12 },      // G
    { key: 't_2025', width: 12 },      // H
    { key: 't_2026', width: 12 },      // I
    { key: 't_2027', width: 12 },      // J
    { key: 'a_2023', width: 22 },      // K (O365 SUMIFS)
    { key: 'a_2024', width: 22 },      // L (O365 SUMIFS)
    { key: 'a_2025', width: 22 },      // M (O365 SUMIFS)
    { key: 'a_2026', width: 22 },      // N (O365 SUMIFS)
    { key: 'a_2027', width: 22 },      // O (O365 SUMIFS)
    { key: 'unit', width: 35 },        // P
    { key: 'filter_q', width: 55 },    // Q (Filter 1 / Utama)
    { key: 'filter_r', width: 45 },    // R (Filter 2)
    { key: 'filter_s', width: 45 },    // S (Filter 3)
    { key: 'filter_t', width: 45 },    // T (Filter 4)
    { key: 'filter_u', width: 45 },    // U (Filter 5)
    { key: 'filter_v', width: 45 },    // V (Filter 6)
    { key: 'filter_w', width: 45 }     // W (Filter 7)
  ];

  // Headers
  wsUtuh.mergeCells('A1:A3');
  wsUtuh.getCell('A1').value = 'Sasaran';

  wsUtuh.mergeCells('B1:B3');
  wsUtuh.getCell('B1').value = 'Indikator Kinerja';

  wsUtuh.mergeCells('C1:C3');
  wsUtuh.getCell('C1').value = 'Lokasi';

  wsUtuh.mergeCells('D1:D3');
  wsUtuh.getCell('D1').value = 'Satuan';

  wsUtuh.mergeCells('E1:E2');
  wsUtuh.getCell('E1').value = 'Baseline';
  wsUtuh.getCell('E3').value = 'Capaian 2021';

  wsUtuh.mergeCells('F1:J1');
  wsUtuh.getCell('F1').value = 'Target Kinerja';
  wsUtuh.getCell('F2').value = '';
  wsUtuh.getCell('F3').value = 2023;
  wsUtuh.getCell('G3').value = 2024;
  wsUtuh.getCell('H3').value = 2025;
  wsUtuh.getCell('I3').value = 2026;
  wsUtuh.getCell('J3').value = 2027;

  wsUtuh.mergeCells('K1:O1');
  wsUtuh.getCell('K1').value = 'Alokasi (dalam juta rupiah)';
  wsUtuh.getCell('K2').value = 'Otomatis dihitung via O365 SUM(SUMIFS) / FILTER dari IndikatorProgram';
  wsUtuh.getCell('K3').value = 2023;
  wsUtuh.getCell('L3').value = 2024;
  wsUtuh.getCell('M3').value = 2025;
  wsUtuh.getCell('N3').value = 2026;
  wsUtuh.getCell('O3').value = 2027;

  wsUtuh.mergeCells('P1:P3');
  wsUtuh.getCell('P1').value = 'Unit Organisasi Pelaksana';

  wsUtuh.mergeCells('Q1:Q2');
  wsUtuh.getCell('Q1').value = 'Filter 1 (Utama)';
  wsUtuh.getCell('Q3').value = 'Pilihan 1 (Dropdown)';

  wsUtuh.mergeCells('R1:R2');
  wsUtuh.getCell('R1').value = '+ Filter 2';
  wsUtuh.getCell('R3').value = 'Pilihan 2 (Dropdown)';

  wsUtuh.mergeCells('S1:S2');
  wsUtuh.getCell('S1').value = '+ Filter 3';
  wsUtuh.getCell('S3').value = 'Pilihan 3 (Dropdown)';

  wsUtuh.mergeCells('T1:T2');
  wsUtuh.getCell('T1').value = '+ Filter 4';
  wsUtuh.getCell('T3').value = 'Pilihan 4 (Dropdown)';

  wsUtuh.mergeCells('U1:U2');
  wsUtuh.getCell('U1').value = '+ Filter 5';
  wsUtuh.getCell('U3').value = 'Pilihan 5 (Dropdown)';

  wsUtuh.mergeCells('V1:V2');
  wsUtuh.getCell('V1').value = '+ Filter 6';
  wsUtuh.getCell('V3').value = 'Pilihan 6 (Dropdown)';

  wsUtuh.mergeCells('W1:W2');
  wsUtuh.getCell('W1').value = '+ Filter 7';
  wsUtuh.getCell('W3').value = 'Pilihan 7 (Dropdown)';

  // Style Header
  const headerFillIndigo = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
  const headerFillTeal = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
  const headerFillAmber = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } };
  const headerSubFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };

  for (let r = 1; r <= 3; r++) {
    const row = wsUtuh.getRow(r);
    row.height = r === 1 ? 26 : r === 2 ? 18 : 24;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: r === 1 ? 10 : 9 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };

      if (colNumber >= 11 && colNumber <= 15) {
        cell.fill = headerFillTeal;
      } else if (colNumber >= 17) {
        cell.fill = headerFillAmber;
      } else if (r === 3) {
        cell.fill = headerSubFill;
      } else {
        cell.fill = headerFillIndigo;
      }
    });
  }

  // Row 4: Contoh dari user dengan 4 Filter (Lebih dari 3!)
  const row4 = wsUtuh.getRow(4);
  row4.getCell(1).value = 'Meningkatnya kualitas kurikulum yang inovatif, inklusif, dan aplikatif.';
  row4.getCell(2).value = 'Persentase program studi sarjana dan sarjana terapan yang melaksanakan kerja sama dengan mitra';
  row4.getCell(3).value = '';
  row4.getCell(4).value = 'Persen';
  row4.getCell(5).value = 65.79;
  row4.getCell(6).value = 73;
  row4.getCell(7).value = 79;
  row4.getCell(8).value = 86;
  row4.getCell(9).value = 93;
  row4.getCell(10).value = 100;
  row4.getCell(16).value = 'Direktorat Kemitraan dan Relasi Global';

  // Contoh: 4 Indikator dipilih (otomatis dihitung sekaligus)
  row4.getCell(17).value = '1.1.2.1.4.1 Terselenggaranya perkuliahan';
  row4.getCell(18).value = '1.1.2.1.13.1 Terselenggaranya pendidikan tinggi lintas institusi';
  row4.getCell(19).value = '1.1.2.1.2.1 Terselenggaranya operasional program studi dan kurikulum';
  row4.getCell(20).value = '1.1.2.1.7.1 Terselenggaranya ujian dan yudisium';

  // Baris 5-8: Data contoh lainnya
  const sampleRows = [
    {
      sasaran: '1.1.2 Peningkatan kualitas keberlanjutan operasional bidang pendidikan dan pengajaran',
      indikator: 'Indikator Kinerja Layanan Akreditasi, Sertifikasi dan Penjaminan Mutu',
      lokasi: 'Yogyakarta',
      satuan: 'Dokumen',
      base: 80,
      t23: 85, t24: 90, t25: 95, t26: 98, t27: 100,
      unit: 'Direktorat Pendidikan dan Pengajaran',
      filters: [
        '1.1.2.1.1.1 Terselenggaranya akreditasi, sertifikasi, dan perankingan',
        '1.1.2.1.3.1 Terselenggaranya penjaminan mutu',
        '1.1.2.1.16.1 Terselenggaranya proses pengusulan partisipasi ranking bereputasi',
        '1.1.2.1.9.1 Terselenggaranya monitor dan evaluasi pembelajaran'
      ]
    },
    {
      sasaran: '1.1.3 Peningkatan operasional bidang RS & Klinik',
      indikator: 'Layanan komprehensif RS Akademik',
      lokasi: 'Sleman',
      satuan: 'Pasien',
      base: 90,
      t23: 92, t24: 94, t25: 96, t26: 98, t27: 100,
      unit: 'Rumah Sakit Akademik UGM',
      filters: [
        '1.1.3.1.1.1 Terselenggaranya layanan kesehatan di rumah sakit atau klinik'
      ]
    }
  ];

  sampleRows.forEach((s, idx) => {
    const rIdx = 5 + idx;
    const r = wsUtuh.getRow(rIdx);
    r.getCell(1).value = s.sasaran;
    r.getCell(2).value = s.indikator;
    r.getCell(3).value = s.lokasi;
    r.getCell(4).value = s.satuan;
    r.getCell(5).value = s.base;
    r.getCell(6).value = s.t23;
    r.getCell(7).value = s.t24;
    r.getCell(8).value = s.t25;
    r.getCell(9).value = s.t26;
    r.getCell(10).value = s.t27;
    r.getCell(16).value = s.unit;
    s.filters.forEach((fVal, fIdx) => {
      r.getCell(17 + fIdx).value = fVal;
    });
  });

  // -------------------------------------------------------------
  // FORMULA RINGAN OFFICE 365:
  // Menggunakan SUM(SUMIFS(...)) dengan range filter dinamis Q4:W4!
  // Jauh lebih ringan, cepat, dan otomatis menangani berapapun filter yang diisi!
  // -------------------------------------------------------------
  for (let r = 4; r <= 25; r++) {
    const row = wsUtuh.getRow(r);
    row.height = 28;

    // Formula Kolom K (2023):
    row.getCell(11).value = {
      formula: `IF(COUNTA($Q${r}:$W${r})=0, 0, SUM(SUMIFS(anggaran!$L:$L, anggaran!$A:$A, K$3, anggaran!$F:$F, FILTER($Q${r}:$W${r}, $Q${r}:$W${r}<>"")))/1000000)`
    };

    // Formula Kolom L (2024):
    row.getCell(12).value = {
      formula: `IF(COUNTA($Q${r}:$W${r})=0, 0, SUM(SUMIFS(anggaran!$L:$L, anggaran!$A:$A, L$3, anggaran!$F:$F, FILTER($Q${r}:$W${r}, $Q${r}:$W${r}<>"")))/1000000)`
    };

    // Formula Kolom M (2025):
    row.getCell(13).value = {
      formula: `IF(COUNTA($Q${r}:$W${r})=0, 0, SUM(SUMIFS(anggaran!$L:$L, anggaran!$A:$A, M$3, anggaran!$F:$F, FILTER($Q${r}:$W${r}, $Q${r}:$W${r}<>"")))/1000000)`
    };

    // Formula Kolom N (2026):
    row.getCell(14).value = {
      formula: `IF(COUNTA($Q${r}:$W${r})=0, 0, SUM(SUMIFS(anggaran!$L:$L, anggaran!$A:$A, N$3, anggaran!$F:$F, FILTER($Q${r}:$W${r}, $Q${r}:$W${r}<>"")))/1000000)`
    };

    // Formula Kolom O (2027):
    row.getCell(15).value = {
      formula: `IF(COUNTA($Q${r}:$W${r})=0, 0, SUM(SUMIFS(anggaran!$L:$L, anggaran!$A:$A, O$3, anggaran!$F:$F, FILTER($Q${r}:$W${r}, $Q${r}:$W${r}<>"")))/1000000)`
    };

    // Styling
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      if (colNumber === 3 || colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber >= 5 && colNumber <= 10) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0.00';
      } else if (colNumber >= 11 && colNumber <= 15) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0.00';
        cell.font = { bold: true, color: { argb: 'FF065F46' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: r % 2 === 0 ? 'FFF0FDF4' : 'FFFFFFFF' }
        };
      } else if (colNumber >= 17) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.font = { size: 9, color: { argb: 'FF1F2937' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFBEB' }
        };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });

    // Validasi Data Dropdown untuk setiap Kolom Filter (Q sampai W)
    const validationRule = {
      type: 'list',
      allowBlank: true,
      formulae: ['Daftar_Pilihan!$D$3:$D$25'],
      showErrorMessage: true,
      errorTitle: 'Pilihan Tidak Valid',
      error: 'Silakan pilih Indikator Program dari daftar dropdown yang tersedia.'
    };

    for (let c = 17; c <= 23; c++) {
      row.getCell(c).dataValidation = validationRule;
    }
  }

  // Baris Total di baris 26
  const totalRow = wsUtuh.getRow(26);
  totalRow.height = 26;
  totalRow.getCell(1).value = 'TOTAL ALOKASI (JUTA RUPIAH)';
  wsUtuh.mergeCells('A26:J26');
  totalRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  totalRow.getCell(1).fill = headerFillIndigo;

  for (let c = 11; c <= 15; c++) {
    const colLetter = String.fromCharCode(64 + c);
    totalRow.getCell(c).value = { formula: `SUM(${colLetter}4:${colLetter}25)` };
    totalRow.getCell(c).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    totalRow.getCell(c).alignment = { vertical: 'middle', horizontal: 'right' };
    totalRow.getCell(c).numFmt = '#,##0.00';
    totalRow.getCell(c).fill = headerFillTeal;
    totalRow.getCell(c).border = {
      top: { style: 'medium', color: { argb: 'FF111827' } },
      bottom: { style: 'double', color: { argb: 'FF111827' } }
    };
  }

  // -------------------------------------------------------------
  // SHEET 2: "anggaran"
  // -------------------------------------------------------------
  const wsAnggaran = wb.addWorksheet('anggaran', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  wsAnggaran.columns = [
    { header: 'Tahun_Anggaran', key: 'tahun', width: 16 },
    { header: 'Tujuan', key: 'tujuan', width: 35 },
    { header: 'Sasaran', key: 'sasaran', width: 40 },
    { header: 'IndikatorSasaran', key: 'indikatorSasaran', width: 45 },
    { header: 'Program', key: 'program', width: 40 },
    { header: 'IndikatorProgram', key: 'indikatorProgram', width: 60 },
    { header: 'target', key: 'target', width: 12 },
    { header: 'cascading_kinerja_target_satuan', key: 'satuan', width: 16 },
    { header: 'Kelompok_Indikator_Program', key: 'kelompok', width: 25 },
    { header: 'sumberdanaNama', key: 'sumberdana', width: 30 },
    { header: 'Prioritas', key: 'prioritas', width: 14 },
    { header: 'Anggaran', key: 'anggaran', width: 22 }
  ];

  const angHeaderRow = wsAnggaran.getRow(1);
  angHeaderRow.height = 28;
  angHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = headerFillIndigo;
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1F2937' } },
      bottom: { style: 'medium', color: { argb: 'FF1F2937' } }
    };
  });

  rawAnggaranData.forEach((item) => {
    const row = wsAnggaran.addRow({
      tahun: item.tahun,
      tujuan: item.tujuan,
      sasaran: item.sasaran,
      indikatorSasaran: item.indikatorSasaran,
      program: item.program,
      indikatorProgram: item.indikatorProgram,
      target: item.target,
      satuan: item.satuan,
      kelompok: item.kelompok,
      sumberdana: item.sumberdana,
      prioritas: item.prioritas,
      anggaran: item.anggaran
    });
    row.height = 22;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      if (colNumber === 1 || colNumber === 7 || colNumber === 8 || colNumber === 11) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 12) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0';
        cell.font = { bold: true, color: { argb: 'FF065F46' } };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });
  });

  // -------------------------------------------------------------
  // SHEET 3: "Daftar_Pilihan" (Dynamic Non-Repeat Engine)
  // -------------------------------------------------------------
  const wsDaftar = wb.addWorksheet('Daftar_Pilihan', {
    views: [{ showGridLines: true }]
  });

  wsDaftar.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Master IndikatorProgram (Sheet Anggaran)', key: 'master', width: 65 },
    { header: 'Status Pemilihan di Sheet "utuh"', key: 'status', width: 35 },
    { header: 'Daftar Pilihan Tersedia (Exclude yg Sudah Dipilih)', key: 'tersedia', width: 65 }
  ];

  const daftarHeader = wsDaftar.getRow(1);
  daftarHeader.height = 26;
  daftarHeader.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = colNumber === 4 ? headerFillTeal : headerFillIndigo;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const uniqueIndikator = Array.from(new Set(rawAnggaranData.map(d => d.indikatorProgram)));

  uniqueIndikator.forEach((ind, i) => {
    const rowIdx = i + 2;
    const row = wsDaftar.getRow(rowIdx);
    row.height = 20;

    row.getCell(1).value = i + 1;
    row.getCell(2).value = ind;

    // Cek di seluruh area filter Q sampai W di sheet utuh
    row.getCell(3).value = {
      formula: `IF(COUNTIF(utuh!$Q$4:$W$25, B${rowIdx})>0, "❌ SUDAH DIPILIH", "✅ TERSEDIA")`
    };

    // Filter dinamis: jika belum dipilih, tampilkan di list dropdown
    row.getCell(4).value = {
      formula: `IF(COUNTIF(utuh!$Q$4:$W$25, B${rowIdx})=0, B${rowIdx}, "")`
    };

    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).font = { bold: true };
  });

  // -------------------------------------------------------------
  // SHEET 4: "Panduan_Penggunaan"
  // -------------------------------------------------------------
  const wsInfo = wb.addWorksheet('Panduan_Penggunaan');
  wsInfo.columns = [
    { width: 5 },
    { width: 35 },
    { width: 75 }
  ];

  const addInfoRow = (rIdx, label, desc, isHeader = false) => {
    const row = wsInfo.getRow(rIdx);
    row.getCell(2).value = label;
    row.getCell(3).value = desc;
    if (isHeader) {
      row.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF1E1B4B' } };
      row.getCell(3).font = { bold: true, size: 12, color: { argb: 'FF1E1B4B' } };
    } else {
      row.getCell(2).font = { bold: true, size: 10 };
      row.getCell(3).font = { size: 10 };
      row.getCell(3).alignment = { wrapText: true };
    }
  };

  addInfoRow(2, 'PANDUAN FORMULA RINGAN OFFICE 365', 'EFISIENSI & FLEKSIBILITAS FILTER LEBIH DARI 3', true);
  addInfoRow(4, '1. Keunggulan Rumus O365', 'Di Office 365, SUMPRODUCT tidak lagi diperlukan karena berat. File ini kini menggunakan kombinasi SUM + SUMIFS + FILTER dinamis yang berjalan instan (multi-threaded C++ engine).');
  addInfoRow(5, '2. Bentuk Rumus O365 di Kolom K-O', '=IF(COUNTA($Q4:$W4)=0, 0, SUM(SUMIFS(anggaran!$L:$L, anggaran!$A:$A, K$3, anggaran!$F:$F, FILTER($Q4:$W4, $Q4:$W4<>"")))/1000000)');
  addInfoRow(6, '3. Jika Filter Lebih dari 3 Pilihan', 'Tersedia kolom Q hingga W (7 slot pilihan). Rumus secara otomatis menghitung berapa pun filter yang Anda isi (1, 2, 4, 7 pilihan) tanpa perlu mengubah rumus!');
  addInfoRow(7, '4. Menambah Slot Kolom Filter', 'Jika ingin lebih dari 7 pilihan (misal 10 atau 15), cukup sisipkan kolom sebelum P/Q atau ubah range $Q4:$W4 menjadi $Q4:$Z4.');
  addInfoRow(8, '5. Alternatif 1 Sel Multi-Koma', 'Jika ingin seluruh pilihan dalam 1 sel dipisah koma (misal di Q4 saja), O365 mendukung: =SUM(SUMIFS(anggaran!$L:$L, anggaran!$A:$A, K$3, anggaran!$F:$F, TRIM(TEXTSPLIT($Q4, ","))))/1000000');

  // Simpan file
  const outputFileName = 'Template_Rencana_Kinerja_dan_Anggaran_O365.xlsx';
  const outputPath = path.join(__dirname, '..', outputFileName);
  const publicPath = path.join(__dirname, '..', 'public', outputFileName);

  await wb.xlsx.writeFile(outputPath);
  console.log('O365 Workbook generated successfully at:', outputPath);

  try {
    fs.copyFileSync(outputPath, publicPath);
    console.log('Copied to public directory at:', publicPath);
  } catch (copyErr) {
    console.warn('Could not copy to public:', copyErr.message);
  }
}

createWorkbook().catch(err => {
  console.error('Error generating workbook:', err);
  process.exit(1);
});
