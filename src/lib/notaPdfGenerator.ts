import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { renderWysiwygToPdf } from '@/lib/pdfRenderer';
import { supabase } from '@/lib/supabase';

export async function generateNotaAnalisisPdfBlob(
  mainData: any,
  detailDataInput?: any[],
  historisDataInput?: any[],
  detailInisiatifInput?: any[],
  detailPenugasanInput?: any[]
): Promise<string> {
  let detailData = detailDataInput || [];
  let historisData = historisDataInput || [];
  let detailInisiatif = detailInisiatifInput || [];
  let detailPenugasan = detailPenugasanInput || [];

  // Fetch missing detail / historis data from Supabase if not provided
  try {
    if ((!detailData || detailData.length === 0) && mainData?.id_analisis) {
      const { data } = await supabase
        .from('app_detail_realisasi')
        .select('*')
        .eq('id_analisis', mainData.id_analisis)
        .order('no_urut', { ascending: true });
      if (data) detailData = data;
    }

    if ((!historisData || historisData.length === 0) && mainData?.id_analisis) {
      const { data } = await supabase
        .from('app_pagu_historis')
        .select('*')
        .eq('id_analisis', mainData.id_analisis)
        .order('tahun', { ascending: true });
      if (data) historisData = data;
    }

    if ((!detailInisiatif || detailInisiatif.length === 0 || !detailPenugasan || detailPenugasan.length === 0) && mainData?.unit_pengirim) {
      const { data: unitsData } = await supabase
        .from('gov_units')
        .select('id')
        .ilike('nama_unit', `%${mainData.unit_pengirim}%`)
        .limit(1);

      if (unitsData && unitsData.length > 0) {
        const unitId = unitsData[0].id;
        const [inisiatifRes, penugasanRes] = await Promise.all([
          supabase
            .from('gov_pagu_anggaran')
            .select('id, keterangan, nominal, status_pagu, tahun_anggaran, created_at')
            .eq('unit_id', unitId)
            .eq('jenis_anggaran', 'Tambah Pagu - Inisiatif')
            .eq('tahun_anggaran', '2026')
            .order('tahun_anggaran', { ascending: false }),
          supabase
            .from('gov_pagu_anggaran')
            .select('id, keterangan, nominal, status_pagu, tahun_anggaran, created_at')
            .eq('unit_id', unitId)
            .eq('jenis_anggaran', 'Tambah Pagu - Penugasan')
            .eq('tahun_anggaran', '2026')
            .order('tahun_anggaran', { ascending: false })
        ]);

        let tsAnalisis = 0;
        if (mainData?.id_analisis?.startsWith('ANL-')) {
          tsAnalisis = parseInt(mainData.id_analisis.split('-')[1]) || 0;
        }
        const maxTime = tsAnalisis > 0 ? tsAnalisis + 86400000 : Date.now();

        if (inisiatifRes.data && (!detailInisiatif || detailInisiatif.length === 0)) {
          detailInisiatif = inisiatifRes.data.filter(d => !d.created_at || new Date(d.created_at).getTime() <= maxTime);
        }
        if (penugasanRes.data && (!detailPenugasan || detailPenugasan.length === 0)) {
          detailPenugasan = penugasanRes.data.filter(d => !d.created_at || new Date(d.created_at).getTime() <= maxTime);
        }
      }
    }
  } catch (err) {
    console.warn('Gagal memuat detail data tambahan untuk PDF:', err);
  }

  const doc = new jsPDF('p', 'mm', 'a4');

  // Header Line
  doc.setFillColor(37, 99, 235); // Blue line
  doc.rect(15, 10, 180, 2, 'F');

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('NOTA ANALISIS USULAN PAGU ANGGARAN', 105, 20, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Helper for Section Header
  const addSectionHeader = (title: string, y: number) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFillColor(243, 244, 246);
    doc.rect(15, y - 5, 180, 8, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 17, y + 0.5);
    return y + 8;
  };

  let startY = 30;

  const parseNum = (str: string | number) => {
    if (typeof str === 'number') return isNaN(str) ? 0 : str;
    let s = (str || '0').toString().trim();
    if (!s.includes(',') && s.includes('.')) {
      const parts = s.split('.');
      if (parts.length === 2 && (parts[1].length !== 3 || parts[0].length > 3)) {
        return parseFloat(s) || 0;
      }
    }
    const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned.replace(/[^0-9.-]+/g, '')) || 0;
  };
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);

  let tanggalInput = '';
  let bulanSebelum = '';
  if (mainData?.id_analisis && mainData.id_analisis.startsWith('ANL-')) {
    const ts = parseInt(mainData.id_analisis.split('-')[1]);
    if (!isNaN(ts)) {
      const d = new Date(ts);
      tanggalInput = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

      const d2 = new Date(ts);
      d2.setMonth(d2.getMonth() - 1);
      bulanSebelum = d2.toLocaleDateString('id-ID', { month: 'long' });
    }
  } else if (mainData?.created_at) {
    const d = new Date(mainData.created_at);
    tanggalInput = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const targetYear = '2026';
  const historisYearRow = historisData?.find((d: any) => d.tahun === targetYear) || historisData?.[historisData.length - 1] || {};
  const totalRealisasiDetail = detailData?.reduce((acc: number, d: any) => acc + parseNum(d.realisasi), 0) || 0;

  // 1. DETAIL PAGU KESELURUHAN TAHUN BERJALAN
  let pBerjalan = mainData?.pagu_berjalan;
  if (!pBerjalan || Object.keys(pBerjalan).length === 0) {
    const raw = mainData?.raw_analisis_html || mainData?.analisis_html;
    if (raw) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed?.pagu_berjalan) pBerjalan = parsed.pagu_berjalan;
      } catch (e) {}
    }
  }
  pBerjalan = pBerjalan || {};

  const cPaguAwal = parseNum(pBerjalan.pagu_awal) || parseNum(historisYearRow.pagu_awal) || 0;
  const cPengalihan = parseNum(pBerjalan.pengalihan) || parseNum(historisYearRow.pengalihan) || 0;
  const cInisiatif = parseNum(pBerjalan.tambah_inisiatif) || parseNum(historisYearRow.tambah_pagu_inisiatif) || 0;
  const cEfisiensi = parseNum(pBerjalan.efisiensi) || parseNum(historisYearRow.efisiensi) || 0;
  const cPenugasan = parseNum(pBerjalan.tambah_penugasan) || parseNum(historisYearRow.tambah_pagu_penugasan) || 0;
  const cLuncuran = parseNum(pBerjalan.luncuran) || parseNum(pBerjalan.talangan_pindah) || parseNum(pBerjalan.talangan) || parseNum(historisYearRow.talangan) || 0;
  const cRencana = parseNum(pBerjalan.rencana_penerimaan) || 0;
  const cRealisasi = parseNum(pBerjalan.realisasi_penerimaan) || 0;
  const cTotal = parseNum(pBerjalan.total_pagu) || (cPaguAwal + cPengalihan + cInisiatif + cEfisiensi + cPenugasan + cLuncuran);
  const cPengeluaran = parseNum(pBerjalan.realisasi_keseluruhan) || parseNum(mainData?.total_realisasi) || totalRealisasiDetail || 0;

  const persentaseTotal = cPaguAwal > 0 ? ((cTotal / cPaguAwal) * 100).toFixed(1) + '%' : '0%';
  const persentaseRealisasi = cRencana > 0 ? ((cRealisasi / cRencana) * 100).toFixed(1) + '%' : (cTotal > 0 ? ((cPengeluaran / cTotal) * 100).toFixed(1) + '%' : '0%');
  const pctPengeluaran = cRealisasi > 0 ? ((cPengeluaran / cRealisasi) * 100).toFixed(1) + '%' : (cTotal > 0 ? ((cPengeluaran / cTotal) * 100).toFixed(1) + '%' : '0%');

  const section1Title = `1. DETAIL PAGU KESELURUHAN TAHUN BERJALAN${tanggalInput ? ` (per ${tanggalInput})` : ''}:`;
  startY = addSectionHeader(section1Title, startY);

  const drawCard = (
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    value: string,
    titleColor: [number, number, number],
    valColor: [number, number, number],
    bgColor: [number, number, number] = [249, 250, 251]
  ) => {
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');
    doc.setFontSize(title.length > 25 ? 6 : 7.5);
    doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x + 3, y + 5);
    doc.setFontSize(9.5);
    doc.setTextColor(valColor[0], valColor[1], valColor[2]);
    doc.text(value, x + w - 3, y + 11, { align: 'right' });
  };

  const cardH = 15;
  const gY = 3;
  let cY = startY + 2;

  // Row 1: Pagu Awal, Total Pagu
  drawCard(15, cY, 88, cardH, 'Pagu Awal', `Rp ${formatRp(cPaguAwal)}`, [255, 255, 255], [255, 255, 255], [245, 158, 11]);
  drawCard(107, cY, 88, cardH, 'Total Pagu', `Rp ${formatRp(cTotal)} (${persentaseTotal})`, [255, 255, 255], [255, 255, 255], [5, 150, 105]);
  cY += cardH + gY;

  // Row 2: Inisiatif, Penugasan, Luncuran
  drawCard(15, cY, 57.3, cardH, 'Tambah Pagu - Inisiatif (+)', `Rp ${formatRp(cInisiatif)}`, [5, 150, 105], [5, 150, 105]);
  drawCard(76.3, cY, 57.3, cardH, 'Tambah Pagu - Penugasan (+)', `Rp ${formatRp(cPenugasan)}`, [5, 150, 105], [5, 150, 105]);
  drawCard(137.6, cY, 57.3, cardH, 'Luncuran (+)', `Rp ${formatRp(cLuncuran)}`, [79, 70, 229], [79, 70, 229]);
  cY += cardH + gY;

  // Row 3: Pengalihan, Efisiensi
  drawCard(15, cY, 88, cardH, 'Pengalihan (+/-)', `Rp ${formatRp(cPengalihan)}`, [107, 114, 128], [17, 24, 39]);
  drawCard(107, cY, 88, cardH, 'Efisiensi (-)', `Rp ${formatRp(cEfisiensi)}`, [225, 29, 72], [225, 29, 72]);
  cY += cardH + gY;

  // Row 4: Rencana Penerimaan, Realisasi Penerimaan, Total Pengeluaran
  drawCard(15, cY, 57.3, cardH, 'RENCANA PENERIMAAN', `Rp ${formatRp(cRencana)}`, [255, 255, 255], [255, 255, 255], [79, 70, 229]);
  drawCard(76.3, cY, 57.3, cardH, `REALISASI PENERIMAAN${bulanSebelum ? ` (per ${bulanSebelum})` : ''}`, `Rp ${formatRp(cRealisasi)} (${persentaseRealisasi})`, [255, 255, 255], [255, 255, 255], [2, 132, 199]);
  drawCard(137.6, cY, 57.3, cardH, 'TOTAL PENGELUARAN', `Rp ${formatRp(cPengeluaran)} (${pctPengeluaran})`, [255, 255, 255], [255, 255, 255], [8, 145, 178]);
  cY += cardH + 10;

  doc.setTextColor(0, 0, 0);
  startY = cY;

  // 2. IDENTITAS SURAT
  startY = addSectionHeader('2. IDENTITAS SURAT & INFORMASI UNIT:', startY);
  doc.setFont('helvetica', 'bold');
  doc.text('Unit', 17, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${mainData.unit_pengirim || '-'}`, 60, startY);
  startY += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('No Surat | Tgl', 17, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${mainData.no_surat || '-'}  |  ${mainData.tanggal_surat || '-' || tanggalInput}`, 60, startY);
  startY += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Perihal', 17, startY);
  doc.setFont('helvetica', 'normal');
  const perihalLines = doc.splitTextToSize(`: ${mainData.perihal || '-'}`, 130);
  doc.text(perihalLines, 60, startY);
  startY += (perihalLines.length * 5) + 1;

  doc.setFont('helvetica', 'bold');
  doc.text('Nominal Usulan', 17, startY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: Rp ${formatRp(parseNum(mainData.total_anggaran || mainData.nominal_diajukan)) || '-'}`, 60, startY);
  startY += 10;

  // 3. RINGKASAN SUBSTANSI
  const substansiContent = mainData.analisis_html || mainData.ringkasan_ai;
  if (substansiContent) {
    let cleanSubstansi = substansiContent;
    if (typeof cleanSubstansi === 'string' && cleanSubstansi.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(cleanSubstansi);
        if (parsed.analisis) cleanSubstansi = parsed.analisis;
      } catch (e) {}
    }

    startY = addSectionHeader('3. RINGKASAN SUBSTANSI:', startY);
    const res = renderWysiwygToPdf({
      doc,
      htmlString: cleanSubstansi,
      x: 17,
      y: startY + 2,
      maxWidth: 176,
      lineHeight: 5,
      fontSize: 10
    });
    startY = res + 10;
  }

  // 4. POSISI PAGU TAHUN 2026
  const bodyPagu = [
    ['Pagu Awal', `Rp ${historisYearRow.pagu_awal || '0'}`],
    ['Pengalihan (+/-)', `Rp ${historisYearRow.pengalihan || '0'}`]
  ];
  if (historisYearRow.tambah_pagu_inisiatif && historisYearRow.tambah_pagu_inisiatif !== '0') {
    bodyPagu.push(['Tambah Pagu Inisiatif +', `+ Rp ${formatRp(Math.abs(parseNum(historisYearRow.tambah_pagu_inisiatif)))}`]);
  }
  if (historisYearRow.tambah_pagu_penugasan && historisYearRow.tambah_pagu_penugasan !== '0') {
    bodyPagu.push(['Tambah Pagu Penugasan +', `+ Rp ${formatRp(Math.abs(parseNum(historisYearRow.tambah_pagu_penugasan)))}`]);
  }
  if (historisYearRow.efisiensi && historisYearRow.efisiensi !== '0') {
    bodyPagu.push(['Efisiensi -', `- Rp ${historisYearRow.efisiensi}`]);
  }
  if (historisYearRow.talangan && historisYearRow.talangan !== '0') {
    bodyPagu.push(['Talangan +', `+ Rp ${historisYearRow.talangan}`]);
  }

  const cTotalPaguHistoris = parseNum(historisYearRow.total_pagu || '0');
  const sisaKapasitasHitung = cTotalPaguHistoris - totalRealisasiDetail;

  bodyPagu.push(['Pagu Sampai Saat Ini', `Rp ${formatRp(cTotalPaguHistoris)}`]);
  bodyPagu.push(['Realisasi S.d. Saat Ini', `Rp ${formatRp(totalRealisasiDetail)}`]);
  bodyPagu.push(['Sisa Kapasitas Pagu', `Rp ${formatRp(sisaKapasitasHitung)}`]);
  bodyPagu.push(['Nominal Usulan Tambahan Pagu (Diajukan)', `Rp ${formatRp(parseNum(mainData.total_anggaran || mainData.nominal_diajukan)) || '0'}`]);

  startY = addSectionHeader(`4. POSISI PAGU TAHUN 2026:`, startY);
  autoTable(doc, {
    startY: startY,
    body: bodyPagu,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'normal', cellWidth: 80 }, 1: { halign: 'right' } },
    didParseCell: function(data) {
      const totalRows = bodyPagu.length;
      const r = data.row.index;
      if (r === totalRows - 4 || r === totalRows - 2 || r === totalRows - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
      if (r === totalRows - 4) data.cell.styles.fillColor = [224, 231, 255];
      if (r === totalRows - 2) data.cell.styles.fillColor = [209, 250, 229];
      if (r === totalRows - 1) data.cell.styles.fillColor = [254, 243, 199];
    }
  });
  startY = (doc as any).lastAutoTable.finalY + 10;

  // 4b. HISTORI USULAN TAMBAH PAGU UNIT KERJA
  if (detailInisiatif.length > 0 || detailPenugasan.length > 0) {
    startY = addSectionHeader(`HISTORI USULAN TAMBAH PAGU UNIT KERJA:`, startY);

    const historiBody: any[] = [];
    let noInisiatif = 1;

    const inisiatifFiltered = detailInisiatif.filter(h => h.tahun_anggaran === '2026' || h.tahun_anggaran === 2026);
    if (inisiatifFiltered.length > 0) {
      historiBody.push([{ content: 'A. Tambah Pagu Inisiatif', colSpan: 3, styles: { fillColor: [224, 231, 255], fontStyle: 'bold' } }]);
      inisiatifFiltered.forEach(h => {
        historiBody.push([
          noInisiatif++,
          `${h.keterangan || '-'}\nTahun: ${h.tahun_anggaran || '-'} | Status: ${h.status_pagu || 'Disetujui'}`,
          `Rp ${formatRp(parseNum(h.nominal || '0'))}`
        ]);
      });
      const totalIni = inisiatifFiltered.reduce((acc, curr) => acc + parseNum(curr.nominal), 0);
      historiBody.push([{ content: 'Total Tambah Pagu Inisiatif:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, `Rp ${formatRp(totalIni)}`]);
    }

    let noPenugasan = 1;
    const penugasanFiltered = detailPenugasan.filter(h => h.tahun_anggaran === '2026' || h.tahun_anggaran === 2026);
    if (penugasanFiltered.length > 0) {
      historiBody.push([{ content: 'B. Tambah Pagu Penugasan', colSpan: 3, styles: { fillColor: [224, 231, 255], fontStyle: 'bold' } }]);
      penugasanFiltered.forEach(h => {
        historiBody.push([
          noPenugasan++,
          `${h.keterangan || '-'}\nTahun: ${h.tahun_anggaran || '-'} | Status: ${h.status_pagu || 'Disetujui'}`,
          `Rp ${formatRp(parseNum(h.nominal || '0'))}`
        ]);
      });
      const totalPenu = penugasanFiltered.reduce((acc, curr) => acc + parseNum(curr.nominal), 0);
      historiBody.push([{ content: 'Total Tambah Pagu Penugasan:', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, `Rp ${formatRp(totalPenu)}`]);
    }

    if (historiBody.length > 0) {
      autoTable(doc, {
        startY: startY,
        head: [['No', 'Uraian / Keterangan Tambah Pagu', 'Nominal (Rp)']],
        body: historiBody,
        theme: 'grid',
        headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 2: { halign: 'right' } }
      });
      startY = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // 5. DATA HISTORIS PAGU MULTI-TAHUN
  if (historisData && historisData.length > 0) {
    const showPenugasan = historisData.some((d: any) => parseNum(d.tambah_pagu_penugasan) > 0);
    const showInisiatif = historisData.some((d: any) => parseNum(d.tambah_pagu_inisiatif) > 0);
    const showEfisiensi = historisData.some((d: any) => parseNum(d.efisiensi) > 0);
    const showTalangan = historisData.some((d: any) => parseNum(d.talangan) > 0);

    const tableHead = ['Tahun', 'Pagu Awal', 'Pengalihan'];
    if (showPenugasan) tableHead.push('+ Pagu Penugasan');
    if (showInisiatif) tableHead.push('+ Pagu Inisiatif');
    if (showEfisiensi) tableHead.push('- Efisiensi');
    if (showTalangan) tableHead.push('+ Talangan');
    tableHead.push('Total Pagu', 'Realisasi', '% Serapan');

    const tableBody = historisData.map((d: any) => {
      const row = [d.tahun, d.pagu_awal, d.pengalihan];
      if (showPenugasan) row.push(d.tambah_pagu_penugasan);
      if (showInisiatif) row.push(d.tambah_pagu_inisiatif);
      if (showEfisiensi) row.push(d.efisiensi);
      if (showTalangan) row.push(d.talangan);
      row.push(d.total_pagu, d.realisasi_historis, d.persen_serapan || '-');
      return row;
    });

    startY = addSectionHeader('5. DATA HISTORIS PAGU MULTI-TAHUN:', startY);
    autoTable(doc, {
      startY: startY,
      head: [tableHead],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
      styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: {
        1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' },
        5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' }, 10: { halign: 'center' }
      }
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 6. DETAIL SERAPAN REALISASI BELANJA
  if (detailData && detailData.length > 0) {
    startY = addSectionHeader('6. DETAIL SERAPAN REALISASI BELANJA TAHUN INI:', startY);
    autoTable(doc, {
      startY: startY,
      head: [['No', 'Uraian Kegiatan', 'Anggaran', 'Realisasi', 'Sisa Anggaran', '% Serapan']],
      body: detailData.map((d: any) => [
        d.no_urut,
        d.uraian_kegiatan,
        formatRp(parseNum(d.anggaran)),
        formatRp(parseNum(d.realisasi)),
        formatRp(parseNum(d.anggaran) - parseNum(d.realisasi)),
        d.persen_serapan
      ]),
      theme: 'grid',
      headStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0] },
      styles: { fontSize: 9 }
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 7. HASIL ANALISIS & REKOMENDASI (Jika ada)
  const rekomendasiText = mainData.rekomendasi_html || mainData.rekomendasi_ai;
  if (rekomendasiText) {
    startY = addSectionHeader('7. HASIL ANALISIS & REKOMENDASI:', startY);
    renderWysiwygToPdf({
      doc,
      htmlString: rekomendasiText,
      x: 17,
      y: startY + 2,
      maxWidth: 176,
      lineHeight: 5,
      fontSize: 10
    });
  }

  const pdfBlob = doc.output('blob');
  return URL.createObjectURL(pdfBlob);
}
