'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, Copy, Check, Eye, Code, Sparkles, RefreshCw, 
  Plus, Trash2, ArrowRight, Printer, FileText, Table as TableIcon, 
  ListOrdered, List, AlignJustify, AlignLeft, Bold, Italic, 
  Download, Upload, CheckCircle2, BookmarkCheck, ArrowLeft,
  ChevronRight, Layers, HelpCircle, Columns, Settings2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// TEMPLATES RESMI PRESET
const TEMPLATE_PRESETS = [
  {
    id: 'pagu_rkat_2027',
    name: 'Penetapan Pagu RKAT 2027 (Baku)',
    category: 'Penetapan Pagu',
    description: 'Format baku surat penetapan pagu RKAT dengan tabel kode unit dan daftar alokasi kegiatan mandatori.',
    html: `<p style="text-align: justify;">Sehubungan dengan penyusunan Rencana Kerja dan Anggaran Tahunan (RKAT) tahun 2027, bersama ini kami sampaikan penetapan pagu alokasi anggaran tahun 2027 untuk unit <strong>Majelis Wali Amanat</strong>. Pagu ditetapkan dengan memperhatikan usulan pagu indikatif dan program efisiensi sesuai kemampuan pendanaan Universitas.</p>
<p style="text-align: justify;">Selanjutnya, kami mohon Pimpinan Unit Kerja dapat mengalokasikan pagu tersebut untuk kegiatan-kegiatan di Unit Kerja Bapak/Ibu secara optimal dengan memerhatikan pencapaian Target Capaian Kinerja (TCK) serta mengedepankan prinsip efektif, efisien, dan akuntabel untuk mendukung pada capaian kinerja Universitas.</p>
<p style="text-align: justify;">Apabila terdapat rencana kegiatan yang belum dapat dialokasikan anggarannya sesuai pagu yang ada, mohon rencana kegiatan dapat dimasukkan sebagai kegiatan prioritas ketiga. Kegiatan-kegiatan yang dimasukkan ke prioritas tiga baru dapat dilaksanakan apabila terdapat efisiensi penggunaan anggaran unit kerja dan/atau Universitas mendapatkan sumber pendanaan baru yang memadai untuk kegiatan tersebut.</p>
<p style="text-align: justify;">Berikut nilai pagu penetapan tahun 2027 untuk unit <strong>Majelis Wali Amanat</strong>:</p>
<table style="border-collapse: collapse; width: 100%; margin: 12px 0;" border="1">
<tbody>
<tr>
<td style="width: 50%; text-align: center; padding: 6px;"><strong>Kode Unit Kerja</strong></td>
<td style="width: 50%; text-align: center; padding: 6px;"><strong>Nilai Pagu</strong></td>
</tr>
<tr>
<td style="width: 50%; text-align: center; padding: 6px;">010101</td>
<td style="width: 50%; text-align: center; padding: 6px;">Rp 12.500.000.000</td>
</tr>
</tbody>
</table>
<p style="text-align: justify;">Pagu yang diperoleh unit kerja tersebut di atas sudah termasuk untuk kegiatan mandatori:</p>
<ol>
<li style="text-align: justify;">Pelaksanaan Audit Internal dan Pengawasan sebesar Rp 500.000.000</li>
<li style="text-align: justify;">Penyusunan Laporan Akuntabilitas Kinerja sebesar Rp 250.000.000</li>
</ol>`
  },
  {
    id: 'kebijakan_mwa_kompleks',
    name: 'Kebijakan Penyesuaian Pagu MWA (Kompleks)',
    category: 'Kebijakan & Regulasi',
    description: 'Format kompleks multi-level: Romawi I-VII, sub-poin huruf a-e, tabel klasifikasi akun 51-54, dan sub-paragraf berindentasi.',
    html: `<p style="text-align: justify;">Menindaklanjuti arahan Majelis Wali Amanat (MWA) sebagaimana tertuang dalam Surat Sekretaris MWA Nomor 15827/UN1.MWA.1/Set-MWA/TP.00.03/2025 tanggal 19 Desember 2025 perihal Penyempurnaan RKAT UGM Tahun 2026, serta sebagai pelaksanaan Peraturan Majelis Wali Amanat Nomor 1 Tahun 2026 tentang Rencana Kerja dan Anggaran Tahunan Universitas Gadjah Mada Tahun Anggaran 2026, dengan ini kami sampaikan kebijakan penyesuaian pagu dan penguatan tata kelola anggaran sebagai berikut</p>
<!-- Bagian Pertama -->
<ol style="list-style-type: upper-roman; font-weight: bold;">
<li style="text-align: justify;"><span style="font-weight: bold;">Latar Belakang dan Arah Kebijakan<br /></span><span style="font-weight: normal;">MWA telah menetapkan kebijakan efisiensi anggaran Universitas Tahun Anggaran 2026 sebagai bagian dari upaya penguatan struktur belanja yang lebih selaras dengan prioritas strategis Universitas. Kebijakan ini bukan semata-mata pengurangan belanja, melainkan upaya efisiensi struktur anggaran agar lebih selaras dengan prioritas strategis Universitas, antara lain: penguatan kualitas akademik, reorientasi pengabdian kepada masyarakat, optimalisasi implementasi SOTK dan sistem teknologi informasi, penguatan fungsi hukum dan kepatuhan, serta akselerasi Dana Abadi Universitas. Hasil penyesuaian akan dialokasikan kembali untuk mendukung program-program prioritas tersebut. <br /><br /></span><span style="font-weight: normal;">Kami menyadari bahwa keberhasilan kebijakan ini sangat bergantung pada komitmen setiap pimpinan unit kerja dalam melakukan <em>refocusing</em> program secara cermat tanpa mengorbankan capaian indikator kinerja utama unit.<br /><br /></span></li>
<li style="text-align: justify;"><span style="font-weight: bold;">Pos Anggaran yang Dikecualikan<br /></span><span style="font-weight: normal;">Mengingat sifatnya yang mengikat dan/atau berdampak langsung pada keberlangsungan operasional, pos-pos berikut dikecualikan dari kebijakan penyesuaian:</span><br />
<ol style="font-weight: normal; list-style-type: lower-alpha;">
<li style="text-align: justify;"><span style="font-weight: normal;">Biaya operasional dasar (listrik, air, dan pengelolaan persampahan);</span></li>
<li style="text-align: justify;"><span style="font-weight: normal;">Biaya pelaksanaan pembelajaran dan kemahasiswaaan;</span></li>
<li style="text-align: justify;"><span style="font-weight: normal;">Belanja gaji dan tunjangan pegawai;</span></li>
<li style="text-align: justify;"><span style="font-weight: normal;">Belanja yang terikat kontrak yang masih berjalan (<em>multi-years</em> dan/atau kontrak pihak ketiga yang belum berakhir).<br /><br /></span></li>
</ol>
</li>
<li style="text-align: justify;"><span style="font-weight: bold;">Penyesuaian Pagu Anggaran berdasarkan Klasifikasi Akun</span><br /><span style="font-weight: normal;">Penyesuaian (rasionalisasi) pagu diberlakukan secara proporsional kerja, dengan pertimbangan sebagai berikut:<br /></span>
<ol style="font-weight: normal; list-style-type: lower-alpha;">
<li style="text-align: justify;">Mendorong efisiensi perjalanan dinas dengan mengoptimalkan penggunaan rapat virtual, serta membatasi jumlah personil yang dapat bepergian serta efisiensi jumlah hari kegiatan perjalanan dinas;</li>
<li style="text-align: justify;">Mendorong optimalisasi inventaris barang dan jasa yang dimiliki UGM untuk memastikan barang/jasa yang sudah ada dimanfaatkan secara maksimal sebelum membeli yang baru;</li>
<li style="text-align: justify;">Mendorong kebijakan 3R (reduce, reuse, recycle) atas barang dan jasa yang telah dimiliki;</li>
<li style="text-align: justify;">Memprioritaskan belanja perbaikan dan Pemeliharaan yang mendukung secara langsung pada pelaksanaan Tridharma UGM;</li>
<li style="text-align: justify;">Memprioritaskan belanja modal yang memiliki dampak langsung terhadap Tridharma UGM, misalnya belanja modal peralatan laboratorium.</li>
</ol>
<br /><span style="font-weight: normal;">Adapun target penyesuaian per pos belanja diharapkan dapat dilakukan sebagaimana tabel dibawah ini:</span>
<table style="border-collapse: collapse; width: 90%; margin-top: 10px; font-weight: normal;" border="1">
<tbody>
<tr>
<td style="width: 20%; text-align: center; padding: 6px;"><strong>Klasifikasi Akun</strong></td>
<td style="width: 50%; text-align: center; padding: 6px;"><strong>Uraian Umum</strong></td>
<td style="width: 30%; text-align: center; padding: 6px;"><strong>Persentase Penyesuaian</strong></td>
</tr>
<tr>
<td style="width: 20%; text-align: center; padding: 6px;">51</td>
<td style="width: 50%; padding: 6px;">Belanja Pegawai non-pokok</td>
<td style="width: 30%; text-align: center; padding: 6px;">7,3%</td>
</tr>
<tr>
<td style="width: 20%; text-align: center; padding: 6px;">52</td>
<td style="width: 50%; padding: 6px;">Belanja Barang dan Jasa</td>
<td style="width: 30%; text-align: center; padding: 6px;">12,125%</td>
</tr>
<tr>
<td style="width: 20%; text-align: center; padding: 6px;">53</td>
<td style="width: 50%; padding: 6px;">Belanja Pemeliharaan</td>
<td style="width: 30%; text-align: center; padding: 6px;">10,0%</td>
</tr>
<tr>
<td style="width: 20%; text-align: center; padding: 6px;">54</td>
<td style="width: 50%; padding: 6px;">Belanja Perjalanan Dinas</td>
<td style="width: 30%; text-align: center; padding: 6px;">40,0%</td>
</tr>
</tbody>
</table>
<p style="text-align: justify;"><span style="font-weight: normal;">Penyesuaian terbesar pada akun 54 (Perjalanan Dinas) merupakan implementasi langsung arahan MWA terkait optimalisasi metode daring, peninjauan kembali kebijakan, dan penetapan norma kepantasan.</span></p>
</li>
</ol>
<!-- Bagian Kedua (Melanjutkan nomor IV) -->
<ol style="list-style-type: upper-roman; font-weight: bold;" start="4">
<li style="text-align: justify;"><span style="font-weight: bold;">Penyesuaian kegiatan Perjalanan Dinas</span><br /><span style="font-weight: normal;">Sebagai bagian tak terpisahkan dari kebijakan ini, ditetapkan norma pendamping perjalanan dinas sebagai berikut:</span></li>
<ol style="font-weight: normal; list-style-type: lower-alpha;">
<li style="text-align: justify;">Rektor: maksimal 2 (dua) orang pendamping;</li>
<li style="text-align: justify;">Wakil Rektor dan Dekan/Direktur: maksimal 1 (satu) orang pendamping;</li>
<li style="text-align: justify;">Pimpinan dan pegawai lainnya: tanpa pendamping, kecuali terdapat justifikasi substantif yang dilampirkan pada surat tugas.</li>
</ol>
</ol>
<p style="text-align: justify; margin: 0; padding-left: 30pt;">Pelaksanaan rapat koordinasi, pembinaan, studi tiru, dan kegiatan sejenis diharapkan mengoptimalkan kanal daring sepanjang substansinya memungkinkan.</p>
<ol style="list-style-type: upper-roman; font-weight: bold;" start="5">
<li style="text-align: justify;">Efisiensi Berbasis Prioritas Unit<br /><span style="font-weight: normal;">Pimpinan unit kerja diberikan keleluasaan dalam menyusun skala prioritas internal, sepanjang tetap menjamin keberlangsungan program kerja utama dan tercapainya indikator kinerja yang telah ditetapkan dalam RKAT 2026. Universitas mendorong setiap unit kerja untuk menelaah kembali kegiatan-kegiatan yang telah direncanakan dan mereviu kembali nilai tambahnya masih berpotensi untuk dioptimalkan, sebagaimana menjadi perhatian MWA.<br /><br /></span></li>
<li>Mekanisme dan Batas Waktu Revisi RKAT</li>
<ol style="font-weight: normal; list-style-type: lower-alpha;">
<li style="text-align: justify;">Setiap unit kerja menyusun Matriks Perubahan Anggaran sesuai format terlampir, dengan menjaga konsistensi antara indikator kinerja, program/kegiatan, dan alokasi anggaran;</li>
<li style="text-align: justify;">Matriks disampaikan secara resmi melalui Simaster Persuratan yang ditujukan kepada Wakil Rektor Bidang Sumber Daya Manusia dan Keuangan;</li>
<li style="text-align: justify;">Atas dasar matriks tersebut, revisi anggaran dilaksanakan pada modul Finance Simaster;</li>
<li style="text-align: justify;">Batas akhir penyampaian matriks revisi ditetapkan paling lambat 14 (empat belas) hari kerja sejak surat ini diterima;</li>
<li style="text-align: justify;">Direktorat Keuangan dan Direktorat Perencanaan akan memfasilitasi pendampingan teknis bagi unit yang memerlukan.<br /><br /></span></li>
</ol>
<li style="text-align: justify;">Penutup<br /><span style="font-weight: normal;">Kebijakan penyesuaian ini ditempuh dengan semangat kolegialitas dan tanggung jawab bersama untuk menjaga kesehatan fiskal, akuntabilitas, serta keberlanjutan Universitas Gadjah Mada. Kami meyakini bahwa dengan dukungan penuh dari para pimpinan unit kerja, proses penyesuaian dapat berjalan tertib, terukur, dan tetap menjaga kualitas layanan akademik maupun layanan publik Universitas.</span></li>
</ol>`
  },
  {
    id: 'undangan_rapat_resmi',
    name: 'Surat Undangan Pembahasan Anggaran (Standard)',
    category: 'Undangan & Pemberitahuan',
    description: 'Format surat undangan pembahasan anggaran dengan rincian jadwal, tempat, dan agenda terstruktur.',
    html: `<p style="text-align: justify;">Menindaklanjuti agenda penelaahan usulan Rencana Kerja dan Anggaran Tahunan (RKAT), dengan ini kami mengundang Bapak/Ibu Pimpinan Unit Kerja untuk hadir dalam rapat koordinasi teknis yang akan diselenggarakan pada:</p>
<table style="border-collapse: collapse; width: 90%; margin: 12px 0 12px 20px;" border="0">
<tbody>
<tr>
<td style="width: 25%; padding: 4px 0;"><strong>Hari, Tanggal</strong></td>
<td style="width: 5%; padding: 4px 0;">:</td>
<td style="width: 70%; padding: 4px 0;">Senin, 15 September 2026</td>
</tr>
<tr>
<td style="width: 25%; padding: 4px 0;"><strong>Waktu</strong></td>
<td style="width: 5%; padding: 4px 0;">:</td>
<td style="width: 70%; padding: 4px 0;">09.00 WIB - selesai</td>
</tr>
<tr>
<td style="width: 25%; padding: 4px 0;"><strong>Tempat</strong></td>
<td style="width: 5%; padding: 4px 0;">:</td>
<td style="width: 70%; padding: 4px 0;">Ruang Sidang Utama / Zoom Meeting (Hybrid)</td>
</tr>
<tr>
<td style="width: 25%; padding: 4px 0;"><strong>Agenda</strong></td>
<td style="width: 5%; padding: 4px 0;">:</td>
<td style="width: 70%; padding: 4px 0;">Klarifikasi dan Penelaahan Usulan Belanja Mandatori 2027</td>
</tr>
</tbody>
</table>
<p style="text-align: justify;">Mengingat pentingnya agenda tersebut, kami mohon kehadiran Bapak/Ibu tepat waktu. Apabila berhalangan hadir, mohon dapat menugaskan pejabat yang berwenang mengambil keputusan.</p>
<p style="text-align: justify;">Demikian undangan ini kami sampaikan. Atas perhatian dan kehadiran Bapak/Ibu, kami ucapkan terima kasih.</p>`
  }
];

