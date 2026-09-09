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

// PUT: Menjalankan Rule Engine, Update Rule, atau Kelola Format Laporan
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 1. Aksi Rename / Ubah Nama Format Laporan pada seluruh aturan
    if (body.action === 'rename_format') {
      const { oldFormat, newFormat } = body;
      if (!oldFormat || !newFormat) {
        return NextResponse.json({ success: false, error: 'Format lama dan format baru wajib diisi' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('rka_rules')
        .update({ target_field: newFormat.trim().toLowerCase() })
        .eq('target_field', oldFormat);

      if (error) throw error;
      return NextResponse.json({ 
        success: true, 
        message: `Format '${oldFormat}' berhasil diubah namanya menjadi '${newFormat}'.` 
      });
    }

    // 2. Aksi Hapus Seluruh Aturan dalam satu Format Laporan
    if (body.action === 'delete_format') {
      const { targetFormat, resetPengeluaran } = body;
      if (!targetFormat) {
        return NextResponse.json({ success: false, error: 'Target format wajib disertakan' }, { status: 400 });
      }

      // Hapus rules dengan target_field tersebut
      const { error: delErr } = await supabaseAdmin
        .from('rka_rules')
        .delete()
        .eq('target_field', targetFormat);

      if (delErr) throw delErr;

      // Opsional: Bersihkan klasifikasi terkait di rkat_pengeluaran jika diminta
      if (resetPengeluaran) {
        if (targetFormat === 'laporan_kementerian') {
          await supabaseAdmin.from('rkat_pengeluaran').update({ laporan_kementerian: null }).not('laporan_kementerian', 'is', null);
        } else if (targetFormat === 'laporan_webometrics') {
          await supabaseAdmin.from('rkat_pengeluaran').update({ laporan_webometrics: null }).not('laporan_webometrics', 'is', null);
        } else {
          await supabaseAdmin.from('rkat_pengeluaran').update({ identifikasi_lain: null }).not('identifikasi_lain', 'is', null);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: `Format '${targetFormat}' dan seluruh aturannya berhasil dihapus.` 
      });
    }

    // 3. Aksi Reset / Bersihkan Klasifikasi pada Data Belanja
    if (body.action === 'reset_classification') {
      const { targetFormat, targetYear } = body;

      const applyYearFilter = (query: any) => {
        if (targetYear && targetYear !== 'ALL') {
          return query.eq('tahun_anggaran', parseInt(targetYear));
        }
        return query;
      };

      if (targetFormat === 'laporan_kementerian') {
        let q = supabaseAdmin.from('rkat_pengeluaran').update({ laporan_kementerian: null }).not('laporan_kementerian', 'is', null);
        await applyYearFilter(q);
      } else if (targetFormat === 'laporan_webometrics') {
        let q = supabaseAdmin.from('rkat_pengeluaran').update({ laporan_webometrics: null }).not('laporan_webometrics', 'is', null);
        await applyYearFilter(q);
      } else if (targetFormat === 'ALL') {
        let q = supabaseAdmin.from('rkat_pengeluaran').update({ laporan_kementerian: null, laporan_webometrics: null, identifikasi_lain: null, tags: {} });
        await applyYearFilter(q);
      } else {
        let q = supabaseAdmin.from('rkat_pengeluaran').update({ identifikasi_lain: null });
        await applyYearFilter(q);
      }

      return NextResponse.json({ 
        success: true, 
        message: `Klasifikasi untuk format '${targetFormat || 'Semua'}' berhasil dibersihkan.` 
      });
    }

    // 4. Update 1 Rule jika ada body.isEdit dan body.id
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

    // 5. Jalankan Rule Engine ke seluruh data rkat_pengeluaran
    const { ruleId, targetYear } = body;

    // Ambil rules yang akan dijalankan
    let rulesQuery = supabaseAdmin.from('rka_rules').select('*').order('priority', { ascending: true });
    if (ruleId) {
      rulesQuery = rulesQuery.eq('id', ruleId);
    }
    const { data: rulesList, error: rulesErr } = await rulesQuery;
    if (rulesErr) throw rulesErr;

    if (!rulesList || rulesList.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada aturan untuk dijalankan. Silakan buat aturan klasifikasi terlebih dahulu.' }, { status: 400 });
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
        .select('id, unit, akun_detail, uraian_belanja, kegiatan, lingkup_kegiatan, program, laporan_kementerian, laporan_webometrics, identifikasi_lain, tags');

      if (targetYear && targetYear !== 'ALL') {
        q = q.eq('tahun_anggaran', parseInt(targetYear));
      }

      const { data: chunk, error: chunkErr } = await q.range(from, to);
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
    const updatesQueue: { id: any; payload: any }[] = [];

    // Evaluasi setiap baris pengeluaran terhadap seluruh rules
    for (const row of allBudgetRows) {
      let isUpdated = false;
      let newKemen = row.laporan_kementerian;
      let newWebo = row.laporan_webometrics;
      let newLain = row.identifikasi_lain;
      let currentTags = (row.tags && typeof row.tags === 'object') ? { ...row.tags } : {};

      const desc = `${row.uraian_belanja || ''} ${row.kegiatan || ''} ${row.lingkup_kegiatan || ''} ${row.program || ''}`.toLowerCase();
      const akunStr = (row.akun_detail || '').toLowerCase();
      const unitStr = (row.unit || '').toLowerCase();

      for (const rule of rulesList) {
        // Cek filter unit: wildcard '*' cocok dengan unit apa saja
        if (rule.unit && rule.unit !== '*' && rule.unit !== 'ALL') {
          const cleanUnit = rule.unit.replace(/\*/g, '').toLowerCase().trim();
          if (cleanUnit && !unitStr.includes(cleanUnit)) {
            continue;
          }
        }

        // Cek filter akun: wildcard '*' atau prefix seperti '51*' / '52501'
        if (rule.akun && rule.akun !== '*' && rule.akun !== 'ALL') {
          const cleanAkun = rule.akun.replace(/\*/g, '').toLowerCase().trim();
          if (cleanAkun && !akunStr.includes(cleanAkun)) {
            continue;
          }
        }

        // Cek filter kata kunci: '*' atau kosong berarti cocok dengan semua
        let keywordMatch = false;
        const kw = (rule.kata_kunci || '').trim();
        if (!kw || kw === '*' || kw === 'ALL') {
          keywordMatch = true;
        } else {
          // Dukung multi-keywords dipisah koma atau garis tegak '|'
          const keywords = kw.split(/[,|]/).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
          keywordMatch = keywords.some((k: string) => desc.includes(k));
        }

        if (!keywordMatch) {
          continue;
        }

        // Terapkan hasil klasifikasi sesuai target format
        const tf = (rule.target_field || 'laporan_kementerian').toLowerCase();

        if (tf === 'laporan_webometrics') {
          if (!newWebo || newWebo !== rule.nilai_klasifikasi) {
            newWebo = rule.nilai_klasifikasi;
            isUpdated = true;
          }
        } else if (tf === 'laporan_kementerian') {
          if (!newKemen || newKemen !== rule.nilai_klasifikasi) {
            newKemen = rule.nilai_klasifikasi;
            isUpdated = true;
          }
        } else {
          // Format kustom (misal laporan_iku, laporan_sdgs, dll)
          if (!newLain || newLain !== rule.nilai_klasifikasi) {
            newLain = rule.nilai_klasifikasi;
            isUpdated = true;
          }
          if (currentTags[tf] !== rule.nilai_klasifikasi) {
            currentTags[tf] = rule.nilai_klasifikasi;
            isUpdated = true;
          }
        }
      }

      if (isUpdated) {
        updatesQueue.push({
          id: row.id,
          payload: {
            laporan_kementerian: newKemen,
            laporan_webometrics: newWebo,
            identifikasi_lain: newLain,
            tags: currentTags,
            updated_at: new Date().toISOString()
          }
        });
      }
    }

    // Jalankan update secara paralel dalam batch 40 row agar sangat cepat & tidak timeout
    const batchSize = 40;
    for (let i = 0; i < updatesQueue.length; i += batchSize) {
      const batch = updatesQueue.slice(i, i + batchSize);
      await Promise.all(
        batch.map(item =>
          supabaseAdmin
            .from('rkat_pengeluaran')
            .update(item.payload)
            .eq('id', item.id)
        )
      );
      updatedCount += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `Rule Engine sukses dijalankan! Berhasil memetakan ${updatedCount} baris data dari total ${allBudgetRows.length} data belanja.`,
      updatedCount,
      totalScanned: allBudgetRows.length
    });
  } catch (error: any) {
    console.error('Error in rka_rules PUT handler:', error);
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
