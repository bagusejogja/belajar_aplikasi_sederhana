import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
  masterReferences: Array<{ id: number; ref_tahun_iku: number; nama_ref_iku: string }>;
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
          count: 0,
          items: []
        });
      });

      // Serta inisialisasi grup Belum Ada IKU
      const unmappedKey = `${tahunParam}___Belum Ada IKU`;
      groupedMap.set(unmappedKey, {
        ref_iku: 'Belum Ada IKU',
        ref_tahun_iku: tahunParam === 'all' ? 0 : Number(tahunParam),
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
        group = {
          ref_iku: itemRef,
          ref_tahun_iku: item.ref_tahun_iku,
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

    return NextResponse.json({
      success: true,
      tahun: tahunParam,
      totalMatchedRows: filtered.length,
      totalGroups: groupedList.length,
      masters: filteredMasters,
      groups: groupedList
    });

  } catch (error: any) {
    console.error('API IKU GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Pindah IKU atau Lepas/Hapus ke Belum Ada IKU
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, target_iku } = body;

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