export default function SuratHtmlEditorPage() {
  const [htmlCode, setHtmlCode] = useState(TEMPLATE_PRESETS[0].html);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview'>('visual');
  const [copied, setCopied] = useState(false);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('sans');
  const [fontSize, setFontSize] = useState<'11pt' | '12pt'>('12pt');
  const [lineSpacing, setLineSpacing] = useState<'1.15' | '1.5' | '1.0'>('1.15');

  // Interactive Table Modal
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableBorder, setTableBorder] = useState(true);
  const [tableHeader, setTableHeader] = useState(true);

  // Function to insert HTML snippet into the current code
  const insertSnippet = (snippet: string) => {
    setHtmlCode(prev => prev + '\n' + snippet);
    toast.success('Komponen baru berhasil ditambahkan!');
  };

  // Quick Action Snippet Generators
  const addJustifiedParagraph = () => {
    insertSnippet('<p style="text-align: justify;">Tuliskan isi paragraf surat di sini dengan perataan rata kiri-kanan (justified)...</p>');
  };

  const addIndentedParagraph = () => {
    insertSnippet('<p style="text-align: justify; text-indent: 30pt;">Tuliskan paragraf menjorok ke dalam (first-line indent) di sini...</p>');
  };

  const addSubParagraphIndent = () => {
    insertSnippet('<p style="text-align: justify; margin: 0; padding-left: 30pt;">Tuliskan sub-paragraf dengan margin kiri (padding-left) di sini...</p>');
  };

  const addRomanList = () => {
    insertSnippet(`<ol style="list-style-type: upper-roman; font-weight: bold;">
<li style="text-align: justify;"><span style="font-weight: bold;">Judul Poin Romawi I<br /></span><span style="font-weight: normal;">Uraian penjelasan poin pertama...</span></li>
<li style="text-align: justify;"><span style="font-weight: bold;">Judul Poin Romawi II<br /></span><span style="font-weight: normal;">Uraian penjelasan poin kedua...</span></li>
</ol>`);
  };

  const addAlphaList = () => {
    insertSnippet(`<ol style="font-weight: normal; list-style-type: lower-alpha;">
<li style="text-align: justify;">Poin butir a;</li>
<li style="text-align: justify;">Poin butir b;</li>
<li style="text-align: justify;">Poin butir c.</li>
</ol>`);
  };

  const addDecimalList = () => {
    insertSnippet(`<ol>
<li style="text-align: justify;">Rincian butir nomor 1 sebesar Rp 0;</li>
<li style="text-align: justify;">Rincian butir nomor 2 sebesar Rp 0.</li>
</ol>`);
  };

  const addBulletList = () => {
    insertSnippet(`<ul style="list-style-type: disc;">
<li style="text-align: justify;">Poin butir bullet pertama;</li>
<li style="text-align: justify;">Poin butir bullet kedua.</li>
</ul>`);
  };

  const handleGenerateTable = () => {
    let tableHtml = `<table style="border-collapse: collapse; width: 100%; margin: 12px 0;" ${tableBorder ? 'border="1"' : 'border="0"'}>\n<tbody>\n`;
    
    // Header Row
    if (tableHeader) {
      tableHtml += '<tr>\n';
      for (let c = 1; c <= tableCols; c++) {
        const colWidth = Math.round(100 / tableCols);
        tableHtml += `  <td style="width: ${colWidth}%; text-align: center; padding: 6px;"><strong>Kolom ${c}</strong></td>\n`;
      }
      tableHtml += '</tr>\n';
    }

    // Data Rows
    const dataRowStart = tableHeader ? 2 : 1;
    for (let r = dataRowStart; r <= tableRows; r++) {
      tableHtml += '<tr>\n';
      for (let c = 1; c <= tableCols; c++) {
        const colWidth = Math.round(100 / tableCols);
        tableHtml += `  <td style="width: ${colWidth}%; padding: 6px; text-align: ${c === 1 ? 'center' : 'left'};">&nbsp;</td>\n`;
      }
      tableHtml += '</tr>\n';
    }

    tableHtml += '</tbody>\n</table>';
    insertSnippet(tableHtml);
    setIsTableModalOpen(false);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    toast.success('Kode HTML berhasil disalin ke clipboard! Siap dipaste ke editor kantor.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `format_surat_clean_${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('File HTML berhasil diunduh!');
  };

  const handlePrintPreview = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) {
      toast.error('Harap izinkan popup browser untuk membuka pratinjau cetak.');
      return;
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pratinjau_Surat_Resmi</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 25mm 20mm 25mm;
          }
          body {
            font-family: ${fontFamily === 'serif' ? "'Times New Roman', Times, serif" : "Arial, 'Segoe UI', sans-serif"};
            font-size: ${fontSize};
            line-height: ${lineSpacing};
            color: #000000;
            margin: 0;
            padding: 20px;
          }
          p {
            margin: 0 0 10pt 0;
            text-align: justify;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 10pt;
          }
          table, th, td {
            border: 1px solid #000000;
          }
          td, th {
            padding: 5px 8px;
            font-size: ${fontSize};
          }
          ol, ul {
            margin: 0 0 10pt 0;
            padding-left: 24pt;
          }
          li {
            margin-bottom: 4pt;
            text-align: justify;
          }
        </style>
      </head>
      <body>
        ${htmlCode}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.write(printHtml);
    printWin.document.close();
  };

  const handleLoadPreset = (presetHtml: string) => {
    if (confirm('Muat template preset ini? Isi dokumen saat ini akan digantikan.')) {
      setHtmlCode(presetHtml);
      toast.success('Template berhasil dimuat!');
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-4">
      {/* 1. SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/surat">
            <button className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer" title="Kembali ke Daftar Surat">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-2.5 rounded-xl text-white shadow-xs">
            <FileCode size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">
                Pembuat & Konverter HTML Surat Resmi
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black">
                WYSIWYG Clean HTML Generator
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Hasilkan kode HTML yang 100% presisi untuk penomoran bertingkat (Romawi/Abjad/Angka), tabel resmi, dan paragraf rata kiri-kanan (*justified*).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={handlePrintPreview}
            className="h-9 px-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Printer size={13} />
            <span>Cetak / PDF</span>
          </button>

          <button 
            onClick={handleDownloadHtml}
            className="h-9 px-3.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Download size={13} />
            <span>Unduh .html</span>
          </button>

          <button 
            onClick={handleCopyHtml}
            className="h-9 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
            <span>{copied ? 'HTML Tersalin!' : 'Salin Kode HTML'}</span>
          </button>
        </div>
      </div>

      {/* 2. PRESET TEMPLATES BAR */}
      <div className="bg-white p-3.5 px-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <BookmarkCheck size={16} className="text-indigo-600" />
          <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Template Resmi:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TEMPLATE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset.html)}
              className="h-8 px-3 rounded-xl bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-xs font-bold text-gray-700 hover:text-indigo-700 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              title={preset.description}
            >
              <Sparkles size={12} className="text-amber-500" />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. QUICK INSERT TOOLBAR (Komponen Surat) */}
      <div className="bg-white p-3 px-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1.5">Sisipkan:</span>

          {/* Paragraf */}
          <button 
            onClick={addJustifiedParagraph} 
            className="h-7 px-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Paragraf Rata Kanan-Kiri"
          >
            <AlignJustify size={12} className="text-indigo-600" />
            <span>Paragraf Justify</span>
          </button>

          <button 
            onClick={addIndentedParagraph} 
            className="h-7 px-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Paragraf Menjorok Awal Baris"
          >
            <AlignLeft size={12} className="text-indigo-600" />
            <span>Paragraf Menjorok</span>
          </button>

          <button 
            onClick={addSubParagraphIndent} 
            className="h-7 px-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Sub-Paragraf dengan Padding Kiri 30pt"
          >
            <span>Sub-Indent (30pt)</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

          {/* List & Numbering */}
          <button 
            onClick={addRomanList} 
            className="h-7 px-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold text-purple-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Penomoran Romawi (I, II, III...)"
          >
            <ListOrdered size={12} />
            <span>Romawi (I, II)</span>
          </button>

          <button 
            onClick={addAlphaList} 
            className="h-7 px-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold text-purple-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Penomoran Abjad (a, b, c...)"
          >
            <ListOrdered size={12} />
            <span>Abjad (a, b, c)</span>
          </button>

          <button 
            onClick={addDecimalList} 
            className="h-7 px-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold text-purple-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Penomoran Angka (1, 2, 3...)"
          >
            <ListOrdered size={12} />
            <span>Angka (1, 2, 3)</span>
          </button>

          <button 
            onClick={addBulletList} 
            className="h-7 px-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Poin Bullet"
          >
            <List size={12} className="text-gray-600" />
            <span>Bullet</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

          {/* Tabel */}
          <button 
            onClick={() => setIsTableModalOpen(true)} 
            className="h-7 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Buat Tabel Resmi Bergaris"
          >
            <TableIcon size={12} />
            <span>+ Tabel Surat</span>
          </button>
        </div>

        {/* Font & Spacing Control */}
        <div className="flex items-center gap-2">
          <select 
            value={fontFamily} 
            onChange={(e: any) => setFontFamily(e.target.value)}
            className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none"
          >
            <option value="sans">Font: Sans-Serif (Arial/Segoe)</option>
            <option value="serif">Font: Serif (Times New Roman)</option>
          </select>

          <select 
            value={lineSpacing} 
            onChange={(e: any) => setLineSpacing(e.target.value)}
            className="h-7 px-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none"
          >
            <option value="1.15">Spasi: 1.15</option>
            <option value="1.5">Spasi: 1.5</option>
            <option value="1.0">Spasi: 1.0 (Rapat)</option>
          </select>
        </div>
      </div>

      {/* 4. MAIN DUAL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PANEL KIRI: EDITOR KODE HTML CLEAN */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col h-[780px]">
          {/* Header Panel Kiri */}
          <div className="p-3 px-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Code size={15} className="text-indigo-600" />
              <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Editor Kode HTML Surat</span>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              {htmlCode.length.toLocaleString()} Karakter
            </span>
          </div>

          {/* Textarea Code */}
          <div className="p-3 flex-1 flex flex-col">
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="Ketik atau paste format HTML surat di sini..."
              className="w-full flex-1 p-4 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed rounded-xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner selection:bg-indigo-600 selection:text-white"
              spellCheck={false}
            />
          </div>

          {/* Footer Panel Kiri */}
          <div className="p-3 px-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[11px] text-gray-500 font-medium">
            <span>Tip: Salin kode ini lalu paste pada mode "Source / HTML Code" di WYSIWYG editor kantor Anda.</span>
            <button
              onClick={() => {
                if (confirm('Kosongkan editor?')) {
                  setHtmlCode('');
                }
              }}
              className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
            >
              Reset Kosong
            </button>
          </div>
        </div>

        {/* PANEL KANAN: PRATINJAU KERTAS DOKUMEN RESMI (A4 PREVIEW) */}
        <div className="bg-slate-100 rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col h-[780px]">
          {/* Header Panel Kanan */}
          <div className="p-3 px-4 border-b border-gray-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={15} className="text-emerald-600" />
              <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Pratinjau Kertas Surat Resmi</span>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
              ● Live Render 1:1
            </span>
          </div>

          {/* Lembar Kertas Dokumen */}
          <div className="flex-1 p-4 overflow-y-auto flex justify-center bg-slate-200/60">
            <div 
              className="bg-white w-full max-w-[720px] min-h-[900px] p-8 md:p-12 rounded-xl shadow-md border border-gray-300 transition-all text-gray-900"
              style={{
                fontFamily: fontFamily === 'serif' ? "'Times New Roman', Times, serif" : "Arial, 'Segoe UI', sans-serif",
                fontSize: fontSize,
                lineHeight: lineSpacing
              }}
            >
              {/* Rendered HTML Container */}
              <div 
                className="surat-rendered-content"
                dangerouslySetInnerHTML={{ __html: htmlCode }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. MODAL BUILDER TABEL INTERAKTIF */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TableIcon size={18} />
                </div>
                <h3 className="text-sm font-black text-gray-900">Buat Tabel Surat Resmi</h3>
              </div>
              <button 
                onClick={() => setIsTableModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Jumlah Baris:
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="50" 
                    value={tableRows} 
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 1)} 
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-bold text-gray-800" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Jumlah Kolom:
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10" 
                    value={tableCols} 
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 1)} 
                    className="w-full h-9 px-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-bold text-gray-800" 
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={tableHeader} 
                    onChange={(e) => setTableHeader(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" 
                  />
                  <span className="text-xs font-bold text-gray-700">Sertakan Baris Header Tebal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={tableBorder} 
                    onChange={(e) => setTableBorder(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" 
                  />
                  <span className="text-xs font-bold text-gray-700">Tampilkan Garis Tepi Tabel (Border 1)</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
              <button 
                onClick={() => setIsTableModalOpen(false)} 
                className="h-8 px-4 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleGenerateTable} 
                className="h-8 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Sisipkan Tabel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
