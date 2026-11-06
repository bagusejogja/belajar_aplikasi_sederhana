const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Sistem Manajemen Kinerja & Anggaran';
  wb.created = new Date();
  
  // Wajib untuk Excel O365 agar otomatis menghitung semua formula saat file dibuka:
  wb.calcProperties.fullCalcOnLoad = true;

  // -------------------------------------------------------------
  // 1. DATA MASTER ANGGARAN (Sample Data)
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

  // Helper untuk menghitung nilai pasti di baris JS agar cell result langsung terisi
  const calcSumForFilters = (year, filters) => {
    let sum = 0;
    filters.filter(Boolean).forEach(f => {
      rawAnggaranData.forEach(d => {
        if (d.tahun === year && d.indikatorProgram.trim() === f.trim()) {
          sum += d.anggaran;
        }
      });
    });
    return sum / 1000000;
  };

  // -------------------------------------------------------------
  // SHEET 1: "utuh"
  // -------------------------------------------------------------
  const wsUtuh = wb.addWorksheet('utuh', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 3 }]
  });

  // Setup Kolom A sampai Z (Menyediakan 10 Slot Filter: Q, R, S, T, U, V, W, X, Y, Z!)
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
    { key: 'a_2023', width: 22 },      // K (Alokasi 2023)
    { key: 'a_2024', width: 22 },      // L (Alokasi 2024)
    { key: 'a_2025', width: 22 },      // M (Alokasi 2025)
    { key: 'a_2026', width: 22 },      // N (Alokasi 2026)
    { key: 'a_2027', width: 22 },      // O (Alokasi 2027)
    { key: 'unit', width: 35 },        // P
    { key: 'filter_q', width: 55 },    // Q (Filter 1)
    { key: 'filter_r', width: 45 },    // R (Filter 2)
    { key: 'filter_s', width: 45 },    // S (Filter 3)
    { key: 'filter_t', width: 45 },    // T (Filter 4)
    { key: 'filter_u', width: 45 },    // U (Filter 5)
    { key: 'filter_v', width: 45 },    // V (Filter 6)
    { key: 'filter_w', width: 45 },    // W (Filter 7)
    { key: 'filter_x', width: 45 },    // X (Filter 8)
    { key: 'filter_y', width: 45 },    // Y (Filter 9)
    { key: 'filter_z', width: 45 }     // Z (Filter 10)
  ];

  // Header Baris 1-3
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
  wsUtuh.getCell('K2').value = 'Dihitung otomatis per tahun berdasarkan IndikatorProgram (Range s.d. 1.200 baris)';
  wsUtuh.getCell('K3').value = 2023;
  wsUtuh.getCell('L3').value = 2024;
  wsUtuh.getCell('M3').value = 2025;
  wsUtuh.getCell('N3').value = 2026;
  wsUtuh.getCell('O3').value = 2027;

  wsUtuh.mergeCells('P1:P3');
  wsUtuh.getCell('P1').value = 'Unit Organisasi Pelaksana';

  wsUtuh.mergeCells('Q1:Q2');
  wsUtuh.getCell('Q1').value = 'Filter 1 (Utama)';
  wsUtuh.getCell('Q3').value = 'Pilihan 1';

  for (let c = 18; c <= 26; c++) {
    const colLetter = String.fromCharCode(64 + c);
    const filterNum = c - 16;
    wsUtuh.mergeCells(`${colLetter}1:${colLetter}2`);
    wsUtuh.getCell(`${colLetter}1`).value = `+ Filter ${filterNum}`;
    wsUtuh.getCell(`${colLetter}3`).value = `Pilihan ${filterNum}`;
  }

  // Header Styling
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

  // Baris 4: Data User dengan 4 Filter (Lebih dari 3)
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

  const row4Filters = [
    '1.1.2.1.4.1 Terselenggaranya perkuliahan',
    '1.1.2.1.13.1 Terselenggaranya pendidikan tinggi lintas institusi',
    '1.1.2.1.2.1 Terselenggaranya operasional program studi dan kurikulum',
    '1.1.2.1.7.1 Terselenggaranya ujian dan yudisium'
  ];

  row4Filters.forEach((fVal, idx) => {
    row4.getCell(17 + idx).value = fVal;
  });

  // Baris 5-7: Data contoh lainnya
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
  // FORMULA KOLOM K - O (Mencakup sampai baris 1.500 sheet anggaran!)
  // Menggunakan SUM + FILTER + ISNUMBER(MATCH(...)) yang 100% kompatibel dan super ringan:
  // -------------------------------------------------------------
  const years = [2023, 2024, 2025, 2026, 2027];

  for (let r = 4; r <= 25; r++) {
    const row = wsUtuh.getRow(r);
    row.height = 28;

    // Ambil list filter yang terisi pada baris ini untuk menghitung result pre-cached
    const rowFilterValues = [];
    for (let c = 17; c <= 26; c++) {
      const v = row.getCell(c).value;
      if (v && typeof v === 'string') rowFilterValues.push(v);
    }

    years.forEach((yr, yrIdx) => {
      const colNum = 11 + yrIdx;
      const colLetter = String.fromCharCode(64 + colNum);
      const preCalcResult = calcSumForFilters(yr, rowFilterValues);

      // Formula mencakup anggaran hingga baris 1.500:
      const o365Formula = `IF(COUNTA($Q${r}:$Z${r})=0, 0, SUM(FILTER(anggaran!$L$2:$L$1500, (anggaran!$A$2:$A$1500=${colLetter}$3) * ISNUMBER(MATCH(anggaran!$F$2:$F$1500, $Q${r}:$Z${r}, 0)), 0)) / 1000000)`;

      row.getCell(colNum).value = {
        formula: o365Formula,
        result: preCalcResult
      };
    });

    // Styling baris data
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

    // Dropdown validasi data untuk SEMUA kolom filter (Q sampai Z)
    const validationRule = {
      type: 'list',
      allowBlank: true,
      formulae: ['Daftar_Pilihan!$D$2:$D$1500'],
      showErrorMessage: true,
      errorTitle: 'Pilihan Tidak Valid',
      error: 'Silakan pilih Indikator Program dari daftar dropdown yang tersedia.'
    };

    for (let c = 17; c <= 26; c++) {
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
  // SHEET 2: "anggaran" (Kapasitas hingga 1.500 baris)
  // -------------------------------------------------------------
  const wsAnggaran = wb.addWorksheet('anggaran', {
    views: [{ showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 1 }]
  });

  wsAnggaran.columns = [
    { header: 'Tahun_Anggaran', key: 'tahun', width: 16 },                 // A
    { header: 'Tujuan', key: 'tujuan', width: 35 },                         // B
    { header: 'Sasaran', key: 'sasaran', width: 40 },                       // C
    { header: 'IndikatorSasaran', key: 'indikatorSasaran', width: 45 },     // D
    { header: 'Program', key: 'program', width: 40 },                       // E
    { header: 'IndikatorProgram', key: 'indikatorProgram', width: 60 },     // F
    { header: 'target', key: 'target', width: 12 },                         // G
    { header: 'cascading_kinerja_target_satuan', key: 'satuan', width: 16 },// H
    { header: 'Kelompok_Indikator_Program', key: 'kelompok', width: 25 },   // I
    { header: 'sumberdanaNama', key: 'sumberdana', width: 30 },             // J
    { header: 'Prioritas', key: 'prioritas', width: 14 },                   // K
    { header: 'Anggaran', key: 'anggaran', width: 22 }                      // L
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
  // SHEET 3: "Daftar_Pilihan" (Dinamis hingga 1.500 baris)
  // -------------------------------------------------------------
  const wsDaftar = wb.addWorksheet('Daftar_Pilihan', {
    views: [{ showGridLines: true }]
  });

  wsDaftar.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Master IndikatorProgram (Dinamis dari Sheet Anggaran)', key: 'master', width: 65 },
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

  // Tulis formula dinamis untuk 1.500 baris di sheet Daftar_Pilihan:
  // Kolom B: Mengambil nama indikator dari sheet anggaran (jika baris terisi)
  // Kolom C: Mengecek apakah sudah dipilih di utuh!$Q$4:$Z$100
  // Kolom D: Hanya menampilkan nama jika BELUM dipilih (untuk dropdown)
  const uniqueIndikator = Array.from(new Set(rawAnggaranData.map(d => d.indikatorProgram)));

  for (let i = 1; i <= 1500; i++) {
    const rowIdx = i + 1;
    const row = wsDaftar.getRow(rowIdx);
    row.height = 20;

    row.getCell(1).value = i;

    // Jika di sample ada datanya, masukkan nilai default; jika tidak, ambil dari anggaran!F{rowIdx}
    if (i <= uniqueIndikator.length) {
      row.getCell(2).value = uniqueIndikator[i - 1];
    } else {
      row.getCell(2).value = { formula: `IF(anggaran!F${rowIdx}="","", anggaran!F${rowIdx})` };
    }

    // Status: Cek ke range utuh $Q$4:$Z$100
    row.getCell(3).value = {
      formula: `IF(B${rowIdx}="","", IF(COUNTIF(utuh!$Q$4:$Z$100, B${rowIdx})>0, "❌ SUDAH DIPILIH", "✅ TERSEDIA"))`
    };

    // Tersedia (untuk Dropdown):
    row.getCell(4).value = {
      formula: `IF(B${rowIdx}="","", IF(COUNTIF(utuh!$Q$4:$Z$100, B${rowIdx})=0, B${rowIdx}, ""))`
    };

    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(3).font = { bold: true };
  }

  // -------------------------------------------------------------
  // SHEET 4: "Panduan_Penggunaan"
  // -------------------------------------------------------------
  const wsInfo = wb.addWorksheet('Panduan_Penggunaan');
  wsInfo.columns = [
    { width: 5 },
    { width: 35 },
    { width: 80 }
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

  addInfoRow(2, 'PANDUAN LENGKAP TEMPLATE KINERJA & ANGGARAN (O365)', 'SKALABILITAS HINGGA 1.500 BARIS & MULTI-FILTER DINAMIS', true);
  addInfoRow(4, '1. Kapasitas Data Anggaran', 'Rumus di sheet "utuh" dan daftar filter di sheet "Daftar_Pilihan" telah diprogram untuk membaca hingga 1.500 baris data pada sheet "anggaran". Anda dapat langsung copy-paste hingga 1.200 baris data anggaran Anda.');
  addInfoRow(5, '2. Filter Hingga 10 Pilihan', 'Tersedia kolom Q hingga Z (10 kolom filter pilihan). Berapa pun indikator yang Anda pilih (1, 2, 4, 7, atau 10), rumus otomatis menjumlahkannya tanpa perlu mengubah rumus!');
  addInfoRow(6, '3. Nilai Langsung Tampil di Kolom K-O', 'File ini telah dilengkapi pre-calculated values dan flag fullCalcOnLoad, sehingga saat dibuka di Excel, angka langsung tampil (contoh baris 4 alokasi tahun 2024 langsung terisi 281.200,86 juta rupiah).');
  addInfoRow(7, '4. Rumus O365 yang Digunakan', '=IF(COUNTA($Q4:$Z4)=0, 0, SUM(FILTER(anggaran!$L$2:$L$1500, (anggaran!$A$2:$A$1500=K$3) * ISNUMBER(MATCH(anggaran!$F$2:$F$1500, $Q4:$Z4, 0)), 0)) / 1000000)');
  addInfoRow(8, '5. Pencegahan Duplikasi (Non-Repeat)', 'Setiap indikator yang telah dipilih di kolom Q s.d. Z otomatis ditandai "❌ SUDAH DIPILIH" dan tidak akan muncul kembali di daftar pilihan dropdown berikutnya.');

  // Simpan file baru
  const outputFileName = 'Template_Rencana_Kinerja_dan_Anggaran_1200Baris.xlsx';
  const outputPath = path.join(__dirname, '..', outputFileName);
  const publicPath = path.join(__dirname, '..', 'public', outputFileName);

  await wb.xlsx.writeFile(outputPath);
  console.log('1200-Row O365 Workbook generated successfully at:', outputPath);

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

