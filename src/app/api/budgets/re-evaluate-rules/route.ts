import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { evaluateWithRuleEngine } from '@/lib/ruleEngine';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1] || '';
    
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: budgets, error } = await supabaseUser.from('budgets').select('*');
    if (error) throw error;

    let updatedCount = 0;

    for (const budget of budgets) {
      const ruleMatch = await evaluateWithRuleEngine(budget);
      
      if (ruleMatch.matched) {
        if (budget.kunci_by !== 'RULE' || budget.custom_status !== ruleMatch.custom_status) {
           await supabaseUser.from('budgets').update({
              kunci: 'Y',
              kunci_by: 'RULE',
              custom_status: ruleMatch.custom_status || null,
              ai_confidence: null,
              ai_reason: 'Match exact rule dari Master Aturan'
           }).eq('id', budget.id);
           updatedCount++;
        }
      } else {
        if (budget.kunci_by === 'RULE') {
           // Rule dihapus atau tidak cocok lagi, kembalikan ke N dan minta AI untuk review ulang
           await supabaseUser.from('budgets').update({
              kunci: 'N',
              kunci_by: null,
              custom_status: null
           }).eq('id', budget.id);
           
           const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
           fetch(`${baseUrl}/api/budgets/review`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(budget)
           }).catch(console.error);

           updatedCount++;
        }
      }
    }

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
