import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { evaluateWithRuleEngine } from '@/lib/ruleEngine';
import { analyzeBudgetWithAI } from '@/lib/aiReview';

export async function POST(request: Request) {
  try {
    const budgetData = await request.json();

    // 1. Simpan Data Awal ke Supabase (jika belum ada ID)
    // Dalam implementasi nyata, ini mungkin dipisahkan antara insert usulan vs trigger review.
    // Untuk tujuan ini, kita anggap usulan sudah ada dan kita hanya melakukan review.

    // 2. Rule Engine Check
    const ruleMatch = await evaluateWithRuleEngine(budgetData);

    let updatePayload: any = {};

    if (ruleMatch.matched) {
      updatePayload = {
        kunci: 'Y',
        kunci_by: 'RULE',
        custom_status: ruleMatch.custom_status || null,
        ai_confidence: null,
        ai_reason: 'Match exact rule dari Master Aturan',
      };
    } else {
      // 3. AI Review Process
      const aiResult = await analyzeBudgetWithAI(budgetData);
      
      if (aiResult) {
        updatePayload = {
          kunci: aiResult.kunci_rekomendasi,
          kunci_by: 'AI',
          ai_confidence: aiResult.confidence_score,
          ai_reason: aiResult.alasan,
        };
      } else {
        // Fallback jika AI gagal
        updatePayload = {
          kunci: 'N',
          kunci_by: 'MANUAL',
          ai_reason: 'AI Review failed',
        };
      }
    }

    // 4. Update ke Database
    if (budgetData.id) {
      const { error } = await supabaseAdmin
        .from('budgets')
        .update(updatePayload)
        .eq('id', budgetData.id);

      if (error) {
        throw new Error(`Failed to update budget: ${error.message}`);
      }
    }

    return NextResponse.json({ success: true, result: updatePayload });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
