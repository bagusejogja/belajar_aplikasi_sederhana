import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { evaluateWithRuleEngine } from '@/lib/ruleEngine';
import { analyzeBudgetWithAI } from '@/lib/aiReview';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, id_db, unitkerja_nama, akun, komponen_nama, deskripsi, lingkup, maksud_tujuan, 
      vol, tarif, total, kunci, custom_status, kunci_by,
      tahun, kode_nama_indikator, kode_nama_kegiatan, satuan,
      usulan_pagu_indikatif_anggaran_rumus, approval_pagu_indikatif_anggaran_rumus,
      ai_reason
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const volNum = parseFloat(vol) || 1;
    const tarifNum = parseFloat(tarif) || 0;
    let totalNum = parseFloat(total) || 0;
    if (totalNum === 0 && tarifNum > 0) {
      totalNum = volNum * tarifNum;
    }

    // Build update payload
    const updatePayload: any = {};
    if (id_db !== undefined) updatePayload.id_db = id_db || null;
    if (unitkerja_nama !== undefined) updatePayload.unitkerja_nama = unitkerja_nama;
    if (akun !== undefined) updatePayload.akun = akun;
    if (komponen_nama !== undefined) updatePayload.komponen_nama = komponen_nama;
    if (deskripsi !== undefined) updatePayload.deskripsi = deskripsi;
    if (lingkup !== undefined) updatePayload.lingkup = lingkup;
    if (maksud_tujuan !== undefined) updatePayload.maksud_tujuan = maksud_tujuan;
    if (vol !== undefined) updatePayload.vol = volNum;
    if (tarif !== undefined) updatePayload.tarif = tarifNum;
    if (total !== undefined) updatePayload.total = totalNum;

    // Tambahan field baru
    if (tahun !== undefined) updatePayload.tahun = tahun;
    if (kode_nama_indikator !== undefined) updatePayload.kode_nama_indikator = kode_nama_indikator;
    if (kode_nama_kegiatan !== undefined) updatePayload.kode_nama_kegiatan = kode_nama_kegiatan;
    if (satuan !== undefined) updatePayload.satuan = satuan;
    if (usulan_pagu_indikatif_anggaran_rumus !== undefined) updatePayload.usulan_pagu_indikatif_anggaran_rumus = usulan_pagu_indikatif_anggaran_rumus;
    if (approval_pagu_indikatif_anggaran_rumus !== undefined) updatePayload.approval_pagu_indikatif_anggaran_rumus = approval_pagu_indikatif_anggaran_rumus;
    if (ai_reason !== undefined) updatePayload.ai_reason = ai_reason;

    // Hitung Approved Fields jika ada perubahan rumus atau nilai dasar
    if (
      approval_pagu_indikatif_anggaran_rumus !== undefined ||
      vol !== undefined ||
      tarif !== undefined ||
      total !== undefined
    ) {
      const targetApprRumus = approval_pagu_indikatif_anggaran_rumus !== undefined ? approval_pagu_indikatif_anggaran_rumus : null;
      let volAppr = volNum;
      let tarifAppr = tarifNum;
      let totalAppr = totalNum;
      let penyesuaian = 0;

      if (targetApprRumus) {
        // Parse approval formula jika ada
        const matchRes = typeof targetApprRumus === 'string' ? targetApprRumus.match(/"hasil";a:2:\{([^}]+)\}/) : null;
        let qtyStr = '';
        if (matchRes) {
          const regex = /i:(\d+);s:\d+:"([^"]*)"/g;
          let m;
          while ((m = regex.exec(matchRes[1])) !== null) {
            if (m[1] === '0') qtyStr = m[2];
          }
        }
        if (qtyStr) {
          volAppr = parseFloat(qtyStr) || 0;
          totalAppr = volAppr * tarifAppr;
          penyesuaian = totalAppr - totalNum;
        }
      }

      updatePayload.volumen_approved = volAppr;
      updatePayload.tarif_approved = tarifAppr;
      updatePayload.total_approve = totalAppr;
      updatePayload.nominal_penyesuaian = penyesuaian;
    }

    // Jika status dikirim secara eksplisit (misal dari Combo Box Status), langsung simpan!
    if (kunci !== undefined) updatePayload.kunci = kunci;
    if (custom_status !== undefined) updatePayload.custom_status = custom_status;
    if (kunci_by !== undefined) updatePayload.kunci_by = kunci_by;

    const { data: updatedBudget, error: updateError } = await supabaseAdmin
      .from('budgets')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update budget: ${updateError.message}`);
    }

    // Jika perubahan teks deskripsi/komponen dan tidak ditentukan status manual, re-evaluasi di background (asynchronous)
    if (updatedBudget && kunci === undefined && custom_status === undefined) {
      (async () => {
        try {
          const ruleMatch = await evaluateWithRuleEngine(updatedBudget);
          let bgPayload: any = {};
          if (ruleMatch.matched) {
            bgPayload = {
              kunci: 'Y',
              kunci_by: 'RULE',
              custom_status: ruleMatch.custom_status || null,
              ai_reason: null, // Nullkan ai_reason saat match rule
            };
          } else {
            const aiResult = await analyzeBudgetWithAI(updatedBudget);
            if (aiResult) {
              bgPayload = {
                kunci: aiResult.kunci_rekomendasi,
                kunci_by: 'AI',
                ai_confidence: aiResult.confidence_score,
                ai_reason: aiResult.alasan,
              };
            }
          }
          if (Object.keys(bgPayload).length > 0) {
            await supabaseAdmin.from('budgets').update(bgPayload).eq('id', id);
          }
        } catch (e) {
          console.error('Background AI evaluation error:', e);
        }
      })();
    }

    // Kembalikan response INSTAN (<50ms)
    return NextResponse.json({ success: true, data: updatedBudget });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
