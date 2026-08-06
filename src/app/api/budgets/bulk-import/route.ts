import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split('Bearer ')[1] || '';
    
    // Authenticated client scoped to the current request user token
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { rawText } = await request.json();
    if (!rawText) {
      return NextResponse.json({ success: false, error: 'Teks kosong' }, { status: 400 });
    }

    const lines = rawText.trim().split('\n');
    if (lines.length < 2) {
      return NextResponse.json({ success: false, error: 'Data tidak lengkap atau tidak ada header' }, { status: 400 });
    }

    const headers = lines[0].split('\t').map((h: string) => h.trim());
    
    // Cari index kolom yang kita butuhkan
    const unitKerjaIdx = headers.findIndex((h: string) => h === 'unitkerjaNama');
    const akunIdx = headers.findIndex((h: string) => h === 'akun');
    const komponenIdx = headers.findIndex((h: string) => h === 'komponen_nama');
    const deskripsiIdx = headers.findIndex((h: string) => h === 'usulan_pagu_indikatif_anggaran_deskripsi');
    const lingkupIdx = headers.findIndex((h: string) => h === 'usulan_pagu_indikatif_lingkup');
    const maksudIdx = headers.findIndex((h: string) => h === 'usulan_pagu_indikatif_maksud_tujuan');
    const totalIdx = headers.findIndex((h: string) => h === 'total');

    if (unitKerjaIdx === -1 || akunIdx === -1 || deskripsiIdx === -1 || totalIdx === -1) {
      return NextResponse.json({ success: false, error: 'Kolom wajib (unitkerjaNama, akun, deskripsi, total) tidak ditemukan di header' }, { status: 400 });
    }

    const budgetsToInsert = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cells = lines[i].split('\t');
      
      // Bersihkan format angka (misal " 15.000.000,00 " menjadi 15000000)
      let rawTotal = cells[totalIdx] || '0';
      rawTotal = rawTotal.replace(/\./g, '').replace(/,/g, '.').trim();
      const totalParsed = parseFloat(rawTotal);

      budgetsToInsert.push({
        unitkerja_nama: cells[unitKerjaIdx]?.trim(),
        akun: cells[akunIdx]?.trim(),
        komponen_nama: komponenIdx !== -1 ? cells[komponenIdx]?.trim() : '',
        deskripsi: cells[deskripsiIdx]?.trim(),
        lingkup: lingkupIdx !== -1 ? cells[lingkupIdx]?.trim() : '',
        maksud_tujuan: maksudIdx !== -1 ? cells[maksudIdx]?.trim() : '',
        total: isNaN(totalParsed) ? 0 : totalParsed,
        // Status awal kunci N
        kunci: 'N'
      });
    }

    // Bulk insert ke database (Menggunakan RLS, jadi user hanya bisa memasukkan unit kerjanya sendiri)
    const { data: insertedData, error } = await supabaseUser
      .from('budgets')
      .insert(budgetsToInsert)
      .select('id, unitkerja_nama, akun, komponen_nama, deskripsi, total');

    if (error) {
      throw new Error(`Gagal menyimpan ke database: ${error.message}`);
    }

    // Panggil proses review (Rule Engine + AI) secara background (tidak perlu await)
    // Di lingkungan produksi sesungguhnya, sebaiknya gunakan message queue (seperti Inngest/BullMQ)
    if (insertedData && insertedData.length > 0) {
      // Kita panggil localhost API kita sendiri untuk background processing
      // Karena kita di server, kita gunakan URL absolut. Untuk memastikannya berjalan, 
      // kita asumsi berjalan di localhost:3000 atau VERCEL_URL
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      
      insertedData.forEach((budget) => {
        fetch(`${baseUrl}/api/budgets/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(budget)
        }).catch(console.error);
      });
    }

    return NextResponse.json({ 
      success: true, 
      count: budgetsToInsert.length 
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
