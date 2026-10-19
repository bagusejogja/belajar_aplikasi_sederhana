import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const R2_FOLDER = 'rekening_koran_masjid';
const KATEGORI_ID = 6; // Rekening Koran Masjid

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export interface RekeningKoranItem {
  id: string;
  tahun: number;
  bulan: number; // 1-12
  nama_bulan: string;
  rekening_id?: string | number;
  nama_bank: string;
  nomor_rekening: string;
  nama_rekening: string;
  nama_pemilik?: string;
  tipe_sumber: 'file' | 'link';
  file_url: string;
  file_name: string;
  file_type: 'pdf' | 'excel' | 'csv';
  file_size?: string;
  r2_key?: string;
  saldo_awal?: number | null;
  saldo_akhir?: number | null;
  keterangan?: string;
  uploader?: string;
  created_at: string;
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * GET: Ambil daftar rekening koran & master rekening masjid
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahunParam = searchParams.get('tahun');
    const rekeningParam = searchParams.get('rekening');

    // 1. Ambil data rekening koran dari app_arsip_kegiatan kategori_id = 6
    let query = supabase
      .from('app_arsip_kegiatan')
      .select('*')
      .eq('kategori_id', KATEGORI_ID)
      .order('tahun', { ascending: false });

    if (tahunParam && tahunParam !== 'ALL') {
      query = query.eq('tahun', Number(tahunParam));
    }

    const [arsipRes, refRekeningRes] = await Promise.all([
      query,
      supabase.from('ref_rekening').select('*').order('nama_bank', { ascending: true })
    ]);

    let rawRows = arsipRes.data || [];
    let accounts = refRekeningRes.data || [];

    // Jika belum ada data di database sama sekali, buatkan data awal (seed) tahun 2026 & 2025
    if (rawRows.length === 0) {
      const defaultAccount = accounts[0] || {
        nama_bank: 'Bank Syariah Indonesia (BSI)',
        nomor_rekening: '7666333211',
        nama_pemilik: 'MARDLIYYAH ISLAMIC CENTER'
      };

      const seedDocs2026: RekeningKoranItem[] = [
        {
          id: 'rk-2026-03-bsi-pdf',
          tahun: 2026,
          bulan: 3,
          nama_bulan: 'Maret',
          rekening_id: defaultAccount.id || 1,
          nama_bank: defaultAccount.nama_bank || 'Bank Syariah Indonesia (BSI)',
          nomor_rekening: defaultAccount.nomor_rekening || '7666333211',
          nama_rekening: defaultAccount.nama_pemilik || 'MARDLIYYAH ISLAMIC CENTER',
          tipe_sumber: 'file',
          file_url: 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev/rekening_koran_masjid/RK_2026_03_BSI_Operasional.pdf',
          file_name: 'Rekening_Koran_BSI_Maret_2026.pdf',
          file_type: 'pdf',
          file_size: '1.8 MB',
          r2_key: 'rekening_koran_masjid/RK_2026_03_BSI_Operasional.pdf',
          saldo_awal: 184500000,
          saldo_akhir: 215300000,
          keterangan: 'Rekening koran operasional bulan Maret 2026 (termasuk dana Tarhib & Ramadhan)',
          uploader: 'Admin Keuangan Masjid',
          created_at: new Date('2026-03-31T17:00:00Z').toISOString()
        },
        {
          id: 'rk-2026-03-bsi-xlsx',
          tahun: 2026,
          bulan: 3,
          nama_bulan: 'Maret',
          rekening_id: defaultAccount.id || 1,
          nama_bank: defaultAccount.nama_bank || 'Bank Syariah Indonesia (BSI)',
          nomor_rekening: defaultAccount.nomor_rekening || '7666333211',
          nama_rekening: defaultAccount.nama_pemilik || 'MARDLIYYAH ISLAMIC CENTER',
          tipe_sumber: 'file',
          file_url: 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev/rekening_koran_masjid/Ekspor_Mutasi_BSI_Maret_2026.xlsx',
          file_name: 'Ekspor_Mutasi_BSI_Maret_2026.xlsx',
          file_type: 'excel',
          file_size: '640 KB',
          r2_key: 'rekening_koran_masjid/Ekspor_Mutasi_BSI_Maret_2026.xlsx',
          saldo_awal: 184500000,
          saldo_akhir: 215300000,
          keterangan: 'Rincian transaksi mutasi debet/kredit Maret 2026',
          uploader: 'Admin Keuangan Masjid',
          created_at: new Date('2026-03-31T17:15:00Z').toISOString()
        },
        {
          id: 'rk-2026-02-bsi-pdf',
          tahun: 2026,
          bulan: 2,
          nama_bulan: 'Februari',
          rekening_id: defaultAccount.id || 1,
          nama_bank: defaultAccount.nama_bank || 'Bank Syariah Indonesia (BSI)',
          nomor_rekening: defaultAccount.nomor_rekening || '7666333211',
          nama_rekening: defaultAccount.nama_pemilik || 'MARDLIYYAH ISLAMIC CENTER',
          tipe_sumber: 'file',
          file_url: 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev/rekening_koran_masjid/RK_2026_02_BSI_Operasional.pdf',
          file_name: 'Rekening_Koran_BSI_Februari_2026.pdf',
          file_type: 'pdf',
          file_size: '1.4 MB',
          r2_key: 'rekening_koran_masjid/RK_2026_02_BSI_Operasional.pdf',
          saldo_awal: 162000000,
          saldo_akhir: 184500000,
          keterangan: 'Rekening koran operasional bulan Februari 2026 tuntas rekonsiliasi',
          uploader: 'Admin Keuangan Masjid',
          created_at: new Date('2026-02-28T16:00:00Z').toISOString()
        },
        {
          id: 'rk-2026-02-mandiri-csv',
          tahun: 2026,
          bulan: 2,
          nama_bulan: 'Februari',
          rekening_id: 2,
          nama_bank: 'Bank Mandiri Syariah',
          nomor_rekening: '137001928374',
          nama_rekening: 'MARDLIYYAH ISLAMIC CENTER (ZISWAF)',
          tipe_sumber: 'file',
          file_url: 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev/rekening_koran_masjid/Mutasi_Mandiri_Ziswaf_Feb2026.csv',
          file_name: 'Mutasi_Mandiri_Ziswaf_Feb2026.csv',
          file_type: 'csv',
          file_size: '280 KB',
          r2_key: 'rekening_koran_masjid/Mutasi_Mandiri_Ziswaf_Feb2026.csv',
          saldo_awal: 95000000,
          saldo_akhir: 112400000,
          keterangan: 'Mutasi rekening penerimaan ZISWAF Februari 2026',
          uploader: 'Staf Infaq Masjid',
          created_at: new Date('2026-02-28T16:30:00Z').toISOString()
        },
        {
          id: 'rk-2026-01-bsi-pdf',
          tahun: 2026,
          bulan: 1,
          nama_bulan: 'Januari',
          rekening_id: defaultAccount.id || 1,
          nama_bank: defaultAccount.nama_bank || 'Bank Syariah Indonesia (BSI)',
          nomor_rekening: defaultAccount.nomor_rekening || '7666333211',
          nama_rekening: defaultAccount.nama_pemilik || 'MARDLIYYAH ISLAMIC CENTER',
          tipe_sumber: 'link',
          file_url: 'https://drive.google.com/file/d/1yA6a2k9c_SampleGDriveLink/view',
          file_name: 'Tautan Google Drive RK BSI Januari 2026.pdf',
          file_type: 'pdf',
          file_size: 'Tautan Cloud Link',
          saldo_awal: 145000000,
          saldo_akhir: 162000000,
          keterangan: 'Arsip rekening koran pembuka tahun buku 2026 diunggah via link Google Drive',
          uploader: 'Admin Keuangan Masjid',
          created_at: new Date('2026-01-31T15:00:00Z').toISOString()
        }
      ];

      // Simpan seed awal ke database
      await supabaseAdmin.from('app_arsip_kegiatan').insert([
        {
          kategori_id: KATEGORI_ID,
          tahun: 2026,
          catatan: 'Rekening Koran Bulanan Kas Masjid Kampus',
          fase_dokumen: seedDocs2026
        }
      ]);

      const seedDocs2025: RekeningKoranItem[] = [
        {
          id: 'rk-2025-12-bsi-pdf',
          tahun: 2025,
          bulan: 12,
          nama_bulan: 'Desember',
          rekening_id: defaultAccount.id || 1,
          nama_bank: defaultAccount.nama_bank || 'Bank Syariah Indonesia (BSI)',
          nomor_rekening: defaultAccount.nomor_rekening || '7666333211',
          nama_rekening: defaultAccount.nama_pemilik || 'MARDLIYYAH ISLAMIC CENTER',
          tipe_sumber: 'file',
          file_url: 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev/rekening_koran_masjid/RK_2025_12_BSI_TutupTahun.pdf',
          file_name: 'RK_2025_12_BSI_TutupTahun.pdf',
          file_type: 'pdf',
          file_size: '2.1 MB',
          r2_key: 'rekening_koran_masjid/RK_2025_12_BSI_TutupTahun.pdf',
          saldo_awal: 130000000,
          saldo_akhir: 145000000,
          keterangan: 'Laporan rekening koran tutup buku tahun 2025',
          uploader: 'Admin Keuangan Masjid',
          created_at: new Date('2025-12-31T18:00:00Z').toISOString()
        }
      ];

      await supabaseAdmin.from('app_arsip_kegiatan').insert([
        {
          kategori_id: KATEGORI_ID,
          tahun: 2025,
          catatan: 'Rekening Koran Bulanan Kas Masjid Kampus',
          fase_dokumen: seedDocs2025
        }
      ]);

      const reQuery = await supabase
        .from('app_arsip_kegiatan')
        .select('*')
        .eq('kategori_id', KATEGORI_ID)
        .order('tahun', { ascending: false });
      rawRows = reQuery.data || [];
    }

    // Flatten all documents from all years
    let allDocuments: RekeningKoranItem[] = [];
    rawRows.forEach((row: any) => {
      let docs: RekeningKoranItem[] = [];
      if (Array.isArray(row.fase_dokumen)) {
        docs = row.fase_dokumen;
      } else if (typeof row.fase_dokumen === 'string') {
        try {
          docs = JSON.parse(row.fase_dokumen);
        } catch {
          docs = [];
        }
      }

      docs.forEach((d) => {
        // Pastikan memiliki atribut tahun konsisten
        allDocuments.push({
          ...d,
          tahun: d.tahun || row.tahun
        });
      });
    });

    // Urutkan dokumen: Tahun DESC -> Bulan DESC -> Created At DESC
    allDocuments.sort((a, b) => {
      if (b.tahun !== a.tahun) return b.tahun - a.tahun;
      if (b.bulan !== a.bulan) return b.bulan - a.bulan;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Filter per rekening jika ada param
    if (rekeningParam && rekeningParam !== 'ALL') {
      allDocuments = allDocuments.filter(d => 
        String(d.nomor_rekening) === rekeningParam || 
        String(d.rekening_id) === rekeningParam
      );
    }

    return NextResponse.json({
      success: true,
      data: allDocuments,
      accounts: accounts
    });
  } catch (err: any) {
    console.error('Error fetching rekening koran:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST: Unggah file baru ke Cloudflare R2 folder `rekening_koran_masjid` ATAU simpan Tautan Link
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let itemData: Partial<RekeningKoranItem> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const tipe_sumber = (formData.get('tipe_sumber') as string) || 'file';
      const tahun = Number(formData.get('tahun')) || new Date().getFullYear();
      const bulan = Number(formData.get('bulan')) || (new Date().getMonth() + 1);
      const nama_bank = (formData.get('nama_bank') as string) || 'Bank Syariah Indonesia (BSI)';
      const nomor_rekening = (formData.get('nomor_rekening') as string) || '7666333211';
      const nama_rekening = (formData.get('nama_rekening') as string) || 'MARDLIYYAH ISLAMIC CENTER';
      const rekening_id = (formData.get('rekening_id') as string) || '';
      const saldo_awal = formData.get('saldo_awal') ? Number(formData.get('saldo_awal')) : null;
      const saldo_akhir = formData.get('saldo_akhir') ? Number(formData.get('saldo_akhir')) : null;
      const keterangan = (formData.get('keterangan') as string) || '';
      const uploader = (formData.get('uploader') as string) || 'Admin Keuangan';

      if (tipe_sumber === 'file') {
        if (!file) {
          return NextResponse.json({ success: false, error: 'File dokumen harus dipilih!' }, { status: 400 });
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType: 'pdf' | 'excel' | 'csv' = 'pdf';
        if (['xlsx', 'xls'].includes(ext)) fileType = 'excel';
        else if (ext === 'csv') fileType = 'csv';
        else if (ext === 'pdf') fileType = 'pdf';
        else {
          return NextResponse.json({ 
            success: false, 
            error: `Format .${ext} tidak didukung. Mohon gunakan PDF, Excel (.xlsx, .xls), atau CSV.` 
          }, { status: 400 });
        }

        // Simpan ke folder tersendiri di Cloudflare R2: `rekening_koran_masjid`
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const cleanNoRek = nomor_rekening.replace(/[^a-zA-Z0-9]/g, '');
        const r2FileName = `RK_${tahun}_B${String(bulan).padStart(2, '0')}_${cleanNoRek}_${Date.now()}.${ext}`;
        const key = `${R2_FOLDER}/${r2FileName}`;

        await r2.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME || 'lampiran-aplikasi',
          Key: key,
          Body: buffer,
          ContentType: file.type || 'application/octet-stream',
        }));

        const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
        const publicUrl = `${domain}/${key}`;

        // Format ukuran file
        const sizeBytes = file.size;
        const sizeFormatted = sizeBytes > 1024 * 1024 
          ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(sizeBytes / 1024)} KB`;

        itemData = {
          id: `rk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tahun,
          bulan,
          nama_bulan: NAMA_BULAN[bulan - 1] || `Bulan ${bulan}`,
          rekening_id,
          nama_bank,
          nomor_rekening,
          nama_rekening,
          tipe_sumber: 'file',
          file_url: publicUrl,
          file_name: file.name,
          file_type: fileType,
          file_size: sizeFormatted,
          r2_key: key,
          saldo_awal,
          saldo_akhir,
          keterangan,
          uploader,
          created_at: new Date().toISOString()
        };
      } else {
        // Tipe Link dari form-data
        const linkUrl = (formData.get('link_url') as string) || '';
        const linkJudul = (formData.get('link_judul') as string) || 'Tautan Rekening Koran';
        const file_type = (formData.get('file_type') as 'pdf' | 'excel' | 'csv') || 'pdf';

        if (!linkUrl.trim()) {
          return NextResponse.json({ success: false, error: 'Alamat URL / Tautan harus diisi!' }, { status: 400 });
        }

        itemData = {
          id: `rk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tahun,
          bulan,
          nama_bulan: NAMA_BULAN[bulan - 1] || `Bulan ${bulan}`,
          rekening_id,
          nama_bank,
          nomor_rekening,
          nama_rekening,
          tipe_sumber: 'link',
          file_url: linkUrl.trim(),
          file_name: linkJudul.trim(),
          file_type,
          file_size: 'Tautan Eksternal',
          saldo_awal,
          saldo_akhir,
          keterangan,
          uploader,
          created_at: new Date().toISOString()
        };
      }
    } else {
      // JSON body (Link upload atau manual payload)
      const body = await req.json();
      const {
        tahun = new Date().getFullYear(),
        bulan = new Date().getMonth() + 1,
        nama_bank = 'Bank Syariah Indonesia (BSI)',
        nomor_rekening = '7666333211',
        nama_rekening = 'MARDLIYYAH ISLAMIC CENTER',
        rekening_id,
        link_url,
        file_name = 'Tautan Rekening Koran Online',
        file_type = 'pdf',
        saldo_awal = null,
        saldo_akhir = null,
        keterangan = '',
        uploader = 'Admin Keuangan'
      } = body;

      if (!link_url) {
        return NextResponse.json({ success: false, error: 'Link URL wajib diisi!' }, { status: 400 });
      }

      itemData = {
        id: `rk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tahun: Number(tahun),
        bulan: Number(bulan),
        nama_bulan: NAMA_BULAN[Number(bulan) - 1] || `Bulan ${bulan}`,
        rekening_id,
        nama_bank,
        nomor_rekening,
        nama_rekening,
        tipe_sumber: 'link',
        file_url: link_url.trim(),
        file_name,
        file_type,
        file_size: 'Tautan Eksternal',
        saldo_awal,
        saldo_akhir,
        keterangan,
        uploader,
        created_at: new Date().toISOString()
      };
    }

    const targetTahun = itemData.tahun || new Date().getFullYear();

    // 2. Simpan ke database Supabase (app_arsip_kegiatan kategori_id: 6)
    const { data: existingRow, error: fetchErr } = await supabaseAdmin
      .from('app_arsip_kegiatan')
      .select('*')
      .eq('kategori_id', KATEGORI_ID)
      .eq('tahun', targetTahun)
      .maybeSingle();

    if (fetchErr) {
      console.error("Fetch arsip error:", fetchErr);
    }

    if (existingRow) {
      let currentDocs: any[] = [];
      if (Array.isArray(existingRow.fase_dokumen)) {
        currentDocs = existingRow.fase_dokumen;
      } else if (typeof existingRow.fase_dokumen === 'string') {
        try { currentDocs = JSON.parse(existingRow.fase_dokumen); } catch { currentDocs = []; }
      }
      currentDocs.unshift(itemData);

      const { error: updateErr } = await supabaseAdmin
        .from('app_arsip_kegiatan')
        .update({ fase_dokumen: currentDocs })
        .eq('id', existingRow.id);

      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from('app_arsip_kegiatan')
        .insert([{
          kategori_id: KATEGORI_ID,
          tahun: targetTahun,
          catatan: 'Rekening Koran Bulanan Kas Masjid Kampus',
          fase_dokumen: [itemData]
        }]);

      if (insertErr) throw insertErr;
    }

    return NextResponse.json({
      success: true,
      message: 'Rekening koran berhasil disimpan ke arsip masjid!',
      data: itemData
    });
  } catch (err: any) {
    console.error('Error posting rekening koran:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * DELETE: Hapus dokumen rekening koran dari database & storage Cloudflare R2
 */
export async function DELETE(req: NextRequest) {
  try {
    const { id, tahun, r2_key } = await req.json();

    if (!id || !tahun) {
      return NextResponse.json({ success: false, error: 'ID dan Tahun dokumen wajib disertakan!' }, { status: 400 });
    }

    // 1. Ambil data baris tahun terkait di Supabase
    const { data: existingRow, error: fetchErr } = await supabaseAdmin
      .from('app_arsip_kegiatan')
      .select('*')
      .eq('kategori_id', KATEGORI_ID)
      .eq('tahun', Number(tahun))
      .maybeSingle();

    if (fetchErr || !existingRow) {
      return NextResponse.json({ success: false, error: 'Data arsip tahun tersebut tidak ditemukan' }, { status: 404 });
    }

    let currentDocs: any[] = [];
    if (Array.isArray(existingRow.fase_dokumen)) {
      currentDocs = existingRow.fase_dokumen;
    } else if (typeof existingRow.fase_dokumen === 'string') {
      try { currentDocs = JSON.parse(existingRow.fase_dokumen); } catch { currentDocs = []; }
    }

    const updatedDocs = currentDocs.filter((d: any) => d.id !== id);

    await supabaseAdmin
      .from('app_arsip_kegiatan')
      .update({ fase_dokumen: updatedDocs })
      .eq('id', existingRow.id);

    // 2. Hapus file fisik dari Cloudflare R2 jika ada r2_key
    if (r2_key && r2_key.startsWith(R2_FOLDER)) {
      try {
        await r2.send(new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME || 'lampiran-aplikasi',
          Key: r2_key,
        }));
      } catch (r2DelErr) {
        console.warn('Gagal menghapus file dari Cloudflare R2:', r2DelErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Arsip rekening koran berhasil dihapus!'
    });
  } catch (err: any) {
    console.error('Error deleting rekening koran:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
