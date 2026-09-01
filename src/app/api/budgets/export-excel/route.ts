import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function fetchAllBudgetsFromSupabase() {
  let allBudgets: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      hasMore = false;
      break;
    }

    allBudgets = allBudgets.concat(data);

    if (data.length < pageSize) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return allBudgets;
}

export async function GET() {
  try {
    const budgets = await fetchAllBudgetsFromSupabase();
    const rows = budgets || [];

    const headers = [
      'id_db',
      'unitkerja_nama',
      'akun',
      'komponen_nama',
      'deskripsi',
      'lingkup',
      'maksud_tujuan',
      'vol',
      'tarif',
      'total',
      'volumen_approved',
      'tarif_approved',
      'total_approve',
      'nominal_penyesuaian',
      'kunci',
      'kunci_by',
      'custom_status',
      'ai_confidence',
      'ai_reason',
      'created_at'
    ];

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(b => [
        (b.id_db || '').toString().replace(/\t/g, ' '),
        (b.unitkerja_nama || '').toString().replace(/\t/g, ' '),
        (b.akun || '').toString().replace(/\t/g, ' '),
        (b.komponen_nama || '').toString().replace(/\t/g, ' '),
        (b.deskripsi || '').toString().replace(/\t/g, ' '),
        (b.lingkup || '').toString().replace(/\t/g, ' '),
        (b.maksud_tujuan || '').toString().replace(/\t/g, ' '),
        b.vol || 1,
        b.tarif || 0,
        b.total || 0,
        b.volumen_approved !== undefined && b.volumen_approved !== null ? b.volumen_approved : (b.vol || 1),
        b.tarif_approved !== undefined && b.tarif_approved !== null ? b.tarif_approved : (b.tarif || 0),
        b.total_approve !== undefined && b.total_approve !== null ? b.total_approve : (b.total || 0),
        b.nominal_penyesuaian !== undefined && b.nominal_penyesuaian !== null ? b.nominal_penyesuaian : 0,
        b.kunci || 'N',
        b.kunci_by || '-',
        (b.custom_status || '').toString().replace(/\t/g, ' '),
        b.ai_confidence || '',
        (b.ai_reason || '').toString().replace(/\t/g, ' '),
        b.created_at || ''
      ].join('\t'))
    ].join('\r\n');

    return new Response('\uFEFF' + tsvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="budgets_live_export.csv"',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    return new Response('Error exporting data: ' + error.message, { status: 500 });
  }
}
