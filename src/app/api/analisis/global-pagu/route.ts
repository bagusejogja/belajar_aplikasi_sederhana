import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper parse num
const parseNum = (val: any) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val.toString().replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]+/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

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

    // 1. Ambil semua analisis yang dibuat <= targetDate
    const { data: allAnalisis, error: errAnalisis } = await supabase
      .from('app_analisis_utama')
      .select('id_analisis, unit_kerja, created_at')
      .lte('created_at', targetDate.toISOString())
      .order('created_at', { ascending: false });

    if (errAnalisis) {
      console.error(Error fetching analisis:, errAnalisis);
      return NextResponse.json({ success: false, error: errAnalisis.message });
    }

    if (!allAnalisis || allAnalisis.length === 0) {
      return NextResponse.json({
        success: true,
        data: { pagu_awal: 0, pengalihan: 0, tambah_inisiatif: 0, efisiensi: 0, tambah_penugasan: 0, talangan: 0 }
      });
    }

    // 2. Filter id_analisis terbaru per unit_kerja
    const latestPerUnit = new Map<string, string>(); // unit_kerja -> id_analisis
    for (const anl of allAnalisis) {
       const unit = anl.unit_kerja || 'UNKNOWN_UNIT';
       if (!latestPerUnit.has(unit)) {
          latestPerUnit.set(unit, anl.id_analisis);
       }
    }

    const latestIds = Array.from(latestPerUnit.values());

    if (latestIds.length === 0) {
        return NextResponse.json({
            success: true,
            data: { pagu_awal: 0, pengalihan: 0, tambah_inisiatif: 0, efisiensi: 0, tambah_penugasan: 0, talangan: 0 }
        });
    }

    // 3. Ambil pagu_historis berdasarkan id_analisis yang valid dan tahun yang diminta
    const { data: paguData, error: errPagu } = await supabase
      .from('app_pagu_historis')
      .select('*')
      .eq('tahun', year)
      .in('id_analisis', latestIds);

    if (errPagu) {
      console.error(Error fetching pagu historis:, errPagu);
      return NextResponse.json({ success: false, error: errPagu.message });
    }

    // 4. Sum up the values
    let totalPaguAwal = 0;
    let totalPengalihan = 0;
    let totalInisiatif = 0;
    let totalEfisiensi = 0;
    let totalPenugasan = 0;
    let totalTalangan = 0;

    for (const row of (paguData || [])) {
        totalPaguAwal += parseNum(row.pagu_awal);

        // Parse JSON tambah
        let parsedTambah: any = {};
        try {
            if (row.tambah && row.tambah.startsWith('{')) {
                parsedTambah = JSON.parse(row.tambah);
            }
        } catch(e) {}

        totalPengalihan += parseNum(parsedTambah.pengalihan);
        totalInisiatif += parseNum(parsedTambah.tambah_inisiatif);
        totalEfisiensi += parseNum(parsedTambah.efisiensi);
        totalPenugasan += parseNum(parsedTambah.tambah_penugasan);
        totalTalangan += parseNum(parsedTambah.talangan);
    }

    // Format menjadi string agar mudah masuk ke state front-end
    const formatRp = (num: number) => {
        return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(num);
    };

    return NextResponse.json({
      success: true,
      data: {
        pagu_awal: formatRp(totalPaguAwal),
        pengalihan: formatRp(totalPengalihan),
        tambah_inisiatif: formatRp(totalInisiatif),
        efisiensi: formatRp(totalEfisiensi),
        tambah_penugasan: formatRp(totalPenugasan),
        talangan: formatRp(totalTalangan)
      }
    });
  } catch (error: any) {
    console.error(Global Pagu API error:, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
