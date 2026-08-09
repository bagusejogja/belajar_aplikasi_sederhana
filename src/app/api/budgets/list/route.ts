import { NextResponse } from 'next/server';
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
    const data = await fetchAllBudgetsFromSupabase();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function DELETE() {
  try {
    const { error } = await supabaseAdmin
      .from('budgets')
      .delete()
      .neq('id', 0);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, message: 'Seluruh data usulan anggaran berhasil dibersihkan' });
  } catch (error: any) {
    console.error('API Clear Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
