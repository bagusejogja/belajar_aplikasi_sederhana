import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { evaluateRulesInMemory } from '@/lib/ruleEngine';

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
      .order('id', { ascending: true });

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

export async function POST() {
  try {
    const startTime = Date.now();

    // 1. Fetch data budgets & rules sekaligus (parallel)
    const [budgets, { data: rules }] = await Promise.all([
      fetchAllBudgetsFromSupabase(),
      supabaseAdmin.from('rules').select('*').order('priority', { ascending: true })
    ]);

    const activeRules = rules || [];
    const updatePayloads: any[] = [];

    // 2. Evaluasi aturan secara serentak di memori (Super Cepat < 10ms)
    for (const budget of budgets) {
      const ruleMatch = evaluateRulesInMemory(budget, activeRules);
      
      if (ruleMatch.matched) {
        // Cocok dengan Master Rule (Reff) -> Otomatis Wajib Ada (RULE)
        if (budget.kunci_by !== 'RULE' || budget.custom_status !== ruleMatch.custom_status || budget.kunci !== 'Y') {
          updatePayloads.push({
            ...budget,
            kunci: 'Y',
            kunci_by: 'RULE',
            custom_status: ruleMatch.custom_status || 'Wajib Ada',
            ai_reason: 'Match exact rule dari Master Aturan'
          });
        }
      } else {
        // TIDAK COCOK dengan Master Rule manapun saat ini:
        // Jika sebelumnya terkunci oleh RULE atau AI, reset kembali ke BEBAS (N)
        if (budget.kunci_by === 'RULE' || budget.kunci_by === 'AI' || (!budget.kunci_by && budget.ai_confidence)) {
          if (budget.kunci !== 'N' || budget.kunci_by === 'RULE' || (budget.custom_status && budget.custom_status !== '')) {
            updatePayloads.push({
              ...budget,
              kunci: 'N', // RESET STATUS FINAL MENJADI BEBAS (N)
              kunci_by: budget.ai_confidence ? 'AI' : null,
              custom_status: ''
            });
          }
        }
      }
    }

    // 3. Lakukan Batch Upsert dalam batch 500 item per request
    if (updatePayloads.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < updatePayloads.length; i += batchSize) {
        const chunk = updatePayloads.slice(i, i + batchSize);
        await supabaseAdmin.from('budgets').upsert(chunk, { onConflict: 'id' });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Re-evaluate finished: ${updatePayloads.length} items updated out of ${budgets.length} in ${duration}s`);

    return NextResponse.json({ 
      success: true, 
      count: updatePayloads.length,
      totalBudgets: budgets.length,
      duration: `${duration}s`
    });

  } catch (err: any) {
    console.error('Re-evaluate error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
