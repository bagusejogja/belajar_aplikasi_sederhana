const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType
} = require('docx');

function createCell(text, isHeader = false, widthPercent = 20, isBold = false) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: isHeader
      ? { fill: '1E3A8A', type: ShadingType.CLEAR } // Dark Navy
      : undefined,
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    children: [
      new Paragraph({
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text: text,
            bold: isHeader || isBold,
            color: isHeader ? 'FFFFFF' : '1F2937',
            size: isHeader ? 20 : 19, // 10pt / 9.5pt
            font: 'Calibri'
          })
        ]
      })
    ]
  });
}

function buildDocument() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '1F2937'
          },
          paragraph: {
            spacing: { line: 276, after: 120 }
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } // 1 inch
          }
        },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: 'PANDUAN BISNIS PROSES & LOGIKA PEMETAAN (MAPPING)',
                bold: true,
                size: 32, // 16pt
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Data RKA Mentah ➔ Rule Engine (Klasifikasi) ➔ Laporan Proposal RKAT & RKA Kementerian',
                bold: true,
                size: 24, // 12pt
                color: '4B5563'
              })
            ]
          }),

          // Horizontal rule / separator
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Sistem Informasi Perencanaan & Verifikasi Anggaran RKAT',
                italics: true,
                size: 18,
                color: '6B7280'
              })
            ]
          }),

          // SECTION 1: PENDAHULUAN
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: '1. Gambaran Umum & Arsitektur Alur Data',
                bold: true,
                size: 26,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Sistem pelaporan RKA mengintegrasikan dua model output utama yang bersumber dari satu basis data transaksi RKA yang sama (tabel rkat_penerimaan dan rkat_pengeluaran). Alur kerja terdiri dari 3 tahapan utama:'
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tahap 1: Data RKA Mentah (Database): ', bold: true }),
              new TextRun({ text: 'Memuat data usulan belanja dan pendapatan unit kerja dengan atribut akun MAK, kegiatan, uraian belanja, anggaran, sumber dana, unit kerja, dan sasaran/tujuan.' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tahap 2: Rule Engine Klasifikasi (/rka/rules): ', bold: true }),
              new TextRun({ text: 'Menjalankan pencocokan cerdas berdasarkan akun, kata kunci, dan unit kerja untuk memberi label/tag klasifikasi pada data transaksi secara serentak ke dalam basis data.' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Tahap 3: Generator Laporan (/rka/laporan): ', bold: true }),
              new TextRun({ text: 'Menyusun laporan secara otomatis ke dalam format Proposal RKAT (Penerimaan vs Pengeluaran & Surplus/Defisit) dan format RKA Kementerian RI (Struktur baku 6 kolom: BPPTNBH, Selain APBN, dan Rupiah Murni).' })
            ]
          }),

          // SECTION 2: LOGIKA PROPOSAL RKAT
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
            children: [
              new TextRun({
                text: '2. Bisnis Proses & Logika Pemetaan "Proposal RKAT"',
                bold: true,
                size: 26,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Laporan Proposal RKAT berfokus pada keseimbangan keuangan (Penerimaan vs Pengeluaran) universitas dan unit kerja, dengan struktur hierarkis baku sebagai berikut:'
              })
            ]
          }),

          // Sub 2.1 Penerimaan
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 80 },
            children: [
              new TextRun({
                text: '2.1. Struktur & Mapping Penerimaan (Proposal RKAT)',
                bold: true,
                size: 22,
                color: '1D4ED8'
              })
            ]
          }),

          // Tabel Penerimaan
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Pos Laporan Penerimaan', true, 35),
                  createCell('Kriteria Akun / Kata Kunci Matching', true, 40),
                  createCell('Kategori Sumber Dana', true, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Penerimaan Gaji & Tunjangan PNS', false, 35, true),
                  createCell('Akun 41* / Kata kunci: "gaji", "tunjangan pns", "pns"', false, 40),
                  createCell('Dana Pemerintah (APBN)', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Bantuan Pendanaan PTN-BH', false, 35, true),
                  createCell('Akun 42103* / Kata kunci: "bantuan pendanaan", "bp ptn bh", "bpptnbh"', false, 40),
                  createCell('Dana Pemerintah (BPPTNBH)', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Penerimaan Pemerintah Lainnya: Penelitian', false, 35),
                  createCell('Kata kunci: "penelitian", kontrak riset pemerintah', false, 40),
                  createCell('Dana Pemerintah', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Penerimaan Pemerintah Lainnya: Beasiswa & Kerjasama', false, 35),
                  createCell('Akun 42503* / Kata kunci: "beasiswa", "kontrak kerjasama pemerintah"', false, 40),
                  createCell('Dana Pemerintah', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Penerimaan Pemerintah Lainnya: STP ADB & EQUITY', false, 35),
                  createCell('Kata kunci: "science techno park", "stp", "adb", "equity"', false, 40),
                  createCell('Dana Pemerintah (Hibah Luar Negeri)', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Penerimaan Pendidikan Utama', false, 35, true),
                  createCell('Akun 411* / Kata kunci: "ukt", "s1", "s2", "s3", "vokasi", "sarjana"', false, 40),
                  createCell('Dana Masyarakat (UKT/SPP)', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Penerimaan Pendidikan Lainnya', false, 35),
                  createCell('Akun 412* / Kata kunci: "seleksi", "registrasi", "admisi"', false, 40),
                  createCell('Dana Masyarakat', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Penerimaan Non-Pendidikan: Hibah, Jasa, Aset, UPU', false, 35, true),
                  createCell('Akun 421*, 422*, 423*, 426*, 427* / Kata kunci: "hibah", "jasa", "sewa", "aset", "upu"', false, 40),
                  createCell('Dana Masyarakat Non-Akademik', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('Penerimaan Lainnya / Surplus TA Lalu', false, 35),
                  createCell('Akun 40101* / Kata kunci: "surplus tahun sebelumnya"', false, 40),
                  createCell('Saldo Awal / SILPA', false, 25)
                ]
              })
            ]
          }),

          // Sub 2.2 Pengeluaran
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: '2.2. Struktur & Mapping Pengeluaran (Proposal RKAT)',
                bold: true,
                size: 22,
                color: '1D4ED8'
              })
            ]
          }),

          // Tabel Pengeluaran
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Pos Laporan Pengeluaran', true, 35),
                  createCell('Kriteria Kode MAK & Kata Kunci', true, 40),
                  createCell('Keterangan Pos Belanja', true, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('I. Belanja Pegawai', false, 35, true),
                  createCell('Akun MAK 51* / Kata kunci: "pegawai", "gaji", "honor"', false, 40),
                  createCell('Operasional SDM Dosen & Tendik', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('I. Belanja Barang & Jasa', false, 35, true),
                  createCell('Akun MAK 52* / Kata kunci: "barang", "jasa", "konsumsi"', false, 40),
                  createCell('Operasional Rutin & Bahan', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('I. Belanja Perbaikan & Pemeliharaan', false, 35, true),
                  createCell('Akun MAK 53* / Kata kunci: "pemeliharaan", "perbaikan", "renovasi"', false, 40),
                  createCell('Pemeliharaan Sarpras & Alat', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('I. Belanja Perjalanan', false, 35, true),
                  createCell('Akun MAK 54* / Kata kunci: "perjalanan", "dinas", "transport"', false, 40),
                  createCell('Perjalanan Dinas Dalam & Luar Negeri', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('II. Belanja Modal (Investasi)', false, 35, true),
                  createCell('Akun MAK 55* / Kata kunci: "modal"', false, 40),
                  createCell('Pengadaan Aset Tetap, Gedung, Alat', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('II. Belanja Transfer Antar Unit', false, 35, true),
                  createCell('Akun MAK 56* atau 42701* / Kata kunci: "antar unit", "transfer"', false, 40),
                  createCell('Transfer Rekening Antar Unit', false, 25)
                ]
              }),
              new TableRow({
                children: [
                  createCell('III. Program Strategis: STP ADB, PUAPT, EQUITY', false, 35),
                  createCell('Kata kunci: "techno park", "adb", "puapt", "equity"', false, 40),
                  createCell('Program Khusus & Hibah Luar Negeri', false, 25)
                ]
              })
            ]
          }),

          // SECTION 3: LOGIKA RKA KEMENTERIAN
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
            children: [
              new TextRun({
                text: '3. Bisnis Proses & Logika Pemetaan "RKA Kementerian" (6 Kolom Baku)',
                bold: true,
                size: 26,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Laporan RKA Kementerian mengikuti standar format baku Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi RI. Terbagi atas 3 blok pendanaan utama:'
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Blok 1 - BPPTNBH: ', bold: true }),
              new TextRun({ text: 'Dana Bantuan Operasional PTN-BH untuk pos Operasional, Dosen Non-ASN, Tendik Non-ASN, Biaya Investasi, dan Biaya Pengembangan.' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Blok 2 - SELAIN APBN: ', bold: true }),
              new TextRun({ text: 'Seluruh belanja yang didanai dari Dana Masyarakat universitas. Terbagi menjadi pos Operasional (I), Dosen Non-PNS (II), Tendik Non-PNS (III), Investasi (IV), Pengembangan (V), dan Remunerasi (VI).' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Blok 3 - RUPIAH MURNI (RM): ', bold: true }),
              new TextRun({ text: 'Belanja Gaji dan Tunjangan PNS/PPPK yang dialokasikan dari DIPA APBN Kementerian.' })
            ]
          }),

          // Sub 3.1 Mapping IKU
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: '3.1. Logika Distribusi Otomatis Sub-Pos IKU Universitas (A s/d E)',
                bold: true,
                size: 22,
                color: '1D4ED8'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Pada blok SELAIN APBN, pos IV (Investasi), V (Pengembangan), dan VI (Remunerasi) memiliki 5 sub-pos tujuan yang sama persis. Sistem membaca digit pertama dari kode kegiatan (atau kolom sasaran/tujuan):'
              })
            ]
          }),

          // Tabel IKU Sub-Pos
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createCell('Digit Awal Kegiatan', true, 18),
                  createCell('Sub-Pos Tujuan Template', true, 42),
                  createCell('Pos INVESTASI (IV)', true, 14),
                  createCell('Pos PENGEMBANGAN (V)', true, 13),
                  createCell('Pos REMUNERASI (VI)', true, 13)
                ]
              }),
              new TableRow({
                children: [
                  createCell('1 (contoh: 1.2.2.5...)', false, 18, true),
                  createCell('A. Mewujudkan pendidikan transdisiplin yang unggul, inovatif, inklusif dan aplikatif', false, 42),
                  createCell('IV.A (lrka_121)', false, 14),
                  createCell('V.A (lrka_127)', false, 13),
                  createCell('VI.A (lrka_133)', false, 13)
                ]
              }),
              new TableRow({
                children: [
                  createCell('2 (contoh: 2.1.3.4...)', false, 18, true),
                  createCell('B. Mewujudkan reputasi akademik yang unggul melalui penelitian translasional...', false, 42),
                  createCell('IV.B (lrka_122)', false, 14),
                  createCell('V.B (lrka_128)', false, 13),
                  createCell('VI.B (lrka_134)', false, 13)
                ]
              }),
              new TableRow({
                children: [
                  createCell('3 (contoh: 3.1.1.2...)', false, 18, true),
                  createCell('C. Mewujudkan pengabdian kepada masyarakat yang berkualitas, komprehensif...', false, 42),
                  createCell('IV.C (lrka_123)', false, 14),
                  createCell('V.C (lrka_129)', false, 13),
                  createCell('VI.C (lrka_135)', false, 13)
                ]
              }),
              new TableRow({
                children: [
                  createCell('4 (contoh: 4.1.10.1...)', false, 18, true),
                  createCell('D. Menjamin tata kelola universitas yang dinamis, terintegrasi, dan berkelanjutan', false, 42),
                  createCell('IV.D (lrka_124)', false, 14),
                  createCell('V.D (lrka_130)', false, 13),
                  createCell('VI.D (lrka_136)', false, 13)
                ]
              }),
              new TableRow({
                children: [
                  createCell('5 (contoh: 5.2.3.2...)', false, 18, true),
                  createCell('E. Mewujudkan atmosfer kampus yang sehat, ramah lingkungan, berbudaya...', false, 42),
                  createCell('IV.E (lrka_125)', false, 14),
                  createCell('V.E (lrka_131)', false, 13),
                  createCell('VI.E (lrka_137)', false, 13)
                ]
              })
            ]
          }),

          // Sub 3.2 Tiga Pos Besar
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: '3.2. Kriteria Pemetaan Tiga Pos Utama di Selain APBN',
                bold: true,
                size: 22,
                color: '1D4ED8'
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Pos IV. INVESTASI: ', bold: true }),
              new TextRun({ text: 'Ditandai untuk transaksi belanja modal akun MAK 55xxx (55101 s/d 55201) atau tag "INVESTASI". Seluruhnya dialirkan ke blok Selain APBN dan terdistribusi ke sub-pos IV.A s/d IV.E.' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Pos V. PENGEMBANGAN: ', bold: true }),
              new TextRun({ text: 'Ditandai jika nama kegiatan memuat kata "pengembangan" atau akun memuat "beasiswa" dan "bantuan tridharma", atau tag "PENGEMBANGAN". Terdistribusi ke sub-pos V.A s/d V.E.' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Pos VI. REMUNERASI: ', bold: true }),
              new TextRun({ text: 'Ditandai jika nama akun/uraian belanja memuat "insentif" atau "tunjangan" (di luar gaji pokok PNS/PPPK), atau tag "REMUNERASI". Terdistribusi ke sub-pos VI.A s/d VI.E.' })
            ]
          }),

          // SECTION 4: PROSEDUR OPERASIONAL
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
            children: [
              new TextRun({
                text: '4. Prosedur Operasional Pengelolaan Aturan di Menu Rules (/rka/rules)',
                bold: true,
                size: 26,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Pengguna memiliki kendali penuh untuk menambah, mengedit, dan mengeksekusi aturan tagging kapan saja melalui antarmuka web:'
              })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Langkah 1 - Buka Menu: ', bold: true }),
              new TextRun({ text: 'Akses halaman http://localhost:3000/rka/rules pada browser.' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Langkah 2 - Pilih Target Format: ', bold: true }),
              new TextRun({ text: 'Pilih "RKA Kementrian" atau "Proposal RKAT" sesuai jenis laporan yang ingin diatur.' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Langkah 3 - Tentukan Kriteria: ', bold: true }),
              new TextRun({ text: 'Isi filter Unit Kerja ("*" untuk semua), Akun Belanja (contoh "55*"), Kata Kunci (contoh "insentif, tunjangan"), dan Nilai Klasifikasi pos utama.' })
            ]
          }),
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({ text: 'Langkah 4 - Simpan & Terapkan: ', bold: true }),
              new TextRun({ text: 'Klik tombol "Simpan Aturan", lalu klik tombol "⚡ Terapkan Aturan ke Database" untuk melakukan eksekusi langsung ke puluhan ribu baris data belanja secara instan.' })
            ]
          }),

          // SECTION 5: KESIMPULAN & STATUS DEPLOYMENT
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
            children: [
              new TextRun({
                text: '5. Status Deployment & Sinkronisasi Live',
                bold: true,
                size: 26,
                color: '1E3A8A'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Seluruh kode logika mapping, rule engine, dan template laporan telah berhasil divalidasi dengan build Next.js (exit code 0) dan telah di-push secara penuh ke repositori GitHub pada branch main (commit 9ce9df1). Karena proyek terhubung dengan Vercel, pembaruan ini secara otomatis ter-trigger untuk proses deployment ke server production Vercel.'
              })
            ]
          })
        ]
      }
    ]
  });

  return doc;
}

async function main() {
  const doc = buildDocument();
  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.resolve('D:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/Dokumentasi_Logika_Mapping_Proposal_RKAT_dan_RKA_Kementerian.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('Document created successfully at:', outputPath);
}

main().catch(console.error);
