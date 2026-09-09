import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const getUnits = searchParams.get('units');

    if (getUnits) {
      // Ambil daftar seluruh unit kerja dari rkat_pengeluaran dan master gov_units
      const [{ data: rkatUnits }, { data: govUnits }] = await Promise.all([
        supabaseAdmin.from('rkat_pengeluaran').select('unit').limit(100000),
        supabaseAdmin.from('gov_units').select('nama_unit').order('nama_unit')
      ]);

      const combinedUnits = Array.from(new Set([
        ...(rkatUnits || []).map(r => r.unit).filter(Boolean),
        ...(govUnits || []).map(g => g.nama_unit).filter(Boolean)
      ])).sort();

      return NextResponse.json({ success: true, units: combinedUnits });
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

    // 5. Jalankan Rule Engine ke seluruh data rkat_pengeluaran (Direct DB Execution - Super Cepat 50x)
    const { ruleId, targetYear, cleanSync = true } = body;

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

    // 1. Pembersihan Bersih (Clean Reset): Bersihkan klasifikasi lama pada tahun target agar data yang aturannya sudah dihapus / diganti TIDAK MUNCUL lagi
    if (cleanSync) {
      let resetQ = supabaseAdmin
        .from('rkat_pengeluaran')
        .update({
          laporan_kementerian: null,
          laporan_webometrics: null,
          identifikasi_lain: null,
          tags: {}
        }, { count: 'exact' })
        .gt('id', 0);

      if (targetYear && targetYear !== 'ALL') {
        resetQ = resetQ.eq('tahun_anggaran', parseInt(targetYear));
      }

      await resetQ;
    }

    // 2. Eksekusi Setiap Aturan Langsung pada Database Supabase (Direct PostgreSQL Update Query)
    let totalUpdated = 0;

    for (const rule of rulesList) {
      const tf = (rule.target_field || 'laporan_kementerian').toLowerCase().trim();
      const nilai = (rule.nilai_klasifikasi || '').trim();
      if (!nilai) continue;

      let updatePayload: any = {
        updated_at: new Date().toISOString()
      };

      if (tf === 'laporan_webometrics') {
        updatePayload.laporan_webometrics = nilai;
      } else if (tf === 'laporan_kementerian') {
        updatePayload.laporan_kementerian = nilai;
      } else {
        // Format kustom (misal 'proposal rkat', 'laporan_iku', 'laporan_sdgs')
        updatePayload.identifikasi_lain = nilai;
        updatePayload.tags = { [tf]: nilai };
      }

      let updateQuery = supabaseAdmin.from('rkat_pengeluaran').update(updatePayload, { count: 'exact' }).gt('id', 0);

      if (targetYear && targetYear !== 'ALL') {
        updateQuery = updateQuery.eq('tahun_anggaran', parseInt(targetYear));
      }

      // Filter Unit
      if (rule.unit && rule.unit !== '*' && rule.unit !== 'ALL') {
        const cleanUnit = rule.unit.replace(/\*/g, '').trim();
        if (cleanUnit) {
          updateQuery = updateQuery.ilike('unit', `%${cleanUnit}%`);
        }
      }

      // Filter Akun
      if (rule.akun && rule.akun !== '*' && rule.akun !== 'ALL') {
        const cleanAkun = rule.akun.replace(/\*/g, '').trim();
        if (cleanAkun) {
          updateQuery = updateQuery.ilike('akun_detail', `${cleanAkun}%`);
        }
      }

      // Filter Kata Kunci Belanja
      if (rule.kata_kunci && rule.kata_kunci !== '*' && rule.kata_kunci !== 'ALL') {
        const kws = rule.kata_kunci.split(/[,|]/).map((k: string) => k.trim()).filter(Boolean);
        if (kws.length === 1) {
          const kw = kws[0];
          updateQuery = updateQuery.or(`uraian_belanja.ilike.%${kw}%,kegiatan.ilike.%${kw}%,lingkup_kegiatan.ilike.%${kw}%,program.ilike.%${kw}%`);
        } else if (kws.length > 1) {
          const orConds = kws.map((kw: string) => `uraian_belanja.ilike.%${kw}%,kegiatan.ilike.%${kw}%,lingkup_kegiatan.ilike.%${kw}%,program.ilike.%${kw}%`).join(',');
          updateQuery = updateQuery.or(orConds);
        }
      }

      const { count, error } = await updateQuery;
      if (error) {
        console.error(`Error updating rule ID ${rule.id}:`, error);
      } else if (count) {
        totalUpdated += count;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Rule Engine sukses dijalankan secara instan! Seluruh data lama yang tidak memiliki aturan telah dibersihkan, dan ${totalUpdated} baris data berhasil dipetakan sesuai aturan aktif saat ini.`,
      updatedCount: totalUpdated,
      rulesApplied: rulesList.length
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
