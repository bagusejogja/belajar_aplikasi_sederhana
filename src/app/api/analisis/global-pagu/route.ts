import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const year = searchParams.get('year') || '2026';

    let targetDate = new Date();
    if (dateStr && dateStr.trim() !== '') {
       targetDate = new Date(dateStr);
    }
    
    // Pastikan valid
    if (isNaN(targetDate.getTime())) {
       targetDate = new Date();
    }

    // Set targetDate to the end of that day (23:59:59.999) to include all records on the same day
    targetDate.setHours(23, 59, 59, 999);

    // Ambil data langsung dari gov_pagu_anggaran yang created_at <= targetDate dan tahun_anggaran == year
    const { data: paguData, error: errPagu } = await supabase
      .from('gov_pagu_anggaran')
      .select('*')
      .eq('tahun_anggaran', year)
      .lte('created_at', targetDate.toISOString());

    if (errPagu) {
      console.error("Error fetching gov_pagu_anggaran:", errPagu);
      return NextResponse.json({ success: false, error: errPagu.message });
    }

    // Lakukan grouping seperti di DataForm.tsx
    const paguTahun = paguData || [];
    const paguAwal = paguTahun.filter((p: any) => p.jenis_anggaran?.toLowerCase() === 'pagu awal').reduce((acc: number, p: any) => acc + Number(p.nominal || 0), 0);
    const paguTambah = paguTahun.filter((p: any) => p.jenis_anggaran?.toLowerCase() === 'tambah').reduce((acc: number, p: any) => acc + Number(p.nominal || 0), 0);
    const paguKurang = paguTahun.filter((p: any) => p.jenis_anggaran?.toLowerCase() === 'kurang').reduce((acc: number, p: any) => acc + Number(p.nominal || 0), 0);
    const paguPengalihan = paguTambah + paguKurang; // kurang sudah bernilai negatif
    const paguTambahPaguPenugasan = paguTahun.filter((p: any) => p.jenis_anggaran?.toLowerCase() === 'tambah pagu - penugasan').reduce((acc: number, p: any) => acc + Number(p.nominal || 0), 0);
    const paguTambahPaguInisiatif = paguTahun.filter((p: any) => p.jenis_anggaran?.toLowerCase() === 'tambah pagu - inisiatif').reduce((acc: number, p: any) => acc + Number(p.nominal || 0), 0);
    const paguEfisiensi = paguTahun.filter((p: any) => p.jenis_anggaran?.toLowerCase() === 'efisiensi').reduce((acc: number, p: any) => acc + Number(p.nominal || 0), 0);
    const paguTalangan = paguTahun.filter((p: any) => p.jenis_anggaran?.toLowerCase() === 'talangan').reduce((acc: number, p: any) => acc + Number(p.nominal || 0), 0);
    const paguTalanganPindah = paguTahun.filter((p: any) => p.jenis_anggaran?.toLowerCase() === 'talangan - pindah dari fakultas').reduce((acc: number, p: any) => acc + Number(p.nominal || 0), 0);

    // Ambil data rencana dan realisasi penerimaan dari data_penerimaan (filter tahun N sampai tanggal creates data)
    const { data: penerimaanData, error: errPenerimaan } = await supabase
      .from('data_penerimaan')
      .select('nominal, tipe_data')
      .eq('tahun', year)
      .in('tipe_data', ['RENCANA', 'REALISASI'])
      .lte('created_at', targetDate.toISOString());
      
    if (errPenerimaan) {
      console.error("Error fetching data_penerimaan:", errPenerimaan);
    }
    
    const rencanaPenerimaan = (penerimaanData || []).filter((row: any) => row.tipe_data === 'RENCANA').reduce((acc: number, row: any) => acc + Number(row.nominal || 0), 0);
    const realisasiPenerimaan = (penerimaanData || []).filter((row: any) => row.tipe_data === 'REALISASI').reduce((acc: number, row: any) => acc + Number(row.nominal || 0), 0);

    // Format menjadi string agar mudah masuk ke state front-end
    const formatRp = (num: number) => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
    };

    return NextResponse.json({
      success: true,
      data: {
        pagu_awal: formatRp(paguAwal),
        pengalihan: formatRp(paguPengalihan),
        tambah_inisiatif: formatRp(paguTambahPaguInisiatif),
        efisiensi: formatRp(paguEfisiensi),
        tambah_penugasan: formatRp(paguTambahPaguPenugasan),
        talangan: formatRp(paguTalangan),
        talangan_pindah: formatRp(paguTalanganPindah),
        rencana_penerimaan: formatRp(rencanaPenerimaan),
        realisasi_penerimaan: formatRp(realisasiPenerimaan)
      }
    });
  } catch (error: any) {
    console.error("Global Pagu API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
