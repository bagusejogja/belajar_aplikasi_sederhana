import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

interface IkuItem {
  id: number;
  tujuan_id: string;
  tujuan_kode: string;
  tujuan_nama: string;
  indikator_tujuan_id: string;
  indikator_tujuan_kode: string;
  indikator_tujuan_nama: string;
  sasaran_id: string;
  sasaran_kode: string;
  sasaran_nama: string;
  indikator_sasaran_id: string;
  indikator_sasaran_kode: string;
  indikator_sasaran_nama: string;
  program_id: string;
  program_kode: string;
  program_nama: string;
  indikator_program_id: string;
  indikator_program_kode: string;
  indikator_program_nama: string;
  kegiatan_id: string;
  kegiatan_kode: string;
  kegiatan_nama: string;
  ref_iku: string;
  ref_tahun_iku: number;
}

let cachedData: {
  masterReferences: Array<{ id: number; ref_tahun_iku: number; nama_ref_iku: string; uraian?: string }>;
  mappings: IkuItem[];
} | null = null;

function getJsonPath() {
  return path.join(process.cwd(), 'src', 'data', 'iku-data.json');
}

function loadIkuData() {
  if (cachedData) return cachedData;
  try {
    const jsonPath = getJsonPath();
    if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      cachedData = JSON.parse(raw);
      return cachedData;
    }
  } catch (err) {
    console.error('Error loading iku-data.json:', err);
  }
  return { masterReferences: [], mappings: [] };
}

