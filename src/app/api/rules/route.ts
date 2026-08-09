import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('rules').select('*').order('priority', { ascending: true });
    if (error) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Handling Bulk TSV Import
    if (body.rawText) {
      const lines = body.rawText.trim().split('\n');
      if (lines.length === 0) {
        return NextResponse.json({ success: false, error: 'Teks kosong' }, { status: 400 });
      }

      let hasHeader = false;
      let headers: string[] = [];
      const firstLineCells = lines[0].split('\t').map((h: string) => h.trim().toLowerCase());

      if (firstLineCells.some((c: string) => c.includes('unit') || c.includes('akun') || c.includes('kunci') || c.includes('keyword') || c.includes('level') || c.includes('priority') || c.includes('status'))) {
        hasHeader = true;
        headers = firstLineCells;
      }

      const findIndex = (keywords: string[], defaultIdx: number) => {
        if (!hasHeader) return defaultIdx;
        const idx = headers.findIndex((h: string) => keywords.some((k: string) => h.includes(k)));
        return idx !== -1 ? idx : defaultIdx;
      };

      const unitIdx = findIndex(['unit', 'unitkerja'], 0);
      const akunIdx = findIndex(['akun', 'kode'], 1);
      const keywordIdx = findIndex(['kunci', 'keyword', 'deskripsi'], 2);
      const priorityIdx = findIndex(['level', 'priority', 'prioritas'], 3);
      const statusIdx = findIndex(['status', 'label'], 4);

      const rulesToInsert = [];
      const startIndex = hasHeader ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cells = lines[i].split('\t');

        const uVal = cells[unitIdx]?.trim();
        const aVal = cells[akunIdx]?.trim();
        const kVal = cells[keywordIdx]?.trim() || '';
        const pVal = parseInt(cells[priorityIdx]?.trim() || '99') || 99;
        const sVal = cells[statusIdx]?.trim() || 'Wajib';

        const cleanAkun = aVal && aVal !== '*' ? aVal.replace(/\*/g, '').trim() : null;
        const cleanKeyword = kVal.replace(/\*/g, '').trim();

        rulesToInsert.push({
          unitkerja_nama: !uVal || uVal === '*' ? null : uVal,
          akun: cleanAkun,
          operator: 'CONTAINS',
          kata_kunci_deskripsi: cleanKeyword,
          priority: pVal,
          custom_status: sVal
        });
      }

      if (rulesToInsert.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada baris aturan valid' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin.from('rules').insert(rulesToInsert).select();
      if (error) throw new Error(error.message);
      return NextResponse.json({ success: true, count: rulesToInsert.length, data });
    }

    // 2. Handling Single Rule Insertion
    const { unitkerja_nama, akun, kata_kunci_deskripsi, priority, custom_status } = body;
    const cleanAkun = akun && akun !== '*' ? akun.replace(/\*/g, '').trim() : null;
    const cleanKeyword = kata_kunci_deskripsi ? kata_kunci_deskripsi.replace(/\*/g, '').trim() : '';

    const { data, error } = await supabaseAdmin.from('rules').insert([{ 
      unitkerja_nama: unitkerja_nama === '*' ? null : unitkerja_nama, 
      akun: cleanAkun, 
      operator: 'CONTAINS',
      kata_kunci_deskripsi: cleanKeyword,
      priority: priority ? parseInt(priority) : 99,
      custom_status: custom_status || null
    }]).select();
    
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, unitkerja_nama, akun, kata_kunci_deskripsi, priority, custom_status } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID aturan harus diisi' }, { status: 400 });
    }

    const cleanAkun = akun && akun !== '*' ? akun.replace(/\*/g, '').trim() : null;
    const cleanKeyword = kata_kunci_deskripsi ? kata_kunci_deskripsi.replace(/\*/g, '').trim() : '';

    const { data, error } = await supabaseAdmin.from('rules').update({ 
      unitkerja_nama: !unitkerja_nama || unitkerja_nama === '*' ? null : unitkerja_nama, 
      akun: cleanAkun, 
      kata_kunci_deskripsi: cleanKeyword,
      priority: priority ? parseInt(priority) : 99,
      custom_status: custom_status || null
    }).eq('id', id).select();

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin.from('rules').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
