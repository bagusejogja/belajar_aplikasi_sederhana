import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// In-Memory store fallback jika tabel Supabase belum dibuat
let inMemoryStore: any[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const kategori = searchParams.get('kategori') || 'ALL';
    const tipe_transaksi = searchParams.get('tipe') || 'ALL';
    const status_kasbon = searchParams.get('status') || 'ALL';

    let query = supabaseAdmin
      .from('catatan_penelitian')
      .select('*')
      .order('tanggal_transaksi', { ascending: false })
      .order('id', { ascending: false });

    if (startDate) {
      query = query.gte('tanggal_transaksi', startDate);
    }
    if (endDate) {
      query = query.lte('tanggal_transaksi', endDate);
    }
    if (kategori && kategori !== 'ALL') {
      query = query.eq('kategori', kategori);
    }
    if (tipe_transaksi && tipe_transaksi !== 'ALL') {
      query = query.eq('tipe_transaksi', tipe_transaksi);
    }
    if (status_kasbon && status_kasbon !== 'ALL') {
      query = query.eq('status_kasbon', status_kasbon);
    }
    if (search && search.trim()) {
      const qText = search.trim();
      query = query.or(`uraian.ilike.%${qText}%,catatan.ilike.%${qText}%,nama_penerima.ilike.%${qText}%`);
    }

    const { data, error } = await query;

    if (error) {
      // Jika tabel belum dibuat di Supabase
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        let filteredFallback = [...inMemoryStore];
        if (startDate) filteredFallback = filteredFallback.filter(f => f.tanggal_transaksi >= startDate);
        if (endDate) filteredFallback = filteredFallback.filter(f => f.tanggal_transaksi <= endDate);
        if (kategori && kategori !== 'ALL') filteredFallback = filteredFallback.filter(f => f.kategori === kategori);
        if (tipe_transaksi && tipe_transaksi !== 'ALL') filteredFallback = filteredFallback.filter(f => f.tipe_transaksi === tipe_transaksi);
        if (status_kasbon && status_kasbon !== 'ALL') filteredFallback = filteredFallback.filter(f => f.status_kasbon === status_kasbon);
        if (search) {
          const q = search.toLowerCase();
          filteredFallback = filteredFallback.filter(f => 
            (f.uraian && f.uraian.toLowerCase().includes(q)) || 
            (f.catatan && f.catatan.toLowerCase().includes(q)) ||
            (f.nama_penerima && f.nama_penerima.toLowerCase().includes(q))
          );
        }

        const totalNominal = filteredFallback.reduce((sum, item) => sum + (Number(item.nominal) || 0), 0);
        const totalKasbonOutstanding = filteredFallback
          .filter(it => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Menunggu Nota')
          .reduce((sum, item) => sum + (Number(item.nominal_kasbon || item.nominal) || 0), 0);
        const countKasbonOutstanding = filteredFallback
          .filter(it => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Menunggu Nota').length;

        return NextResponse.json({
          success: true,
          data: filteredFallback,
          totalNominal,
          totalKasbonOutstanding,
          countKasbonOutstanding,
          tableNotCreated: true,
          message: 'Tabel catatan_penelitian belum dibuat di Supabase. Silakan jalankan script supabase_catatan_penelitian_migration.sql di Supabase SQL Editor.'
        });
      }
      throw error;
    }

    // Lampirkan daftar nota per kasbon (tabel opsional)
    const kasbonIds = (data || []).filter((r: any) => r.tipe_transaksi === 'Kasbon').map((r: any) => r.id);
    const notaMap = new Map<string, any[]>();
    if (kasbonIds.length > 0) {
      const { data: notaRows, error: notaErr } = await supabaseAdmin
        .from('catatan_penelitian_nota')
        .select('*')
        .in('kasbon_id', kasbonIds)
        .order('tanggal_nota', { ascending: true })
        .order('id', { ascending: true });
      if (!notaErr) {
        (notaRows || []).forEach((n: any) => {
          const k = String(n.kasbon_id);
          if (!notaMap.has(k)) notaMap.set(k, []);
          notaMap.get(k)!.push(n);
        });
      }
    }

    const items = (data || []).map((row: any) => {
      const notas = notaMap.get(String(row.id)) || [];
      return {
        ...row,
        notas,
        nota_count: notas.length,
        tipe_transaksi: row.tipe_transaksi || 'Pengeluaran Langsung',
        status_kasbon: row.status_kasbon || (row.tipe_transaksi === 'Kasbon' ? 'Menunggu Nota' : 'Selesai'),
        nama_penerima: row.nama_penerima || '',
        nominal_kasbon: Number(row.nominal_kasbon || (row.tipe_transaksi === 'Kasbon' ? row.nominal : 0)),
        nominal_realisasi: Number(row.nominal_realisasi || (row.status_kasbon === 'Selesai' ? row.nominal : 0)),
        selisih_kasbon: Number(row.selisih_kasbon || 0),
        foto_nota: row.foto_nota || row.foto_bukti_1,
        foto_kegiatan: row.foto_kegiatan || row.foto_bukti_2,
        foto_barang: row.foto_barang || row.foto_bukti_3,
        foto_bukti_transfer: row.foto_bukti_transfer || row.foto_bukti_4
      };
    });

    const totalNominal = items.reduce((sum: number, item: any) => sum + (Number(item.nominal) || 0), 0);
    const totalKasbonOutstanding = items
      .filter((it: any) => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Menunggu Nota')
      .reduce((sum: number, item: any) => sum + (Number(item.nominal_kasbon || item.nominal) || 0), 0);
    const countKasbonOutstanding = items
      .filter((it: any) => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Menunggu Nota').length;
    const totalKasbonSelesai = items
      .filter((it: any) => it.tipe_transaksi === 'Kasbon' && it.status_kasbon === 'Selesai')
      .reduce((sum: number, item: any) => sum + (Number(item.nominal_realisasi || item.nominal) || 0), 0);

    return NextResponse.json({
      success: true,
      data: items,
      totalNominal,
      totalKasbonOutstanding,
      countKasbonOutstanding,
      totalKasbonSelesai,
      tableNotCreated: false
    });
  } catch (err: any) {
    console.error('Error in GET /api/catatan-penelitian:', err);
    return NextResponse.json({ success: false, error: err.message, data: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      action,
      id,
      tanggal_transaksi, 
      kategori = 'Penelitian', 
      nominal, 
      uraian, 
      catatan,
      tipe_transaksi = 'Pengeluaran Langsung',
      status_kasbon,
      nama_penerima,
      nominal_kasbon,
      nominal_realisasi,
      selisih_kasbon,
      tanggal_penyelesaian,
      catatan_penyelesaian,
      foto_nota,
      foto_kegiatan,
      foto_barang,
      foto_bukti_transfer,
      foto_bukti_1, 
      foto_bukti_2, 
      foto_bukti_3, 
      foto_bukti_4,
      created_by 
    } = body;

    // ===== Aksi Nota Bertahap (kasbon bisa punya banyak nota) =====
    if (action === 'tambah_nota' || action === 'update_nota' || action === 'tutup_kasbon' || action === 'buka_kembali' || action === 'hapus_nota') {
      const joinUrls = (a?: string | null, b?: string | null) =>
        [a, b].filter((x) => x && String(x).trim()).join(', ') || null;

      let kasbonId = body.kasbon_id || id;
      if (action === 'hapus_nota') {
        if (!body.nota_id) return NextResponse.json({ success: false, error: 'nota_id wajib' }, { status: 400 });
        const { data: delRow, error: delErr } = await supabaseAdmin
          .from('catatan_penelitian_nota').delete().eq('id', body.nota_id).select().single();
        if (delErr) throw delErr;
        kasbonId = delRow.kasbon_id;
      }
      if (!kasbonId) return NextResponse.json({ success: false, error: 'ID kasbon wajib' }, { status: 400 });

      const { data: parent, error: parentErr } = await supabaseAdmin
        .from('catatan_penelitian').select('*').eq('id', kasbonId).single();
      if (parentErr || !parent) throw parentErr || new Error('Kasbon tidak ditemukan');
      const kasbonVal = Number(parent.nominal_kasbon || parent.nominal || 0);

      const parentUpdate: any = { updated_at: new Date().toISOString() };

      if (action === 'tambah_nota') {
        const rows = Array.isArray(body.items) ? body.items : [];
        const cleanItems = rows
          .map((r: any) => ({
            nama: String(r.nama || '').trim(),
            qty: Number(r.qty) || 0,
            satuan: String(r.satuan || '').trim(),
            harga: Number(r.harga) || 0,
          }))
          .filter((r: any) => r.nama && r.qty > 0);
        const total = cleanItems.reduce((s: number, r: any) => s + r.qty * r.harga, 0);
        if (cleanItems.length === 0 || total <= 0) {
          return NextResponse.json({ success: false, error: 'Isi minimal satu rincian barang dengan volume & harga' }, { status: 400 });
        }
        const { error: insErr } = await supabaseAdmin.from('catatan_penelitian_nota').insert([{
          kasbon_id: kasbonId,
          tanggal_nota: body.tanggal_nota || new Date().toISOString().split('T')[0],
          toko: body.toko ? String(body.toko).trim() : null,
          keterangan: body.keterangan ? String(body.keterangan).trim() : null,
          items: cleanItems,
          total,
          foto_nota: body.foto_nota || null,
          foto_barang: body.foto_barang || null,
        }]);
        if (insErr) {
          if (insErr.code === 'PGRST205' || insErr.message?.includes('schema cache') || insErr.message?.includes('does not exist')) {
            return NextResponse.json({ success: false, error: 'Tabel catatan_penelitian_nota belum dibuat. Jalankan supabase_catatan_penelitian_nota_migration.sql di Supabase SQL Editor.' }, { status: 400 });
          }
          throw insErr;
        }
        if (body.foto_nota) parentUpdate.foto_bukti_1 = joinUrls(parent.foto_bukti_1, body.foto_nota);
        if (body.foto_barang) parentUpdate.foto_bukti_3 = joinUrls(parent.foto_bukti_3, body.foto_barang);
      }

      if (action === 'update_nota') {
        if (!body.nota_id) return NextResponse.json({ success: false, error: 'nota_id wajib untuk update nota' }, { status: 400 });
        const rows = Array.isArray(body.items) ? body.items : [];
        const cleanItems = rows
          .map((r: any) => ({
            nama: String(r.nama || '').trim(),
            qty: Number(r.qty) || 0,
            satuan: String(r.satuan || '').trim(),
            harga: Number(r.harga) || 0,
          }))
          .filter((r: any) => r.nama && r.qty > 0);
        const total = cleanItems.reduce((s: number, r: any) => s + r.qty * r.harga, 0);
        if (cleanItems.length === 0 || total <= 0) {
          return NextResponse.json({ success: false, error: 'Isi minimal satu rincian barang dengan volume & harga' }, { status: 400 });
        }

        const notaUpdate: any = {
          tanggal_nota: body.tanggal_nota || new Date().toISOString().split('T')[0],
          toko: body.toko ? String(body.toko).trim() : null,
          keterangan: body.keterangan ? String(body.keterangan).trim() : null,
          items: cleanItems,
          total,
        };
        if (body.foto_nota !== undefined) notaUpdate.foto_nota = body.foto_nota || null;
        if (body.foto_barang !== undefined) notaUpdate.foto_barang = body.foto_barang || null;

        const { error: updNotaErr } = await supabaseAdmin
          .from('catatan_penelitian_nota')
          .update(notaUpdate)
          .eq('id', body.nota_id);
        if (updNotaErr) throw updNotaErr;

        if (body.foto_nota) parentUpdate.foto_bukti_1 = joinUrls(parent.foto_bukti_1, body.foto_nota);
        if (body.foto_barang) parentUpdate.foto_bukti_3 = joinUrls(parent.foto_bukti_3, body.foto_barang);
      }

      if (action === 'buka_kembali') {
        // Pastikan realisasi lama (sebelum fitur nota bertahap) tidak hilang: jadikan satu nota
        const { count } = await supabaseAdmin
          .from('catatan_penelitian_nota').select('id', { count: 'exact', head: true }).eq('kasbon_id', kasbonId);
        const oldReal = Number(parent.nominal_realisasi || 0);
        if ((count || 0) === 0 && oldReal > 0) {
          await supabaseAdmin.from('catatan_penelitian_nota').insert([{
            kasbon_id: kasbonId,
            tanggal_nota: parent.tanggal_penyelesaian || parent.tanggal_transaksi,
            toko: null,
            keterangan: 'Nota penyelesaian sebelumnya',
            items: [{ nama: parent.catatan_penyelesaian || 'Belanja sesuai penyelesaian sebelumnya', qty: 1, satuan: 'paket', harga: oldReal }],
            total: oldReal,
          }]);
        }
        parentUpdate.status_kasbon = 'Menunggu Nota';
        parentUpdate.tanggal_penyelesaian = null;
      }

      // Hitung ulang total belanja dari semua nota
      const { data: allNota } = await supabaseAdmin
        .from('catatan_penelitian_nota').select('total').eq('kasbon_id', kasbonId);
      const realisasi = (allNota || []).reduce((s: number, n: any) => s + Number(n.total || 0), 0);
      parentUpdate.nominal_realisasi = realisasi;
      parentUpdate.selisih_kasbon = kasbonVal - realisasi;

      const shouldClose = action === 'tutup_kasbon' || (action === 'tambah_nota' && body.tutup === true);
      if (shouldClose) {
        parentUpdate.status_kasbon = 'Selesai';
        parentUpdate.nominal = realisasi > 0 ? realisasi : kasbonVal;
        parentUpdate.tanggal_penyelesaian = body.tanggal_penyelesaian || body.tanggal_nota || new Date().toISOString().split('T')[0];
        if (body.catatan_penyelesaian !== undefined) {
          parentUpdate.catatan_penyelesaian = body.catatan_penyelesaian ? String(body.catatan_penyelesaian).trim() : null;
        }
      } else if (parent.status_kasbon === 'Selesai' && action !== 'hapus_nota') {
        parentUpdate.status_kasbon = 'Menunggu Nota';
      }
      if (!shouldClose && (parentUpdate.status_kasbon || parent.status_kasbon) !== 'Selesai') {
        parentUpdate.nominal = kasbonVal;
      } else if (action === 'hapus_nota' && parent.status_kasbon === 'Selesai') {
        parentUpdate.nominal = realisasi > 0 ? realisasi : kasbonVal;
      }

      const { error: updErr } = await supabaseAdmin
        .from('catatan_penelitian').update(parentUpdate).eq('id', kasbonId);
      if (updErr) throw updErr;

      return NextResponse.json({ success: true, message: 'Nota kasbon berhasil diproses' });
    }

    // Aksi 1: Selesaikan Kasbon (Realisasi Nota setelah belanja/kegiatan)
    if (action === 'selesaikan_kasbon') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'ID transaksi kasbon wajib disertakan' }, { status: 400 });
      }

      const realisasiVal = Number(nominal_realisasi) || 0;
      const kasbonVal = Number(nominal_kasbon) || 0;
      const diffVal = kasbonVal - realisasiVal;

      const notaVal = foto_nota || foto_bukti_1 || null;
      const kegiatanVal = foto_kegiatan || foto_bukti_2 || null;
      const barangVal = foto_barang || foto_bukti_3 || null;
      const transferVal = foto_bukti_transfer || foto_bukti_4 || null;

      const updateData: any = {
        status_kasbon: 'Selesai',
        nominal_realisasi: realisasiVal,
        selisih_kasbon: diffVal,
        nominal: realisasiVal > 0 ? realisasiVal : kasbonVal, // update nominal belanja riil
        tanggal_penyelesaian: tanggal_penyelesaian || new Date().toISOString().split('T')[0],
        catatan_penyelesaian: catatan_penyelesaian ? catatan_penyelesaian.trim() : null,
        updated_at: new Date().toISOString()
      };

      if (notaVal) updateData.foto_bukti_1 = notaVal;
      if (kegiatanVal) updateData.foto_bukti_2 = kegiatanVal;
      if (barangVal) updateData.foto_bukti_3 = barangVal;
      if (transferVal) updateData.foto_bukti_4 = transferVal;

      const { data, error } = await supabaseAdmin
        .from('catatan_penelitian')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Fallback update in-memory
        const idx = inMemoryStore.findIndex(item => String(item.id) === String(id));
        if (idx !== -1) {
          inMemoryStore[idx] = { ...inMemoryStore[idx], ...updateData };
          return NextResponse.json({ success: true, data: inMemoryStore[idx], message: 'Kasbon berhasil diselesaikan' });
        }
        throw error;
      }

      const resItem = {
        ...data,
        foto_nota: data.foto_bukti_1,
        foto_kegiatan: data.foto_bukti_2,
        foto_barang: data.foto_bukti_3,
        foto_bukti_transfer: data.foto_bukti_4
      };

      return NextResponse.json({ 
        success: true, 
        data: resItem, 
        message: `Kasbon #${id} berhasil diselesaikan dengan bukti nota!` 
      });
    }

    // Aksi 2: Input Transaksi Baru (Kasbon Baru atau Pengeluaran Langsung)
    const nominalNum = Number(nominal || nominal_kasbon || 0);
    if (!nominalNum || isNaN(nominalNum) || nominalNum <= 0) {
      return NextResponse.json({ success: false, error: 'Nominal wajib diisi dengan angka valid' }, { status: 400 });
    }
    if (!uraian || !uraian.trim()) {
      return NextResponse.json({ success: false, error: 'Uraian rincian kegiatan/tujuan kasbon wajib diisi' }, { status: 400 });
    }

    const isKasbon = tipe_transaksi === 'Kasbon';
    const initStatusKasbon = isKasbon ? (status_kasbon || 'Menunggu Nota') : 'Selesai';
    const initNominalKasbon = isKasbon ? nominalNum : 0;
    const initNominalRealisasi = isKasbon ? (initStatusKasbon === 'Selesai' ? Number(nominal_realisasi || nominalNum) : 0) : nominalNum;
    const initSelisih = isKasbon ? (initNominalKasbon - initNominalRealisasi) : 0;

    const notaVal = foto_nota || foto_bukti_1 || null;
    const kegiatanVal = foto_kegiatan || foto_bukti_2 || null;
    const barangVal = foto_barang || foto_bukti_3 || null;
    const transferVal = foto_bukti_transfer || foto_bukti_4 || null;

    const record = {
      tanggal_transaksi: tanggal_transaksi || new Date().toISOString().split('T')[0],
      kategori: kategori || 'Penelitian',
      nominal: isKasbon && initStatusKasbon === 'Menunggu Nota' ? initNominalKasbon : (initNominalRealisasi || nominalNum),
      uraian: uraian.trim(),
      catatan: catatan ? catatan.trim() : null,
      tipe_transaksi: isKasbon ? 'Kasbon' : 'Pengeluaran Langsung',
      status_kasbon: initStatusKasbon,
      nama_penerima: nama_penerima ? nama_penerima.trim() : null,
      nominal_kasbon: initNominalKasbon,
      nominal_realisasi: initNominalRealisasi,
      selisih_kasbon: initSelisih,
      tanggal_penyelesaian: initStatusKasbon === 'Selesai' ? (tanggal_penyelesaian || tanggal_transaksi) : null,
      catatan_penyelesaian: catatan_penyelesaian ? catatan_penyelesaian.trim() : null,
      foto_bukti_1: notaVal,
      foto_bukti_2: kegiatanVal,
      foto_bukti_3: barangVal,
      foto_bukti_4: transferVal,
      created_by: created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('catatan_penelitian')
      .insert([record])
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        const fallbackItem = { ...record, id: Date.now() };
        inMemoryStore.unshift(fallbackItem);
        return NextResponse.json({
          success: true,
          data: fallbackItem,
          tableNotCreated: true,
          message: 'Disimpan di memori lokal. Silakan jalankan script supabase_catatan_penelitian_migration.sql di Supabase SQL Editor untuk penyimpanan permanen.'
        });
      }
      throw error;
    }

    const resItem = {
      ...data,
      foto_nota: data.foto_bukti_1,
      foto_kegiatan: data.foto_bukti_2,
      foto_barang: data.foto_bukti_3,
      foto_bukti_transfer: data.foto_bukti_4
    };

    return NextResponse.json({ 
      success: true, 
      data: resItem, 
      tableNotCreated: false,
      message: isKasbon 
        ? `Kasbon sebesar Rp ${nominalNum.toLocaleString('id-ID')} berhasil dicatat (Menunggu Nota)!` 
        : 'Transaksi pengeluaran berhasil disimpan!'
    });
  } catch (err: any) {
    console.error('Error in POST /api/catatan-penelitian:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      tanggal_transaksi, 
      kategori, 
      nominal, 
      uraian, 
      catatan, 
      tipe_transaksi,
      status_kasbon,
      nama_penerima,
      nominal_kasbon,
      nominal_realisasi,
      selisih_kasbon,
      tanggal_penyelesaian,
      catatan_penyelesaian,
      foto_nota,
      foto_kegiatan,
      foto_barang,
      foto_bukti_transfer,
      foto_bukti_1, 
      foto_bukti_2, 
      foto_bukti_3, 
      foto_bukti_4
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi diperlukan untuk update' }, { status: 400 });
    }

    const notaVal = foto_nota !== undefined ? foto_nota : foto_bukti_1;
    const kegiatanVal = foto_kegiatan !== undefined ? foto_kegiatan : foto_bukti_2;
    const barangVal = foto_barang !== undefined ? foto_barang : foto_bukti_3;
    const transferVal = foto_bukti_transfer !== undefined ? foto_bukti_transfer : foto_bukti_4;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (tanggal_transaksi !== undefined) updateData.tanggal_transaksi = tanggal_transaksi;
    if (kategori !== undefined) updateData.kategori = kategori;
    if (nominal !== undefined) updateData.nominal = Number(nominal);
    if (uraian !== undefined) updateData.uraian = uraian.trim();
    if (catatan !== undefined) updateData.catatan = catatan ? catatan.trim() : null;
    
    if (tipe_transaksi !== undefined) updateData.tipe_transaksi = tipe_transaksi;
    if (status_kasbon !== undefined) updateData.status_kasbon = status_kasbon;
    if (nama_penerima !== undefined) updateData.nama_penerima = nama_penerima ? nama_penerima.trim() : null;
    if (nominal_kasbon !== undefined) updateData.nominal_kasbon = Number(nominal_kasbon);
    if (nominal_realisasi !== undefined) updateData.nominal_realisasi = Number(nominal_realisasi);
    if (selisih_kasbon !== undefined) updateData.selisih_kasbon = Number(selisih_kasbon);
    if (tanggal_penyelesaian !== undefined) updateData.tanggal_penyelesaian = tanggal_penyelesaian;
    if (catatan_penyelesaian !== undefined) updateData.catatan_penyelesaian = catatan_penyelesaian;

    if (notaVal !== undefined) updateData.foto_bukti_1 = notaVal;
    if (kegiatanVal !== undefined) updateData.foto_bukti_2 = kegiatanVal;
    if (barangVal !== undefined) updateData.foto_bukti_3 = barangVal;
    if (transferVal !== undefined) updateData.foto_bukti_4 = transferVal;

    const { data, error } = await supabaseAdmin
      .from('catatan_penelitian')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      // Fallback update in-memory
      const idx = inMemoryStore.findIndex(item => String(item.id) === String(id));
      if (idx !== -1) {
        inMemoryStore[idx] = { ...inMemoryStore[idx], ...updateData };
        return NextResponse.json({ success: true, data: inMemoryStore[idx] });
      }
      throw error;
    }

    const resItem = {
      ...data,
      foto_nota: data.foto_bukti_1,
      foto_kegiatan: data.foto_bukti_2,
      foto_barang: data.foto_bukti_3,
      foto_bukti_transfer: data.foto_bukti_4
    };

    return NextResponse.json({ success: true, data: resItem });
  } catch (err: any) {
    console.error('Error in PUT /api/catatan-penelitian:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Parameter ID transaksi diperlukan' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('catatan_penelitian')
      .delete()
      .eq('id', id);

    if (error) {
      // Fallback
      inMemoryStore = inMemoryStore.filter(item => String(item.id) !== String(id));
      return NextResponse.json({ success: true, deletedId: id });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error in DELETE /api/catatan-penelitian:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
