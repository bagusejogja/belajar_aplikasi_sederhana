import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = searchParams.get('tahun');
    
    let allData: any[] = [];
    let from = 0;
    const step = 1000;

    while (true) {
      let query = supabase
        .from('data_penerimaan')
        .select('*, jenis_penerimaan(id, nama_penerimaan)')
        .range(from, from + step - 1);
        
      if (tahun) {
        query = query.eq('tahun', tahun);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) break;
      
      allData = allData.concat(data);
      if (data.length < step) break;
      from += step;
    }
    
    return NextResponse.json({ success: true, data: allData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data_penerimaan } = body; // Expects array of objects
    
    if (!Array.isArray(data_penerimaan)) {
      throw new Error("Payload harus berupa array 'data_penerimaan'");
    }

    // Periksa apakah ini input manual dari UI
    const isManual = data_penerimaan.every((d: any) => d.trx_id === 'MANUAL');

    if (isManual && data_penerimaan.length > 0) {
      const sample = data_penerimaan[0];
      // Cari data yang sudah ada untuk bulan, tahun, dan tipe data ini
      const { data: existingRows } = await supabase
        .from('data_penerimaan')
        .select('id, jenis_penerimaan_id, nominal')
        .match({ 
          tahun: sample.tahun, 
          bulan: sample.bulan, 
          tipe_data: sample.tipe_data 
        });

      const existingMap = new Map();
      (existingRows || []).forEach(r => existingMap.set(Number(r.jenis_penerimaan_id), r));

      const toInsert: any[] = [];
      const updatedIds: number[] = [];

      for (const item of data_penerimaan) {
        const jId = Number(item.jenis_penerimaan_id);
        const existing = existingMap.get(jId);

        if (existing) {
          // Jika sudah ada dan nominal berubah, lakukan UPDATE (jangan pernah re-input/duplikasi)
          if (Number(existing.nominal) !== Number(item.nominal)) {
            await supabase
              .from('data_penerimaan')
              .update({ 
                nominal: Number(item.nominal), 
                updated_at: new Date().toISOString() 
              })
              .eq('id', existing.id);
            updatedIds.push(existing.id);
          }
        } else if (Number(item.nominal) > 0) {
          // Hanya insert jika belum pernah ada dan nominal > 0
          toInsert.push({
            ...item,
            nominal: Number(item.nominal),
            bulan: Number(item.bulan)
          });
        }
      }

      if (toInsert.length > 0) {
        await supabase.from('data_penerimaan').insert(toInsert);
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Data berhasil diperbarui (update data lama & simpan data baru)',
        updatedCount: updatedIds.length,
        insertedCount: toInsert.length 
      });
    }

    // Eksekusi insert (baik untuk manual maupun dari paste zone) dengan Chunking
    // Untuk mencegah error "Payload Too Large" dari Supabase saat upload 13rb+ baris
    const chunkSize = 1000;
    const insertedData = [];
    
    for (let i = 0; i < data_penerimaan.length; i += chunkSize) {
      const chunk = data_penerimaan.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('data_penerimaan')
        .insert(chunk)
        .select();

      if (error) throw error;
      if (data) insertedData.push(...data);
    }

    return NextResponse.json({ success: true, data: insertedData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
