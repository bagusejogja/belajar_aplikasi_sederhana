import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const getUnits = searchParams.get('units');

    if (getUnits) {
      // Ambil daftar unit unik dari rkat_pengeluaran untuk autocomplete
      const { data: unitsData, error: uErr } = await supabaseAdmin
        .from('rkat_pengeluaran')
        .select('unit')
        .order('unit');
      if (uErr) throw uErr;

      const uniqueUnits = Array.from(new Set((unitsData || []).map(r => r.unit).filter(Boolean)));
      return NextResponse.json({ success: true, units: uniqueUnits });
    }

    const { data, error } = await supabaseAdmin
      .from('rka_rules')
      .select('*')
      .order('priority', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching rka_rules:', error);
    return NextResponse.json({ success: false, error: error.message, data: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Bulk TSV Import untuk Rules
    if (body.rawText) {
      const lines = body.rawText.trim().split('\n');
      let startIndex = 0;
      const firstLine = lines[0].toLowerCase();
      if (firstLine.includes('unit') || firstLine.includes('kunci') || firstLine.includes('target') || firstLine.includes('klasifikasi') || firstLine.includes('prioritas')) {
        startIndex = 1;
      }

      const rulesToInsert = [];
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split('\t').map((c: string) => c.trim().replace(/^"|"$/g, ''));
        
        // Format: Priority, Unit, Akun, KataKunci, TargetField, NilaiKlasifikasi, Keterangan
        const pVal = parseInt(cols[0]) || 99;
        const uVal = cols[1] || '*';
        const aVal = cols[2] || '*';
        const kVal = cols[3] || '';
        const rawTarget = (cols[4] || '').toLowerCase();
        const targetField = (rawTarget.includes('webo') || rawTarget.includes('webometrics')) ? 'laporan_webometrics' : 'laporan_kementerian';
        const nilaiVal = cols[5] || '';
        const ket = cols[6] || '';

        if (kVal && nilaiVal) {
          rulesToInsert.push({
            priority: pVal,
            unit: uVal,
            akun: aVal,
            kata_kunci: kVal,
            target_field: targetField,
            nilai_klasifikasi: nilaiVal,
            keterangan: ket
          });
        }
      }

      if (rulesToInsert.length === 0) {
        return NextResponse.json({ success: false, error: 'Tidak ada baris aturan valid yang ditemukan. Pastikan format TSV sesuai.' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin.from('rka_rules').insert(rulesToInsert).select();
      if (error) throw error;
      return NextResponse.json({ success: true, count: rulesToInsert.length, data });
    }

    // 2. Single Rule Insertion
    const { priority, unit, akun, kata_kunci, target_field, nilai_klasifikasi, keterangan } = body;
    if (!kata_kunci || !nilai_klasifikasi) {
      return NextResponse.json({ success: false, error: 'Kata kunci dan Nilai Klasifikasi wajib diisi' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('rka_rules')
      .insert([{
        priority: parseInt(priority) || 99,
        unit: unit || '*',
        akun: akun || '*',
        kata_kunci,
        target_field: target_field || 'laporan_kementerian',
        nilai_klasifikasi,
        keterangan: keterangan || ''
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error inserting rka_rules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Menjalankan Rule Engine atau Update Rule
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Opsi A: Update 1 Rule jika ada body.id dan body.isEdit
    if (body.isEdit && body.id) {
      const { id, priority, unit, akun, kata_kunci, target_field, nilai_klasifikasi, keterangan } = body;
      const { data, error } = await supabaseAdmin
        .from('rka_rules')
        .update({
          priority: parseInt(priority) || 99,
          unit: unit || '*',
          akun: akun || '*',
          kata_kunci,
          target_field,
          nilai_klasifikasi,
          keterangan: keterangan || ''
        })
        .eq('id', id)
        .select();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // Opsi B: Jalankan Rule Engine ke seluruh rkat_pengeluaran
    const { ruleId, targetYear } = body;

    // Ambil rules yang akan dijalankan
    let rulesQuery = supabaseAdmin.from('rka_rules').select('*').order('priority', { ascending: true });
    if (ruleId) {
      rulesQuery = rulesQuery.eq('id', ruleId);
    }
    const { data: rulesList, error: rulesErr } = await rulesQuery;
    if (rulesErr) throw rulesErr;

    if (!rulesList || rulesList.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada aturan untuk dijalankan' }, { status: 400 });
    }

    // Ambil seluruh data rkat_pengeluaran dengan chunking (bypass limit 1000)
    let allBudgetRows: any[] = [];
    let page = 0;
    const chunkSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const from = page * chunkSize;
      const to = from + chunkSize - 1;

      let q = supabaseAdmin
        .from('rkat_pengeluaran')
        .select('id, unit, akun_detail, uraian_belanja, kegiatan, lingkup_kegiatan, laporan_kementerian, laporan_webometrics')
        .range(from, to);

      if (targetYear && targetYear !== 'ALL') {
        q = q.eq('tahun_anggaran', parseInt(targetYear));
      }

      const { data: chunk, error: chunkErr } = await q;
      if (chunkErr) throw chunkErr;

      if (chunk && chunk.length > 0) {
        allBudgetRows = allBudgetRows.concat(chunk);
        if (chunk.length < chunkSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }

    let updatedCount = 0;

    // Evaluasi setiap baris pengeluaran terhadap seluruh rules yang ada
    for (const row of allBudgetRows) {
      let isUpdated = false;
      let newKemen = row.laporan_kementerian;
      let newWebo = row.laporan_webometrics;

      const desc = `${row.uraian_belanja || ''} ${row.kegiatan || ''} ${row.lingkup_kegiatan || ''}`.toLowerCase();
      const akunStr = (row.akun_detail || '').toLowerCase();
      const unitStr = (row.unit || '').toLowerCase();

      for (const rule of rulesList) {
        // Cek filter unit
        if (rule.unit && rule.unit !== '*' && !unitStr.includes(rule.unit.toLowerCase())) {
          continue;
        }

        // Cek filter akun
        if (rule.akun && rule.akun !== '*' && !akunStr.includes(rule.akun.toLowerCase())) {
          continue;
        }

        // Cek filter kata kunci
        if (rule.kata_kunci && desc.includes(rule.kata_kunci.toLowerCase())) {
          if (rule.target_field === 'laporan_webometrics') {
            if (!newWebo || newWebo !== rule.nilai_klasifikasi) {
              newWebo = rule.nilai_klasifikasi;
              isUpdated = true;
            }
          } else {
            // Default target_field: laporan_kementerian
            if (!newKemen || newKemen !== rule.nilai_klasifikasi) {
              newKemen = rule.nilai_klasifikasi;
              isUpdated = true;
            }
          }
        }
      }

      if (isUpdated) {
        await supabaseAdmin
          .from('rkat_pengeluaran')
          .update({
            laporan_kementerian: newKemen,
            laporan_webometrics: newWebo,
            updated_at: new Date().toISOString()
          })
          .eq('id', row.id);
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Rule Engine sukses dijalankan. Berhasil memetakan & memperbarui ${updatedCount} baris data dari total ${allBudgetRows.length} data.`,
      updatedCount,
      totalScanned: allBudgetRows.length
    });
  } catch (error: any) {
    console.error('Error applying rka_rules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID aturan tidak ditemukan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('rka_rules').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Aturan berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting rka_rules:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