function saveIkuData(data: any) {
  try {
    cachedData = data;
    const jsonPath = getJsonPath();
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving iku-data.json:', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahunParam = searchParams.get('tahun') || '2026';
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const refParam = (searchParams.get('ref') || '').trim();
    const mode = searchParams.get('mode') || 'grouped'; // 'grouped' | 'list' | 'masters'

    const data = loadIkuData();
    const masters = data?.masterReferences || [];
    const allMappings = data?.mappings || [];

    // Filter & Sort master referensi berdasarkan tahun secara alfabet A-Z (Sort by Abjad)
    const filteredMasters = masters
      .filter(m => {
        if (tahunParam === 'all') return true;
        return String(m.ref_tahun_iku) === tahunParam;
      })
      .sort((a, b) => a.nama_ref_iku.localeCompare(b.nama_ref_iku, undefined, { numeric: true, sensitivity: 'base' }));

    if (mode === 'masters') {
      return NextResponse.json({
        success: true,
        tahun: tahunParam,
        totalMasters: filteredMasters.length,
        data: filteredMasters
      });
    }

    // Gabungkan kegiatan custom (baru / editan) dari Supabase app_iku_custom_kegiatan
    try {
      const { data: customKegiatanList, error: customErr } = await supabase
        .from('app_iku_custom_kegiatan')
        .select('*');

      if (!customErr && customKegiatanList && customKegiatanList.length > 0) {
        customKegiatanList.forEach((c: any) => {
          if (c.is_deleted) {
            const idx = allMappings.findIndex(m => m.id === Number(c.kegiatan_id || c.id));
            if (idx >= 0) allMappings.splice(idx, 1);
            return;
          }

          if (c.kegiatan_id) {
            // Override kegiatan yang sudah ada
            const existing = allMappings.find(m => m.id === Number(c.kegiatan_id));
            if (existing) {
              if (c.kegiatan_nama) existing.kegiatan_nama = c.kegiatan_nama;
              if (c.kegiatan_kode !== null && c.kegiatan_kode !== undefined) existing.kegiatan_kode = c.kegiatan_kode;
              if (c.program_nama !== null && c.program_nama !== undefined) existing.program_nama = c.program_nama;
              if (c.program_kode !== null && c.program_kode !== undefined) existing.program_kode = c.program_kode;
              if (c.sasaran_nama !== null && c.sasaran_nama !== undefined) existing.sasaran_nama = c.sasaran_nama;
              if (c.tujuan_nama !== null && c.tujuan_nama !== undefined) existing.tujuan_nama = c.tujuan_nama;
              if (c.ref_iku) existing.ref_iku = c.ref_iku;
              if (c.ref_tahun_iku) existing.ref_tahun_iku = c.ref_tahun_iku;
            }
          } else {
            // Kegiatan baru
            const newId = 100000 + Number(c.id);
            if (!allMappings.some(m => m.id === newId)) {
              allMappings.push({
                id: newId,
                kegiatan_id: String(newId),
                kegiatan_kode: c.kegiatan_kode || '',
                kegiatan_nama: c.kegiatan_nama,
                program_id: '',
                program_kode: c.program_kode || '',
                program_nama: c.program_nama || '',
                indikator_program_id: '',
                indikator_program_kode: '',
                indikator_program_nama: '',
                sasaran_id: '',
                sasaran_kode: '',
                sasaran_nama: c.sasaran_nama || '',
                indikator_sasaran_id: '',
                indikator_sasaran_kode: '',
                indikator_sasaran_nama: '',
                tujuan_id: '',
                tujuan_kode: '',
                tujuan_nama: c.tujuan_nama || '',
                indikator_tujuan_id: '',
                indikator_tujuan_kode: '',
                indikator_tujuan_nama: '',
                ref_iku: c.ref_iku || 'Belum Ada IKU',
                ref_tahun_iku: c.ref_tahun_iku || 2026
              });
            }
          }
        });
      }
    } catch (e) {
      console.warn('Gagal memuat custom kegiatan dari Supabase:', e);
    }

    // Filter pemetaan
    let filtered = allMappings.filter(item => {
      // 1. Filter tahun
      if (tahunParam !== 'all' && String(item.ref_tahun_iku) !== tahunParam) {
        return false;
      }

      // Normalisasi ref_iku kosong
      const currentRef = (!item.ref_iku || item.ref_iku.trim() === '' || item.ref_iku === '-') ? 'Belum Ada IKU' : item.ref_iku;

      // 2. Filter spesifik Ref IKU: Jika ada filter IKU, HANYA data IKU tersebut yang lolos
      if (refParam && refParam !== 'ALL' && currentRef !== refParam) {
        return false;
      }

      // 3. Search query
      if (q) {
        const match = 
          (item.kegiatan_nama || '').toLowerCase().includes(q) ||
          (item.kegiatan_kode || '').toLowerCase().includes(q) ||
          (item.program_nama || '').toLowerCase().includes(q) ||
          (item.program_kode || '').toLowerCase().includes(q) ||
          (item.indikator_program_nama || '').toLowerCase().includes(q) ||
          (item.indikator_program_kode || '').toLowerCase().includes(q) ||
          (item.sasaran_nama || '').toLowerCase().includes(q) ||
          (item.sasaran_kode || '').toLowerCase().includes(q) ||
          (item.indikator_sasaran_nama || '').toLowerCase().includes(q) ||
          (item.tujuan_nama || '').toLowerCase().includes(q) ||
          (item.tujuan_kode || '').toLowerCase().includes(q) ||
          (item.indikator_tujuan_nama || '').toLowerCase().includes(q) ||
          currentRef.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    // Jika mode list (tabel datar)
    if (mode === 'list') {
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return NextResponse.json({
        success: true,
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
        data: paginated
      });
    }

    // Mode default: 'grouped' (dikelompokkan per ref IKU)
    const groupedMap = new Map<string, {
      ref_iku: string;
      ref_tahun_iku: number;
      uraian?: string;
      count: number;
      items: IkuItem[];
    }>();

    // 1. Inisialisasi master referensi
    // JIKA refParam aktif (bukan ALL): HANYA inisialisasi master yang dipilih, jangan tampilkan yang lain!
    if (refParam && refParam !== 'ALL') {
      if (refParam === 'Belum Ada IKU') {
        const unmappedKey = `${tahunParam}___Belum Ada IKU`;
        groupedMap.set(unmappedKey, {
          ref_iku: 'Belum Ada IKU',
          ref_tahun_iku: tahunParam === 'all' ? 0 : Number(tahunParam),
          uraian: '',
          count: 0,
          items: []
        });
      } else {
        const targetMaster = filteredMasters.find(m => m.nama_ref_iku === refParam);
        const thn = targetMaster ? targetMaster.ref_tahun_iku : (tahunParam === 'all' ? 0 : Number(tahunParam));
        const key = `${thn}___${refParam}`;
        groupedMap.set(key, {
          ref_iku: refParam,
          ref_tahun_iku: thn,
          uraian: targetMaster?.uraian || '',
          count: 0,
          items: []
        });
      }
    } else {
      // Mode ALL: Inisialisasi seluruh master (diurutkan alfabet A-Z)
      filteredMasters.forEach(m => {
        const key = `${m.ref_tahun_iku}___${m.nama_ref_iku}`;
        groupedMap.set(key, {
          ref_iku: m.nama_ref_iku,
          ref_tahun_iku: m.ref_tahun_iku,
          uraian: m.uraian || '',
          count: 0,
          items: []
        });
      });

      // Serta inisialisasi grup Belum Ada IKU
      const unmappedKey = `${tahunParam}___Belum Ada IKU`;
      groupedMap.set(unmappedKey, {
        ref_iku: 'Belum Ada IKU',
        ref_tahun_iku: tahunParam === 'all' ? 0 : Number(tahunParam),
        uraian: '',
        count: 0,
        items: []
      });
    }

    // 2. Masukkan data hasil filter ke grup masing-masing
    filtered.forEach(item => {
      const itemRef = (!item.ref_iku || item.ref_iku.trim() === '' || item.ref_iku === '-') ? 'Belum Ada IKU' : item.ref_iku;
      
      // Jika refParam aktif, jangan masukkan data dari ref lain
      if (refParam && refParam !== 'ALL' && itemRef !== refParam) {
        return;
      }

      const key = `${item.ref_tahun_iku}___${itemRef}`;
      let group = groupedMap.get(key);
      if (!group) {
        const targetMaster = filteredMasters.find(m => m.nama_ref_iku === itemRef);
        group = {
          ref_iku: itemRef,
          ref_tahun_iku: item.ref_tahun_iku,
          uraian: targetMaster?.uraian || '',
          count: 0,
          items: []
        };
        groupedMap.set(key, group);
      }
      group.count++;
      group.items.push({
        ...item,
        ref_iku: itemRef
      });
    });

    // 3. Konversi ke array & Urutkan Sort By Abjad (A-Z) (Poin 4)
    const groupedList = Array.from(groupedMap.values())
      .filter(g => {
        // Jika sedang filter IKU tertentu, pastikan hanya grup itu yang muncul
        if (refParam && refParam !== 'ALL') {
          return g.ref_iku === refParam;
        }
        return true;
      })
      .sort((a, b) => {
        // Belum Ada IKU ditaruh di akhir jika mode ALL
        if (a.ref_iku === 'Belum Ada IKU') return 1;
        if (b.ref_iku === 'Belum Ada IKU') return -1;
        // Sort by abjad A-Z dengan natural numeric sorting (IKU 1, IKU 2, IKU 3...)
        return a.ref_iku.localeCompare(b.ref_iku, undefined, { numeric: true, sensitivity: 'base' });
      });

    // Ambil daftar ID kegiatan yang terkunci (Kunci / IKU Sudah Dipetakan) dari Supabase agar persisten lintas perangkat
    let lockedIds: number[] = [];
    try {
      // 1. Coba baca dari tabel khusus app_iku_locks
      const { data: lockRows, error: lockErr } = await supabase
        .from('app_iku_locks')
        .select('kegiatan_id');

      if (!lockErr && lockRows) {
        lockedIds = lockRows.map(r => Number(r.kegiatan_id)).filter(n => !isNaN(n) && n > 0);
      } else {
        // Fallback jika tabel khusus belum dibuat di Supabase
        const { data: legacyRows } = await supabase
          .from('app_user_favorites')
          .select('path')
          .eq('user_id', 'global_iku_locked');
        if (legacyRows && legacyRows.length > 0) {
          lockedIds = legacyRows.map(r => Number(r.path)).filter(n => !isNaN(n) && n > 0);
        }
      }
    } catch (lockErr) {
      console.warn('Gagal memuat lockedIds dari Supabase:', lockErr);
    }

    // Ambil custom uraian IKU jika pernah diubah oleh pengguna
    try {
      // 1. Coba baca dari tabel khusus app_iku_uraian
      const { data: uraianRows, error: uraianErr } = await supabase
        .from('app_iku_uraian')
        .select('ref_iku, uraian');

      if (!uraianErr && uraianRows && uraianRows.length > 0) {
        uraianRows.forEach((r: any) => {
          const ikuName = r.ref_iku;
          const customUraian = r.uraian;
          if (ikuName && customUraian !== undefined) {
            const m = filteredMasters.find(x => x.nama_ref_iku === ikuName);
            if (m) m.uraian = customUraian;
            const g = groupedList.find(x => x.ref_iku === ikuName);
            if (g) g.uraian = customUraian;
          }
        });
      } else {
        // Fallback jika tabel khusus belum dibuat di Supabase
        const { data: legacyUraian } = await supabase
          .from('app_user_favorites')
          .select('path, title')
          .eq('user_id', 'global_iku_uraian');
        if (legacyUraian && legacyUraian.length > 0) {
          legacyUraian.forEach((r: any) => {
            const ikuName = r.path;
            const customUraian = r.title;
            if (ikuName && customUraian !== undefined) {
              const m = filteredMasters.find(x => x.nama_ref_iku === ikuName);
              if (m) m.uraian = customUraian;
              const g = groupedList.find(x => x.ref_iku === ikuName);
              if (g) g.uraian = customUraian;
            }
          });
        }
      }
    } catch (e) {
      console.warn('Gagal memuat custom uraian dari Supabase:', e);
    }

    return NextResponse.json({
      success: true,
      tahun: tahunParam,
      totalMatchedRows: filtered.length,
      totalGroups: groupedList.length,
      masters: filteredMasters,
      groups: groupedList,
      lockedIds: lockedIds
    });

  } catch (error: any) {
    console.error('API IKU GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Pindah IKU, Lepas/Hapus, serta Gembok / Buka Gembok (Persistensi Global)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, ids, target_iku } = body;

    // 1. Aksi Kunci Tunggal
    if (action === 'lock') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID kegiatan wajib diisi' }, { status: 400 });
      }
      try {
        const { error: lockErr } = await supabase.from('app_iku_locks').upsert(
          [{ kegiatan_id: Number(id) }],
          { onConflict: 'kegiatan_id' }
        );
        if (lockErr) {
          // Fallback legacy
          await supabase.from('app_user_favorites').upsert(
            [{ user_id: 'global_iku_locked', path: String(id) }],
            { onConflict: 'user_id,path' }
          );
        }
      } catch (e: any) {
        console.error('Error saving lock to Supabase:', e);
      }
      return NextResponse.json({
        success: true,
        message: `Kegiatan #${id} berhasil dikunci (IKU Sudah Dipetakan & Terkunci)`,
        id: Number(id)
      });
    }

    // 2. Aksi Buka Kunci Tunggal
    if (action === 'unlock') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID kegiatan wajib diisi' }, { status: 400 });
      }
      try {
        await supabase.from('app_iku_locks')
          .delete()
          .eq('kegiatan_id', Number(id));
        // Bersihkan juga dari legacy jika ada
        await supabase.from('app_user_favorites')
          .delete()
          .eq('user_id', 'global_iku_locked')
          .eq('path', String(id));
      } catch (e: any) {
        console.error('Error removing lock from Supabase:', e);
      }
      return NextResponse.json({
        success: true,
        message: `Kunci kegiatan #${id} berhasil dibuka`,
        id: Number(id)
      });
    }

    // 3. Aksi Kunci Massal (Batch Lock)
    if (action === 'batch_lock') {
      const targetIds: number[] = Array.isArray(ids) ? ids : (id ? [id] : []);
      if (targetIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Daftar ID wajib diisi' }, { status: 400 });
      }
      try {
        const lockRows = targetIds.map(item_id => ({ kegiatan_id: Number(item_id) }));
        const { error: batchErr } = await supabase.from('app_iku_locks').upsert(lockRows, { onConflict: 'kegiatan_id' });
        if (batchErr) {
          // Fallback legacy
          const rows = targetIds.map(item_id => ({
            user_id: 'global_iku_locked',
            path: String(item_id)
          }));
          await supabase.from('app_user_favorites').upsert(rows, { onConflict: 'user_id,path' });
        }
      } catch (e: any) {
        console.error('Error batch saving locks to Supabase:', e);
      }
      return NextResponse.json({
        success: true,
        message: `${targetIds.length} kegiatan berhasil dikunci`,
        ids: targetIds
      });
    }

    // 4. Aksi Buka Kunci Massal (Batch Unlock)
    if (action === 'batch_unlock') {
      const targetIds: number[] = Array.isArray(ids) ? ids : (id ? [id] : []);
      if (targetIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Daftar ID wajib diisi' }, { status: 400 });
      }
      try {
        await supabase.from('app_iku_locks')
          .delete()
          .in('kegiatan_id', targetIds.map(Number));
        // Bersihkan juga dari legacy
        await supabase.from('app_user_favorites')
          .delete()
          .eq('user_id', 'global_iku_locked')
          .in('path', targetIds.map(String));
      } catch (e: any) {
        console.error('Error batch removing locks from Supabase:', e);
      }
      return NextResponse.json({
        success: true,
        message: `Kunci ${targetIds.length} kegiatan berhasil dibuka`,
        ids: targetIds
      });
    }

    // 5. Aksi Ubah Uraian Indikator IKU
    if (action === 'update_uraian') {
      const { ref_iku, uraian } = body;
      if (!ref_iku) {
        return NextResponse.json({ success: false, error: 'Nama referensi IKU wajib diisi' }, { status: 400 });
      }

      const ikuData = loadIkuData();
      const master = ikuData?.masterReferences?.find(m => m.nama_ref_iku === ref_iku);
      if (master && ikuData) {
        master.uraian = uraian || '';
        saveIkuData(ikuData);
      }

      // Simpan ke Supabase app_iku_uraian (dengan fallback ke app_user_favorites)
      try {
        const { error: uraianErr } = await supabase.from('app_iku_uraian').upsert(
          [{ ref_iku: ref_iku, uraian: uraian || '', updated_at: new Date().toISOString() }],
          { onConflict: 'ref_iku' }
        );
        if (uraianErr) {
          await supabase.from('app_user_favorites').upsert(
            [{ user_id: 'global_iku_uraian', path: ref_iku, title: uraian || '' }],
            { onConflict: 'user_id,path' }
          );
        }
      } catch (err) {
        console.warn('Gagal simpan custom uraian ke Supabase:', err);
      }

      return NextResponse.json({
        success: true,
        message: `Uraian indikator berhasil diperbarui`,
        data: { ref_iku, uraian }
      });
    }

    // 6. Aksi Tambah / Edit Detail Kegiatan (Baru / Override)
    if (action === 'save_kegiatan') {
      const {
        id: editId,
        kegiatan_nama,
        kegiatan_kode,
        program_nama,
        program_kode,
        sasaran_nama,
        tujuan_nama,
        ref_iku: inputRefIku,
        ref_tahun_iku: inputTahun
      } = body;

      if (!kegiatan_nama || !String(kegiatan_nama).trim()) {
        return NextResponse.json({ success: false, error: 'Nama kegiatan wajib diisi' }, { status: 400 });
      }

      const cleanNama = String(kegiatan_nama).trim();
      const cleanRefIku = inputRefIku && String(inputRefIku).trim() ? String(inputRefIku).trim() : 'Belum Ada IKU';
      const cleanTahun = Number(inputTahun) || 2026;

      // 1. Simpan ke Supabase app_iku_custom_kegiatan
      try {
        if (editId) {
          await supabase.from('app_iku_custom_kegiatan').upsert({
            kegiatan_id: Number(editId),
            kegiatan_nama: cleanNama,
            kegiatan_kode: kegiatan_kode || '',
            program_nama: program_nama || '',
            program_kode: program_kode || '',
            sasaran_nama: sasaran_nama || '',
            tujuan_nama: tujuan_nama || '',
            ref_iku: cleanRefIku,
            ref_tahun_iku: cleanTahun,
            updated_at: new Date().toISOString()
          }, { onConflict: 'kegiatan_id' });
        } else {
          await supabase.from('app_iku_custom_kegiatan').insert({
            kegiatan_nama: cleanNama,
            kegiatan_kode: kegiatan_kode || '',
            program_nama: program_nama || '',
            program_kode: program_kode || '',
            sasaran_nama: sasaran_nama || '',
            tujuan_nama: tujuan_nama || '',
            ref_iku: cleanRefIku,
            ref_tahun_iku: cleanTahun
          });
        }
      } catch (err) {
        console.warn('Gagal simpan ke app_iku_custom_kegiatan:', err);
      }

      // 2. Simpan juga ke file lokal iku-data.json
      try {
        const ikuData = loadIkuData();
        if (ikuData && ikuData.mappings) {
          if (editId) {
            const item = ikuData.mappings.find(m => m.id === Number(editId));
            if (item) {
              item.kegiatan_nama = cleanNama;
              if (kegiatan_kode !== undefined) item.kegiatan_kode = kegiatan_kode;
              if (program_nama !== undefined) item.program_nama = program_nama;
              if (program_kode !== undefined) item.program_kode = program_kode;
              if (sasaran_nama !== undefined) item.sasaran_nama = sasaran_nama;
              if (tujuan_nama !== undefined) item.tujuan_nama = tujuan_nama;
              item.ref_iku = cleanRefIku;
              item.ref_tahun_iku = cleanTahun;
              saveIkuData(ikuData);
            }
          } else {
            const nextId = Math.max(...ikuData.mappings.map(m => m.id || 0), 3000) + 1;
            ikuData.mappings.push({
              id: nextId,
              kegiatan_id: String(nextId),
              kegiatan_kode: kegiatan_kode || '',
              kegiatan_nama: cleanNama,
              program_id: '',
              program_kode: program_kode || '',
              program_nama: program_nama || '',
              indikator_program_id: '',
              indikator_program_kode: '',
              indikator_program_nama: '',
              sasaran_id: '',
              sasaran_kode: '',
              sasaran_nama: sasaran_nama || '',
              indikator_sasaran_id: '',
              indikator_sasaran_kode: '',
              indikator_sasaran_nama: '',
              tujuan_id: '',
              tujuan_kode: '',
              tujuan_nama: tujuan_nama || '',
              indikator_tujuan_id: '',
              indikator_tujuan_kode: '',
              indikator_tujuan_nama: '',
              ref_iku: cleanRefIku,
              ref_tahun_iku: cleanTahun
            });
            saveIkuData(ikuData);
          }
        }
      } catch (err) {
        console.warn('Simpan file lokal iku-data.json dilewati:', err);
      }

      return NextResponse.json({
        success: true,
        message: editId ? `Kegiatan "${cleanNama}" berhasil diperbarui` : `Kegiatan baru "${cleanNama}" berhasil ditambahkan`
      });
    }

    // 7. Aksi Hapus Kegiatan
    if (action === 'delete_kegiatan') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID kegiatan wajib diisi' }, { status: 400 });
      }

      try {
        await supabase.from('app_iku_custom_kegiatan').upsert({
          kegiatan_id: Number(id),
          is_deleted: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'kegiatan_id' });
      } catch (err) {
        console.warn('Gagal tandai hapus di app_iku_custom_kegiatan:', err);
      }

      try {
        const ikuData = loadIkuData();
        if (ikuData && ikuData.mappings) {
          const idx = ikuData.mappings.findIndex(m => m.id === Number(id));
          if (idx >= 0) {
            ikuData.mappings.splice(idx, 1);
            saveIkuData(ikuData);
          }
        }
      } catch (err) {
        console.warn('Hapus dari file lokal dilewati:', err);
      }

      return NextResponse.json({
        success: true,
        message: `Kegiatan berhasil dihapus`
      });
    }

    // 8. Aksi Pindah IKU atau Lepas/Hapus
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID kegiatan wajib diisi' }, { status: 400 });
    }

    const data = loadIkuData();
    const allMappings = data?.mappings || [];
    const targetItem = allMappings.find(item => item.id === Number(id));

    if (!targetItem) {
      return NextResponse.json({ success: false, error: 'Kegiatan tidak ditemukan' }, { status: 404 });
    }

    if (action === 'remove' || action === 'hapus') {
      targetItem.ref_iku = 'Belum Ada IKU';
    } else if (action === 'move') {
      targetItem.ref_iku = target_iku && target_iku.trim() ? target_iku.trim() : 'Belum Ada IKU';
    }

    // Sinkronisasi perpindahan ke Supabase app_iku_custom_kegiatan agar persisten di cloud
    try {
      await supabase.from('app_iku_custom_kegiatan').upsert({
        kegiatan_id: targetItem.id,
        kegiatan_nama: targetItem.kegiatan_nama,
        kegiatan_kode: targetItem.kegiatan_kode,
        program_nama: targetItem.program_nama,
        sasaran_nama: targetItem.sasaran_nama,
        tujuan_nama: targetItem.tujuan_nama,
        ref_iku: targetItem.ref_iku,
        ref_tahun_iku: targetItem.ref_tahun_iku || 2026,
        updated_at: new Date().toISOString()
      }, { onConflict: 'kegiatan_id' });
    } catch (err) {
      console.warn('Gagal sinkron move ke Supabase:', err);
    }

    // Simpan perubahan ke memory & file
    saveIkuData(data);

    return NextResponse.json({
      success: true,
      message: action === 'remove' 
        ? 'Kegiatan berhasil dipindahkan ke daftar Belum Ada IKU' 
        : `Kegiatan berhasil dipindahkan ke ${targetItem.ref_iku}`,
      data: targetItem
    });
  } catch (error: any) {
    console.error('API IKU POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menyimpan perubahan IKU' },
      { status: 500 }
    );
  }
}
