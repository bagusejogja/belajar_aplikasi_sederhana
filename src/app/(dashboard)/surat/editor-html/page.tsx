'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, Copy, Check, Eye, Code, Sparkles, RefreshCw, RotateCcw,
  Plus, Trash2, ArrowRight, Printer, FileText, Table as TableIcon, 
  ListOrdered, List, AlignJustify, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Download, Upload, CheckCircle2, BookmarkCheck, 
  ArrowLeft, ChevronRight, Layers, HelpCircle, Columns, Settings2,
  Edit3, Play, SplitSquareVertical, Rows, FileUp, Loader2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import JSZip from 'jszip';

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
  }
];

// NATIVE HIGH-PRECISION DOCX TO HTML CONVERTER (Preserves Numbering, Tables, Alignment & Styles)
async function parseDocxToPrecisionOfficeHtml(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = await zip.file('word/document.xml')?.async('string');
  const numXml = await zip.file('word/numbering.xml')?.async('string') || '';

  if (!docXml) return '<p style="text-align: justify;">Dokumen kosong</p>';

  // 1. Parse Numbering Definitions from numbering.xml
  const abstractNums: Record<string, Record<string, { numFmt: string; lvlText: string }>> = {};
  const numToAbstract: Record<string, string> = {};
  
  const anMatches = numXml.match(/<w:abstractNum[\s\S]*?<\/w:abstractNum>/g) || [];
  anMatches.forEach(an => {
    const anId = an.match(/w:abstractNumId="(\d+)"/)?.[1];
    if (!anId) return;
    abstractNums[anId] = {};
    const lvls = an.match(/<w:lvl[\s\S]*?<\/w:lvl>/g) || [];
    lvls.forEach(lvl => {
      const ilvl = lvl.match(/w:ilvl="(\d+)"/)?.[1] || '0';
      const numFmt = lvl.match(/<w:numFmt w:val="([^"]+)"/)?.[1] || 'decimal';
      const lvlText = lvl.match(/<w:lvlText w:val="([^"]+)"/)?.[1] || '%1.';
      abstractNums[anId][ilvl] = { numFmt, lvlText };
    });
  });

  const numMatches = numXml.match(/<w:num[\s\S]*?<\/w:num>/g) || [];
  numMatches.forEach(n => {
    const numId = n.match(/w:numId="(\d+)"/)?.[1];
    const anId = n.match(/<w:abstractNumId w:val="(\d+)"/)?.[1];
    if (numId && anId) {
      numToAbstract[numId] = anId;
    }
  });

  function toAlpha(num: number, isUpper = false): string {
    const code = (isUpper ? 65 : 97) + ((num - 1) % 26);
    return String.fromCharCode(code);
  }

  function toRoman(num: number): string {
    const roman: Record<string, number> = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let str = '';
    for (let i of Object.keys(roman)) {
      let q = Math.floor(num / roman[i]);
      num -= q * roman[i];
      str += i.repeat(q);
    }
    return str;
  }

  let headingLetterSeq = 0;

  function extractFormattedText(xml: string): string {
    let result = '';
    const runs = xml.match(/<w:r[\s\S]*?<\/w:r>/g) || [];
    
    runs.forEach(r => {
      const isBold = /<w:b(\s*\/|>|\s+w:val="1")/.test(r) || /<w:bCs(\s*\/|>|\s+w:val="1")/.test(r);
      const isItalic = /<w:i(\s*\/|>|\s+w:val="1")/.test(r) || /<w:iCs(\s*\/|>|\s+w:val="1")/.test(r);
      const isUnderline = /<w:u\s+w:val="single"/.test(r);

      const textMatches = r.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      let runText = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');

      if (!runText) return;

      runText = runText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (isBold) runText = `<strong>${runText}</strong>`;
      if (isItalic) runText = `<em>${runText}</em>`;
      if (isUnderline) runText = `<u>${runText}</u>`;

      result += runText;
    });

    return result;
  }

  function parseIndentationPt(indXml: string | null) {
    if (!indXml) return { leftPt: 0, firstLinePt: 0 };
    const left = indXml.match(/w:left="(\d+)"/)?.[1];
    const firstLine = indXml.match(/w:firstLine="(\d+)"/)?.[1];

    const leftPt = left ? Math.round(parseInt(left, 10) / 20) : 0;
    const firstLinePt = firstLine ? Math.round(parseInt(firstLine, 10) / 20) : 0;

    return { leftPt, firstLinePt };
  }

  const elements = docXml.match(/(<w:p[\s\S]*?<\/w:p>|<w:tbl[\s\S]*?<\/w:tbl>)/g) || [];
  
  let htmlOut: string[] = [];
  let listStack: Array<{ numFmt: string; level: number; isUl: boolean; openLi: boolean }> = [];
  let headingSeq = 0;

  function closeAllLists() {
    while (listStack.length > 0) {
      const item = listStack.pop()!;
      if (item.openLi) htmlOut.push('</li>');
      htmlOut.push(item.isUl ? '</ul>' : '</ol>');
    }
  }

  function adjustListStack(targetFmt: string, targetLevel: number) {
    while (listStack.length > targetLevel) {
      const item = listStack.pop()!;
      if (item.openLi) htmlOut.push('</li>');
      htmlOut.push(item.isUl ? '</ul>' : '</ol>');
    }

    if (listStack.length === targetLevel && targetLevel > 0) {
      const current = listStack[listStack.length - 1];
      if (current.numFmt !== targetFmt) {
        const item = listStack.pop()!;
        if (item.openLi) htmlOut.push('</li>');
        htmlOut.push(item.isUl ? '</ul>' : '</ol>');
      }
    }

    while (listStack.length < targetLevel) {
      const currentLevel = listStack.length;
      const isUl = targetFmt === 'disc' || targetFmt === 'bullet';
      const padLeft = currentLevel === 0 ? 20 : 16;
      const listStyleType = isUl ? 'disc' : (
        targetFmt === 'lowerLetter' || targetFmt === 'lower-alpha' ? 'lower-alpha' :
        targetFmt === 'upperRoman' || targetFmt === 'upper-roman' ? 'upper-roman' :
        targetFmt === 'lowerRoman' || targetFmt === 'lower-roman' ? 'lower-roman' :
        'decimal'
      );

      const tag = isUl ? 'ul' : 'ol';
      const style = `list-style-type: ${listStyleType}; margin: 2pt 0 6pt 0; padding-left: ${padLeft}pt; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4;`;
      htmlOut.push(`<${tag} style="${style}">`);
      listStack.push({ numFmt: targetFmt, level: currentLevel, isUl, openLi: false });
    }
  }

  elements.forEach(elem => {
    if (elem.startsWith('<w:tbl')) {
      closeAllLists();
      
      let tblHtml = '<table style="border-collapse: collapse; width: 100%; margin: 14px 0; font-family: \'Times New Roman\', Times, serif; font-size: 12pt;" border="1">\n<tbody>\n';
      const rows = elem.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
      let tableRowSeq = 0;

      rows.forEach((row, rowIdx) => {
        tblHtml += '<tr>\n';
        const cells = row.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
        
        cells.forEach((cell, colIdx) => {
          const isHeader = rowIdx === 0;
          const alignMatch = cell.match(/<w:jc w:val="([^"]+)"/);
          let textAlign = alignMatch ? alignMatch[1] : (colIdx === 0 ? 'center' : 'left');
          if (textAlign === 'both') textAlign = 'justify';

          const pMatches = cell.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
          let cellTextArr: string[] = [];

          pMatches.forEach(p => {
            const numPr = p.match(/<w:numPr>[\s\S]*?<\/w:numPr>/);
            let pText = extractFormattedText(p);

            if (numPr && !pText.trim() && colIdx === 0 && !isHeader) {
              tableRowSeq++;
              pText = tableRowSeq.toString();
            }

            if (pText.trim()) cellTextArr.push(pText);
          });

          let cellContent = cellTextArr.join('<br />');
          if (!cellContent.trim() && colIdx === 0 && !isHeader) {
            tableRowSeq++;
            cellContent = tableRowSeq.toString();
          }

          const tag = isHeader ? 'th' : 'td';
          const padding = 'padding: 6px 10px;';
          const weight = isHeader ? 'font-weight: bold;' : '';
          const alignStyle = `text-align: ${textAlign};`;
          
          tblHtml += `  <${tag} style="${padding} ${weight} ${alignStyle} font-family: 'Times New Roman', Times, serif; font-size: 12pt;">\n    ${cellContent || '&nbsp;'}\n  </${tag}>\n`;
        });
        tblHtml += '</tr>\n';
      });

      tblHtml += '</tbody>\n</table>';
      htmlOut.push(tblHtml);

    } else if (elem.startsWith('<w:p')) {
      const text = extractFormattedText(elem);
      if (!text.trim()) return;

      const alignMatch = elem.match(/<w:jc w:val="([^"]+)"/);
      let align = 'justify';
      if (alignMatch) {
        if (alignMatch[1] === 'center') align = 'center';
        else if (alignMatch[1] === 'right') align = 'right';
        else if (alignMatch[1] === 'left') align = 'left';
      }

      const numPr = elem.match(/<w:numPr>[\s\S]*?<\/w:numPr>/);

      if (numPr) {
        const numId = numPr[0].match(/<w:numId w:val="(\d+)"/)?.[1];
        const ilvl = numPr[0].match(/<w:ilvl w:val="(\d+)"/)?.[1] || '0';
        const anId = numId ? numToAbstract[numId] : undefined;
        const lvlDef = (anId && abstractNums[anId]) ? abstractNums[anId][ilvl] || { numFmt: 'decimal', lvlText: '%1.' } : { numFmt: 'decimal', lvlText: '%1.' };

        // 1. BAB / Heading (A. PENDAHULUAN, B. DASAR HUKUM, C. MANFAAT..., D. KETENTUAN...)
        if ((lvlDef.numFmt === 'upperLetter' || lvlDef.numFmt === 'upperRoman') && ilvl === '0') {
          closeAllLists();
          headingSeq++;
          const letter = lvlDef.numFmt === 'upperRoman' ? toRoman(headingSeq) : toAlpha(headingSeq, true);
          htmlOut.push(
            `<p style="text-align: ${align}; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt;">` +
            `<strong>${letter}. ${text}</strong></p>`
          );
          return;
        }

        // Determine Level:
        // Any decimal list items directly under a BAB (Dasar Hukum 1-17, Manfaat 1-5, Ketentuan 1-7) = Level 1
        let targetLevel = 1;
        if (lvlDef.numFmt === 'lowerLetter' || lvlDef.numFmt === 'lower-alpha') {
          targetLevel = 2; // Sub-items a., b., c.
        } else if (lvlDef.numFmt === 'bullet' || lvlDef.numFmt === 'disc') {
          targetLevel = 3; // Bullets
        }

        adjustListStack(lvlDef.numFmt, targetLevel);

        const currentList = listStack[listStack.length - 1];
        if (currentList && currentList.openLi) {
          htmlOut.push('</li>');
        }
        if (currentList) {
          currentList.openLi = true;
        }

        htmlOut.push(`<li style="text-align: ${align}; margin-bottom: 4pt; padding-left: 4pt; font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4;">${text}`);
        return;
      }

      // Paragraf Narasi / Redaksi (starts at 15pt — EXACTLY UNDER letter P in "A. PENDAHULUAN" / M in "C. MANFAAT")
      closeAllLists();

      htmlOut.push(
        `<p style="text-align: ${align}; font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin-top: 2pt; margin-bottom: 8pt; padding-left: 15pt; line-height: 1.4;">${text}</p>`
      );
    }
  });

  closeAllLists();
  return htmlOut.join('\n');
}

