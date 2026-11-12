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

function loadIkuData() {
  if (cachedData) return cachedData;
  try {
    const jsonPath = path.join(process.cwd(), 'src', 'data', 'iku-data.json');
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

    // Filter master referensi berdasarkan tahun
    const filteredMasters = masters.filter(m => {
      if (tahunParam === 'all') return true;
      return String(m.ref_tahun_iku) === tahunParam;
    });

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

      // 2. Filter spesifik Ref IKU
      if (refParam && item.ref_iku !== refParam) {
        return false;
      }

      // 3. Search query
      if (q) {
        const match = 
          item.kegiatan_nama.toLowerCase().includes(q) ||
          item.kegiatan_kode.toLowerCase().includes(q) ||
          item.program_nama.toLowerCase().includes(q) ||
          item.program_kode.toLowerCase().includes(q) ||
          item.sasaran_nama.toLowerCase().includes(q) ||
          item.tujuan_nama.toLowerCase().includes(q) ||
          item.ref_iku.toLowerCase().includes(q);
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

    // Inisialisasi setiap master agar yang kosong tetap terdaftar (atau sesuai hasil filter)
    filteredMasters.forEach(m => {
      const key = `${m.ref_tahun_iku}___${m.nama_ref_iku}`;
      groupedMap.set(key, {
        ref_iku: m.nama_ref_iku,
        ref_tahun_iku: m.ref_tahun_iku,
        count: 0,
        items: []
      });
    });

    // Masukkan data hasil filter
    filtered.forEach(item => {
      const key = `${item.ref_tahun_iku}___${item.ref_iku}`;
      let group = groupedMap.get(key);
      if (!group) {
        group = {
          ref_iku: item.ref_iku,
          ref_tahun_iku: item.ref_tahun_iku,
          count: 0,
          items: []
        };
        groupedMap.set(key, group);
      }
      group.count++;
      group.items.push(item);
    });

    // Konversi ke array
    const groupedList = Array.from(groupedMap.values())
      // Urutkan grup: yang memiliki kegiatan di atas, atau berdasarkan urutan master
      .sort((a, b) => b.count - a.count || a.ref_iku.localeCompare(b.ref_iku));

    return NextResponse.json({
      success: true,
      tahun: tahunParam,
      totalMatchedRows: filtered.length,
      totalGroups: groupedList.length,
      masters: filteredMasters,
      groups: groupedList
    });

  } catch (error: any) {
    console.error('API IKU error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
