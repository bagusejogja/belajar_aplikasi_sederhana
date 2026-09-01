import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function parsePhpFormula(str: string | null | undefined): { totalQty: string; totalUnit: string } | null {
  if (!str || typeof str !== 'string') return null;
  try {
    const resMatch = str.match(/"hasil";a:2:\{([^}]+)\}/);
    let totalQty = '';
    let totalUnit = '';
    if (resMatch) {
      const regex = /i:(\d+);s:\d+:"([^"]*)"/g;
      let m;
      while ((m = regex.exec(resMatch[1])) !== null) {
        if (m[1] === '0') totalQty = m[2];
        if (m[1] === '1') totalUnit = m[2];
      }
    }
    return { totalQty, totalUnit };
  } catch (e) {
    return null;
  }
}

async function fetchAllBudgets() {
  let all: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

export async function POST() {
  try {
    const budgets = await fetchAllBudgets();
    const updates: any[] = [];
    let nulledAiReasonCount = 0;

    for (const b of budgets) {
      const usulanNominal = Number(b.total) || 0;
      let volAppr = Number(b.vol) || 0;
      let tarifAppr = Number(b.tarif) || 0;
      let totalAppr = usulanNominal;
      let penyesuaian = 0;

      if (b.approval_pagu_indikatif_anggaran_rumus) {
        const parsedAppr = parsePhpFormula(b.approval_pagu_indikatif_anggaran_rumus);
        if (parsedAppr) {
          const qtyAppr = parseFloat(parsedAppr.totalQty) || 0;
          const usulanFormula = parsePhpFormula(b.usulan_pagu_indikatif_anggaran_rumus);
          const usulanQty = usulanFormula ? parseFloat(usulanFormula.totalQty) || Number(b.vol) || 1 : Number(b.vol) || 1;
          const usulanTarif = (Number(b.total) > 0 && usulanQty > 0) ? (Number(b.total) / usulanQty) : (Number(b.tarif) || 0);
          tarifAppr = Number(b.tarif) || usulanTarif;
          volAppr = qtyAppr;
          totalAppr = qtyAppr * tarifAppr;
          penyesuaian = totalAppr - usulanNominal;
        }
      }

      let aiReason = b.ai_reason;
      if (aiReason && typeof aiReason === 'string' && aiReason.includes('Match exact rule dari Master Aturan')) {
        aiReason = null;
        nulledAiReasonCount++;
      }

      updates.push({
        ...b,
        tarif_approved: tarifAppr,
        volumen_approved: volAppr,
        total_approve: totalAppr,
        nominal_penyesuaian: penyesuaian,
        ai_reason: aiReason
      });
    }

    const chunkSize = 100;
    let successCount = 0;

    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      const { error } = await supabaseAdmin.from('budgets').upsert(chunk, { onConflict: 'id' });
      if (error) {
        throw error;
      }
      successCount += chunk.length;
    }

    return NextResponse.json({
      success: true,
      totalBudgets: budgets.length,
      updatedCount: successCount,
      nulledAiReasonCount
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