export default function SuratHtmlEditorPage() {
  const [htmlCode, setHtmlCode] = useState('');
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [copied, setCopied] = useState(false);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');
  const [fontSize, setFontSize] = useState<'11pt' | '12pt'>('12pt');
  const [lineSpacing, setLineSpacing] = useState<'1.15' | '1.5' | '1.0'>('1.15');

  // Word Upload State
  const [isWordConverting, setIsWordConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ref untuk Visual ContentEditable DOM
  const visualEditorRef = useRef<HTMLDivElement>(null);

  // Sync state ke visual editor saat htmlCode berubah dari luar
  useEffect(() => {
    if (visualEditorRef.current && visualEditorRef.current.innerHTML !== htmlCode) {
      visualEditorRef.current.innerHTML = htmlCode;
    }
  }, [htmlCode]);

  // Saat user mengetik langsung di visual editor
  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      setHtmlCode(visualEditorRef.current.innerHTML);
    }
  };

  // Interactive Table Modal
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(2);
  const [tableCols, setTableCols] = useState(2);
  const [tableBorder, setTableBorder] = useState(true);
  const [tableHeader, setTableHeader] = useState(true);
  const [tablePresetType, setTablePresetType] = useState<'pagu' | 'klasifikasi' | 'custom'>('pagu');

  // Interactive Pagu Values Helper
  const [paguUnitCode, setPaguUnitCode] = useState('010101');
  const [paguNominal, setPaguNominal] = useState('Rp 12.500.000.000');

  const insertSnippet = (snippet: string) => {
    setHtmlCode(prev => prev + '\n' + snippet);
    toast.success('Komponen baru berhasil ditambahkan!');
  };

  const execFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (visualEditorRef.current) {
      setHtmlCode(visualEditorRef.current.innerHTML);
    }
  };

  // Quick Action Snippet Generators
  const addJustifiedParagraph = () => {
    insertSnippet('<p style="text-align: justify;">Tuliskan isi paragraf surat di sini dengan perataan rata kiri-kanan (justified)...</p>');
  };

  const addIndentedParagraph = () => {
    insertSnippet('<p style="text-align: justify; text-indent: 30pt;">Tuliskan paragraf menjorok ke dalam (first-line indent) di sini...</p>');
  };

  const addSubParagraphIndent = () => {
    insertSnippet('<p style="text-align: justify; margin: 0; padding-left: 30pt;">Tuliskan sub-paragraf dengan margin kiri (padding-left 30pt) di sini...</p>');
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

  // Table Generator
  const handleGenerateTable = () => {
    let tableHtml = '';
    
    if (tablePresetType === 'pagu') {
      tableHtml = `<table style="border-collapse: collapse; width: 100%; margin: 12px 0;" border="1">
<tbody>
<tr>
<td style="width: 50%; text-align: center; padding: 6px;"><strong>Kode Unit Kerja</strong></td>
<td style="width: 50%; text-align: center; padding: 6px;"><strong>Nilai Pagu</strong></td>
</tr>
<tr>
<td style="width: 50%; text-align: center; padding: 6px;">${paguUnitCode}</td>
<td style="width: 50%; text-align: center; padding: 6px;">${paguNominal}</td>
</tr>
</tbody>
</table>`;
    } else if (tablePresetType === 'klasifikasi') {
      tableHtml = `<table style="border-collapse: collapse; width: 90%; margin: 12px 0; font-weight: normal;" border="1">
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
</table>`;
    } else {
      tableHtml = `<table style="border-collapse: collapse; width: 100%; margin: 12px 0;" ${tableBorder ? 'border="1"' : 'border="0"'}>\n<tbody>\n`;
      if (tableHeader) {
        tableHtml += '<tr>\n';
        for (let c = 1; c <= tableCols; c++) {
          const colWidth = Math.round(100 / tableCols);
          tableHtml += `  <td style="width: ${colWidth}%; text-align: center; padding: 6px;"><strong>Kolom ${c}</strong></td>\n`;
        }
        tableHtml += '</tr>\n';
      }
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
    }

    insertSnippet(tableHtml);
    setIsTableModalOpen(false);
  };

  // Convert Word (.docx) to HTML using High-Precision Native Engine
  const handleWordFileSelect = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
      toast.error('Harap pilih file dokumen Microsoft Word (.docx)');
      return;
    }

    setIsWordConverting(true);
    const toastId = toast.loading('Mengonversi dokumen Word ke HTML presisi tinggi...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const precisionHtml = await parseDocxToPrecisionOfficeHtml(arrayBuffer);

      setHtmlCode(precisionHtml);
      setEditorMode('visual');
      toast.success(`Berhasil mengonversi "${file.name}"! Tabel, nomor urut, dan format Word telah disempurnakan.`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal mengonversi file Word: ' + err.message, { id: toastId });
    } finally {
      setIsWordConverting(false);
    }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    toast.success('Kode HTML berhasil disalin! Siap dipaste ke mode HTML di WYSIWYG editor kantor Anda.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `surat_clean_html_${new Date().toISOString().slice(0, 10)}.html`;
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
            border-collapse: collapse !important;
            width: 100% !important;
            margin: 12px 0 !important;
          }
          table, th, td {
            border: 1px solid #000000 !important;
          }
          td, th {
            padding: 5px 8px !important;
            font-size: ${fontSize};
          }
          ol, ul {
            margin: 0 0 10pt 0 !important;
            padding-left: 24pt !important;
          }
          li {
            margin-bottom: 4pt !important;
            text-align: justify !important;
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
      {/* Hidden File Input for Word Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".docx,.doc"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleWordFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />

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
                Word (.docx) ➔ Precision HTML
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Upload file Word (.docx) atau ketik langsung seperti di Word untuk menghasilkan kode HTML bersumber tabel dan nomor bertingkat yang rapi.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Tombol Lembar Baru / Bersihkan */}
          <button 
            onClick={() => {
              if (!htmlCode.trim() || confirm('Bersihkan lembar kerja dan mulai dari halaman kosong baru?')) {
                setHtmlCode('');
                toast.success('Lembar kerja telah dibersihkan!');
              }
            }}
            className="h-9 px-3 bg-gray-50 hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-600 hover:text-rose-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="Bersihkan lembar kerja untuk memulai dokumen baru"
          >
            <RotateCcw size={13} />
            <span>Lembar Baru</span>
          </button>

          {/* Tombol Upload File Word */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isWordConverting}
            className="h-9 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            title="Upload dokumen Word (.docx) untuk dikonversi otomatis ke format HTML kantor"
          >
            {isWordConverting ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />}
            <span>{isWordConverting ? 'Mengonversi...' : 'Upload Word (.docx)'}</span>
          </button>

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

      {/* 2. PANDUAN CARA PENGGUNAAN CEPAT */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-white p-3.5 px-5 rounded-2xl border border-indigo-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-indigo-950">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
            <HelpCircle size={15} />
          </div>
          <div>
            <span className="font-black text-indigo-900 block">Cara Penggunaan:</span>
            <span className="text-[11px] text-indigo-800 font-medium">
              1. Klik tombol biru <strong>"Upload Word (.docx)"</strong> atau pilih <strong>Template</strong> ➔ 2. Tabel (lengkap nomor urut), list, & teks otomatis terformat ➔ 3. Klik <strong>"Salin Kode HTML"</strong> dan paste ke aplikasi kantor!
            </span>
          </div>
        </div>

        {/* Mode Switcher: Visual Editor vs HTML Source Code */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-indigo-200 shadow-2xs shrink-0">
          <button
            onClick={() => setEditorMode('visual')}
            className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              editorMode === 'visual' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Edit3 size={13} />
            <span>Mode Ketik Visual (Word)</span>
          </button>
          <button
            onClick={() => setEditorMode('code')}
            className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              editorMode === 'code' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Code size={13} />
            <span>Mode Kode HTML</span>
          </button>
        </div>
      </div>

      {/* 3. PRESET TEMPLATES BAR */}
      <div className="bg-white p-3.5 px-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <BookmarkCheck size={16} className="text-indigo-600" />
          <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Template Resmi Siap Pakai:</span>
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

      {/* 4. QUICK INSERT & FORMATTING TOOLBAR */}
      <div className="bg-white p-3 px-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {editorMode === 'visual' && (
            <>
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                <button
                  onClick={() => execFormat('bold')}
                  className="p-1.5 hover:bg-white text-gray-700 rounded transition-colors font-bold cursor-pointer"
                  title="Tebal (Ctrl+B)"
                >
                  <Bold size={13} />
                </button>
                <button
                  onClick={() => execFormat('italic')}
                  className="p-1.5 hover:bg-white text-gray-700 rounded transition-colors italic cursor-pointer"
                  title="Miring (Ctrl+I)"
                >
                  <Italic size={13} />
                </button>
                <button
                  onClick={() => execFormat('underline')}
                  className="p-1.5 hover:bg-white text-gray-700 rounded transition-colors underline cursor-pointer"
                  title="Garis Bawah (Ctrl+U)"
                >
                  <Underline size={13} />
                </button>
              </div>

              <div className="h-4 w-[1px] bg-gray-200 mx-1" />
            </>
          )}

          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 mr-1">Sisipkan:</span>

          <button 
            onClick={() => setIsTableModalOpen(true)} 
            className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer active:scale-95"
            title="Buka Generator Tabel Surat Resmi"
          >
            <TableIcon size={13} />
            <span>+ Tabel Surat Resmi</span>
          </button>

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
            <span>Menjorok (Indent)</span>
          </button>

          <button 
            onClick={addSubParagraphIndent} 
            className="h-7 px-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Sub-Paragraf dengan Padding Kiri 30pt"
          >
            <span>Sub-Indent (30pt)</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

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
        </div>

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

      {/* 5. MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PANEL KIRI: VISUAL KERTAS WORD / EDITOR KODE */}
        <div className={editorMode === 'visual' ? 'lg:col-span-8' : 'lg:col-span-6'}>
          <div className="bg-slate-100 rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col min-h-[780px]">
            {/* Header Panel */}
            <div className="p-3 px-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editorMode === 'visual' ? (
                  <>
                    <Edit3 size={15} className="text-indigo-600" />
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Lembar Kertas Surat (Ketik Langsung / Edit Bebas)
                    </span>
                  </>
                ) : (
                  <>
                    <Code size={15} className="text-indigo-600" />
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                      Editor Kode Sumber HTML
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md font-bold">
                {editorMode === 'visual' ? 'Mode Interaktif Aktif' : 'Raw HTML Code'}
              </span>
            </div>

            {/* Content Area */}
            {editorMode === 'visual' ? (
              <div className="flex-1 p-4 md:p-6 overflow-y-auto flex justify-center bg-slate-200/70">
                <div className="bg-white w-full max-w-[760px] min-h-[920px] p-8 md:p-14 rounded-xl shadow-lg border border-gray-300 transition-all text-gray-900 relative">
                  {!htmlCode.trim() ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[700px] border-2 border-dashed border-indigo-200/80 rounded-2xl p-8 bg-gradient-to-b from-indigo-50/30 to-white text-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
                        <FileUp size={32} />
                      </div>
                      <h3 className="text-base font-black text-gray-900 mb-1">
                        Lembar Kerja Surat Bersih
                      </h3>
                      <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
                        Upload dokumen Word (.docx) Anda atau pilih salah satu template resmi di bawah untuk menghasilkan kode HTML bersumber tabel dan nomor bertingkat yang rapi.
                      </p>

                      <div className="flex flex-wrap justify-center gap-3 mb-6">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isWordConverting}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {isWordConverting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                          <span>Upload Dokumen Word (.docx)</span>
                        </button>
                        <button
                          onClick={() => {
                            setHtmlCode('<p style="text-align: justify; font-family: \'Times New Roman\', Times, serif; font-size: 12pt; margin: 0 0 10pt 0;">Tuliskan isi surat resmi di sini...</p>');
                            toast.success('Lembar pengetikan siap!');
                          }}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Edit3 size={14} />
                          <span>Mulai Ketik Manual</span>
                        </button>
                      </div>

                      <div className="pt-4 border-t border-indigo-100 w-full max-w-md">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2.5">
                          Atau Muat Template Siap Pakai:
                        </span>
                        <div className="flex flex-wrap justify-center gap-2">
                          {TEMPLATE_PRESETS.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setHtmlCode(preset.html);
                                toast.success(`Template ${preset.name} dimuat!`);
                              }}
                              className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-[11px] font-bold text-gray-600 hover:text-indigo-600 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Sparkles size={11} className="text-amber-500" />
                              <span>{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={visualEditorRef}
                      contentEditable
                      onInput={handleVisualInput}
                      suppressContentEditableWarning
                      className="surat-rendered-content focus:outline-none min-h-[800px]"
                      style={{
                        fontFamily: fontFamily === 'serif' ? "'Times New Roman', Times, serif" : "Arial, 'Segoe UI', sans-serif",
                        fontSize: fontSize,
                        lineHeight: lineSpacing
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 flex-1 flex flex-col bg-slate-900">
                <textarea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  placeholder="Ketik atau paste format HTML surat di sini..."
                  className="w-full flex-1 p-4 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed rounded-xl border-none outline-none resize-none selection:bg-indigo-600 selection:text-white"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Footer Panel */}
            <div className="p-3 px-4 border-t border-gray-200 bg-white flex justify-between items-center text-[11px] text-gray-500 font-medium">
              <span>
                {editorMode === 'visual' 
                  ? '💡 Anda bisa langsung klik teks atau tabel di atas untuk mengubah isinya seperti di Word.' 
                  : 'Salin kode ini lalu paste pada mode "Source / HTML" di aplikasi kantor Anda.'}
              </span>
              <button
                onClick={() => {
                  if (confirm('Kosongkan lembar kerja?')) {
                    setHtmlCode('');
                  }
                }}
                className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
              >
                Reset Kosong
              </button>
            </div>
          </div>
        </div>

        {/* PANEL KANAN: OUTPUT KODE HTML BERSIH & LIVE COPY */}
        <div className={editorMode === 'visual' ? 'lg:col-span-4' : 'lg:col-span-6'}>
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden flex flex-col h-full min-h-[780px]">
            <div className="p-3 px-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Code size={15} className="text-indigo-600" />
                <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Output Kode HTML Siap Salin</span>
              </div>
              <button
                onClick={handleCopyHtml}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <div className="p-3 flex-1 flex flex-col bg-slate-950">
              <div className="text-[10px] text-slate-400 font-mono pb-2 border-b border-slate-800 flex justify-between">
                <span>FORMAT HTML CLEAN</span>
                <span>{htmlCode.length} Karakter</span>
              </div>
              <textarea
                readOnly
                value={htmlCode}
                className="w-full flex-1 pt-3 bg-transparent text-emerald-400 font-mono text-[11px] leading-relaxed border-none outline-none resize-none selection:bg-indigo-600 selection:text-white"
                spellCheck={false}
              />
            </div>

            <div className="p-3 px-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[11px] text-gray-500 font-medium">
              <span>100% Kompatibel dengan WYSIWYG Editor Kantor.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. MODAL BUILDER TABEL SURAT INTERAKTIF */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="p-4 px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <TableIcon size={18} />
                </div>
                <h3 className="text-sm font-black text-gray-900">Pembuat Tabel Surat Resmi</h3>
              </div>
              <button 
                onClick={() => setIsTableModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Pilih Model Tabel Surat:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTablePresetType('pagu')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      tablePresetType === 'pagu' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-black">1. Tabel Pagu RKAT</div>
                    <div className="text-[10px] font-medium text-gray-500 mt-0.5">Kode Unit & Nilai Pagu</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTablePresetType('klasifikasi')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      tablePresetType === 'klasifikasi' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-black">2. Akun 51-54</div>
                    <div className="text-[10px] font-medium text-gray-500 mt-0.5">Tabel Penyesuaian</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTablePresetType('custom')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      tablePresetType === 'custom' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-black">3. Tabel Kustom</div>
                    <div className="text-[10px] font-medium text-gray-500 mt-0.5">Atur Baris & Kolom</div>
                  </button>
                </div>
              </div>

              {tablePresetType === 'pagu' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500">Kode Unit Kerja:</label>
                      <input 
                        type="text" 
                        value={paguUnitCode} 
                        onChange={(e) => setPaguUnitCode(e.target.value)} 
                        className="w-full h-8 px-2.5 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold"
                        placeholder="010101"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-gray-500">Nilai Penetapan Pagu:</label>
                      <input 
                        type="text" 
                        value={paguNominal} 
                        onChange={(e) => setPaguNominal(e.target.value)} 
                        className="w-full h-8 px-2.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-emerald-700"
                        placeholder="Rp 12.500.000.000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {tablePresetType === 'custom' && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
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
                        className="w-full h-8 px-3 border border-gray-300 rounded-lg text-xs font-bold bg-white" 
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
                        className="w-full h-8 px-3 border border-gray-300 rounded-lg text-xs font-bold bg-white" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-gray-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tableHeader} 
                        onChange={(e) => setTableHeader(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600" 
                      />
                      <span className="text-xs font-bold text-gray-700">Baris Judul Header Tebal</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tableBorder} 
                        onChange={(e) => setTableBorder(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600" 
                      />
                      <span className="text-xs font-bold text-gray-700">Garis Tabel Penuh (border="1")</span>
                    </label>
                  </div>
                </div>
              )}
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
                <span>Sisipkan Tabel Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CSS KHUSUS UNTUK SURAT RESMI, TABEL, DAN NUMBERING */}
      <style jsx global>{`
        .surat-rendered-content {
          color: #000000 !important;
          line-height: 1.35 !important;
        }
        .surat-rendered-content p {
          margin-top: 0 !important;
          margin-bottom: 10pt !important;
          text-align: justify !important;
        }
        .surat-rendered-content table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin-top: 10pt !important;
          margin-bottom: 12pt !important;
          border: 1px solid #000000 !important;
        }
        .surat-rendered-content table tr td,
        .surat-rendered-content table tr th {
          border: 1px solid #000000 !important;
          padding: 6px 10px !important;
          vertical-align: top !important;
        }
        .surat-rendered-content table tr th {
          font-weight: bold !important;
          background-color: transparent !important;
        }
        .surat-rendered-content ol {
          margin-top: 4pt !important;
          margin-bottom: 10pt !important;
          padding-left: 26pt !important;
          list-style-position: outside !important;
        }
        .surat-rendered-content ol[style*="upper-roman"],
        .surat-rendered-content ol[style*="UPPER-ROMAN"] {
          list-style-type: upper-roman !important;
        }
        .surat-rendered-content ol[style*="lower-alpha"],
        .surat-rendered-content ol[style*="LOWER-ALPHA"] {
          list-style-type: lower-alpha !important;
        }
        .surat-rendered-content ul {
          margin-top: 4pt !important;
          margin-bottom: 10pt !important;
          padding-left: 26pt !important;
          list-style-type: disc !important;
          list-style-position: outside !important;
        }
        .surat-rendered-content li {
          margin-bottom: 4pt !important;
          text-align: justify !important;
        }
      `}</style>
    </div>
  );
}
