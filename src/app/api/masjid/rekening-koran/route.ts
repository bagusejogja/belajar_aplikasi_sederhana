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
 * GET: Ambil daftar rekening koran & master rekening masjid dari ref_rekening
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
      supabase.from('ref_rekening').select('*').order('id', { ascending: true })
    ]);

    let rawRows = arsipRes.data || [];
    let accounts = refRekeningRes.data || [];

    // Flatten all documents from all years
    let allDocuments: RekeningKoranItem[] = [];
    const seenIds = new Set<string>();

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
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          allDocuments.push({
            ...d,
            tahun: d.tahun || row.tahun
          });
        }
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
 * POST: Unggah berkas fisik (bisa hingga 3 file sekaligus: PDF, Excel, CSV) ATAU tautan link
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const newItems: RekeningKoranItem[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const tipe_sumber = (formData.get('tipe_sumber') as string) || 'file';
      const tahun = Number(formData.get('tahun')) || new Date().getFullYear();
      const bulan = Number(formData.get('bulan')) || (new Date().getMonth() + 1);
      const nama_bank = (formData.get('nama_bank') as string) || 'Bank Syariah Indonesia (BSI)';
      const nomor_rekening = (formData.get('nomor_rekening') as string) || '7666333211';
      const nama_rekening = (formData.get('nama_rekening') as string) || 'MARDLIYYAH ISLAMIC CENTER';
      const rekening_id = (formData.get('rekening_id') as string) || '1';
      const saldo_awal = formData.get('saldo_awal') ? Number(formData.get('saldo_awal')) : null;
      const saldo_akhir = formData.get('saldo_akhir') ? Number(formData.get('saldo_akhir')) : null;
      const keterangan = (formData.get('keterangan') as string) || '';
      const uploader = (formData.get('uploader') as string) || 'Admin Keuangan';

      const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
      const cleanNoRek = nomor_rekening.replace(/[^a-zA-Z0-9]/g, '');

      if (tipe_sumber === 'file') {
        // Kumpulkan file dari slot terpisah atau getAll('files')
        const filesToProcess: { file: File; forcedType?: 'pdf' | 'excel' | 'csv' }[] = [];

        const filePdf = formData.get('file_pdf') as File | null;
        const fileExcel = formData.get('file_excel') as File | null;
        const fileCsv = formData.get('file_csv') as File | null;
        const singleFile = formData.get('file') as File | null;
        const allFiles = formData.getAll('files') as File[];

        if (filePdf && filePdf.size > 0) filesToProcess.push({ file: filePdf, forcedType: 'pdf' });
        if (fileExcel && fileExcel.size > 0) filesToProcess.push({ file: fileExcel, forcedType: 'excel' });
        if (fileCsv && fileCsv.size > 0) filesToProcess.push({ file: fileCsv, forcedType: 'csv' });

        if (filesToProcess.length === 0) {
          if (singleFile && singleFile.size > 0) {
            filesToProcess.push({ file: singleFile });
          } else if (allFiles && allFiles.length > 0) {
            allFiles.forEach(f => {
              if (f && f.size > 0) filesToProcess.push({ file: f });
            });
          }
        }

        if (filesToProcess.length === 0) {
          return NextResponse.json({ success: false, error: 'Minimal pilih 1 file dokumen rekening koran!' }, { status: 400 });
        }

        for (const item of filesToProcess) {
          const file = item.file;
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          let fileType: 'pdf' | 'excel' | 'csv' = 'pdf';

          if (item.forcedType) {
            fileType = item.forcedType;
          } else if (['xlsx', 'xls'].includes(ext)) {
            fileType = 'excel';
          } else if (ext === 'csv') {
            fileType = 'csv';
          } else if (ext === 'pdf') {
            fileType = 'pdf';
          } else {
            continue; // Abaikan format yang tidak didukung
          }

          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const timestamp = Date.now();
          const r2FileName = `RK_${tahun}_B${String(bulan).padStart(2, '0')}_${cleanNoRek}_${fileType}_${timestamp}.${ext}`;
          const key = `${R2_FOLDER}/${r2FileName}`;

          await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'lampiran-aplikasi',
            Key: key,
            Body: buffer,
            ContentType: file.type || 'application/octet-stream',
          }));

          const publicUrl = `${domain}/${key}`;
          const sizeBytes = file.size;
          const sizeFormatted = sizeBytes > 1024 * 1024 
            ? `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB` 
            : `${Math.round(sizeBytes / 1024)} KB`;

          newItems.push({
            id: `rk-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
            tahun,
            bulan,
            nama_bulan: NAMA_BULAN[bulan - 1] || `Bulan ${bulan}`,
            rekening_id,
            nama_bank,
            nomor_rekening,
            nama_rekening,
            nama_pemilik: nama_rekening,
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
          });
        }
      } else {
        // Tipe Link dari Form Data (Bisa multiple link per ekstensi)
        const linkPdf = (formData.get('link_pdf') as string) || '';
        const linkExcel = (formData.get('link_excel') as string) || '';
        const linkCsv = (formData.get('link_csv') as string) || '';
        const singleLink = (formData.get('link_url') as string) || '';
        const defaultJudul = (formData.get('link_judul') as string) || '';

        const linksToProcess: { url: string; type: 'pdf' | 'excel' | 'csv'; judul?: string }[] = [];

        if (linkPdf.trim()) linksToProcess.push({ url: linkPdf.trim(), type: 'pdf', judul: defaultJudul ? `${defaultJudul} (PDF)` : '' });
        if (linkExcel.trim()) linksToProcess.push({ url: linkExcel.trim(), type: 'excel', judul: defaultJudul ? `${defaultJudul} (Excel)` : '' });
        if (linkCsv.trim()) linksToProcess.push({ url: linkCsv.trim(), type: 'csv', judul: defaultJudul ? `${defaultJudul} (CSV)` : '' });

        if (linksToProcess.length === 0 && singleLink.trim()) {
          const type = (formData.get('file_type') as any) || 'pdf';
          linksToProcess.push({ url: singleLink.trim(), type, judul: defaultJudul });
        }

        // Tautan tambahan / dynamic links jika dikirimkan sebagai JSON string
        const extraLinksRaw = formData.get('extra_links') as string | null;
        if (extraLinksRaw) {
          try {
            const extraLinks = JSON.parse(extraLinksRaw);
            if (Array.isArray(extraLinks)) {
              extraLinks.forEach((el: any) => {
                if (el.url && el.url.trim()) {
                  linksToProcess.push({
                    url: el.url.trim(),
                    type: el.type || 'pdf',
                    judul: el.judul || defaultJudul
                  });
                }
              });
            }
          } catch {
            // ignore parse error
          }
        }

        if (linksToProcess.length === 0) {
          return NextResponse.json({ success: false, error: 'Silakan isi minimal satu tautan link dokumen!' }, { status: 400 });
        }

        const yy = String(tahun).slice(-2);
        const mm = String(bulan).padStart(2, '0');
        const autoBaseJudul = `[${yy}_${mm}] [${rekening_id}]_${nama_bank}_${nomor_rekening}_${nama_rekening}`;

        for (const item of linksToProcess) {
          const finalJudul = item.judul?.trim() || `${autoBaseJudul}.${item.type}`;
          newItems.push({
            id: `rk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tahun,
            bulan,
            nama_bulan: NAMA_BULAN[bulan - 1] || `Bulan ${bulan}`,
            rekening_id,
            nama_bank,
            nomor_rekening,
            nama_rekening,
            nama_pemilik: nama_rekening,
            tipe_sumber: 'link',
            file_url: item.url,
            file_name: finalJudul,
            file_type: item.type,
            file_size: 'Tautan Online',
            saldo_awal,
            saldo_akhir,
            keterangan,
            uploader,
            created_at: new Date().toISOString()
          });
        }
      }
    } else {
      // JSON Payload (Direct API / Programmatic)
      const body = await req.json();
      const {
        tahun = new Date().getFullYear(),
        bulan = new Date().getMonth() + 1,
        nama_bank = 'Bank Syariah Indonesia (BSI)',
        nomor_rekening = '7666333211',
        nama_rekening = 'MARDLIYYAH ISLAMIC CENTER',
        rekening_id = '1',
        items = [],
        saldo_awal = null,
        saldo_akhir = null,
        keterangan = '',
        uploader = 'Admin Keuangan'
      } = body;

      if (Array.isArray(items) && items.length > 0) {
        items.forEach((it: any) => {
          newItems.push({
            id: `rk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tahun: Number(tahun),
            bulan: Number(bulan),
            nama_bulan: NAMA_BULAN[Number(bulan) - 1] || `Bulan ${bulan}`,
            rekening_id,
            nama_bank,
            nomor_rekening,
            nama_rekening,
            nama_pemilik: nama_rekening,
            tipe_sumber: it.tipe_sumber || 'link',
            file_url: it.file_url,
            file_name: it.file_name,
            file_type: it.file_type || 'pdf',
            file_size: it.file_size || 'Tautan Online',
            saldo_awal,
            saldo_akhir,
            keterangan,
            uploader,
            created_at: new Date().toISOString()
          });
        });
      }
    }

    if (newItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada dokumen yang diunggah!' }, { status: 400 });
    }

    const targetTahun = newItems[0].tahun || new Date().getFullYear();

    // 2. Simpan ke database Supabase (app_arsip_kegiatan kategori_id: 6)
    const { data: existingRows, error: fetchErr } = await supabaseAdmin
      .from('app_arsip_kegiatan')
      .select('*')
      .eq('kategori_id', KATEGORI_ID)
      .eq('tahun', targetTahun);

    if (fetchErr) {
      console.error("Fetch arsip error:", fetchErr);
    }

    if (existingRows && existingRows.length > 0) {
      const primaryRow = existingRows[0];
      let currentDocs: any[] = [];
      if (Array.isArray(primaryRow.fase_dokumen)) {
        currentDocs = primaryRow.fase_dokumen;
      } else if (typeof primaryRow.fase_dokumen === 'string') {
        try { currentDocs = JSON.parse(primaryRow.fase_dokumen); } catch { currentDocs = []; }
      }

      // Tambahkan item-item baru di awal
      currentDocs.unshift(...newItems);

      const { error: updateErr } = await supabaseAdmin
        .from('app_arsip_kegiatan')
        .update({ fase_dokumen: currentDocs })
        .eq('id', primaryRow.id);

      if (updateErr) throw updateErr;

      // Bersihkan jika ada row duplikat untuk tahun yang sama
      if (existingRows.length > 1) {
        const extraIds = existingRows.slice(1).map(r => r.id);
        await supabaseAdmin.from('app_arsip_kegiatan').delete().in('id', extraIds);
      }
    } else {
      const { error: insertErr } = await supabaseAdmin
        .from('app_arsip_kegiatan')
        .insert([{
          kategori_id: KATEGORI_ID,
          tahun: targetTahun,
          catatan: 'Rekening Koran Bulanan Kas Masjid Kampus',
          fase_dokumen: newItems
        }]);

      if (insertErr) throw insertErr;
    }

    return NextResponse.json({
      success: true,
      message: `${newItems.length} dokumen rekening koran berhasil disimpan!`,
      data: newItems
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
