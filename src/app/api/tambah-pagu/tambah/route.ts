import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function uploadToR2(file: any, folder: string) {
  if (!file || file.size === 0) return null;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const key = `${folder}/${fileName}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'lampiran-aplikasi',
    Key: key,
    Body: buffer,
    ContentType: file.type || 'application/octet-stream',
  }));

  const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
  return `${domain}/${key}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawData: any = { is_active: 1 };
    
    // 1. Ekstrak data non-file
    formData.forEach((value, key) => {
      if (key !== 'file_surat_pengajuan' && key !== 'file_surat_tanggapan') {
        rawData[key] = value;
      }
    });

    // 2. Upload Files jika ada file baru yang diunggah
    const filePengajuan = formData.get('file_surat_pengajuan') as any;
    const fileTanggapan = formData.get('file_surat_tanggapan') as any;

    if (filePengajuan && filePengajuan.size > 0) {
      rawData.file_surat_pengajuan = await uploadToR2(filePengajuan, 'tambah-pagu/pengajuan');
    }
    if (fileTanggapan && fileTanggapan.size > 0) {
      rawData.file_surat_tanggapan = await uploadToR2(fileTanggapan, 'tambah-pagu/tanggapan');
    }

    // 3. Cek apakah record dengan no_surat_pengajuan sudah ada (Mencegah duplikasi saat migrasi/re-import)
    if (rawData.no_surat_pengajuan) {
      const cleanNoSurat = rawData.no_surat_pengajuan.trim();
      const { data: existing } = await supabase
        .from('tambah_pagu')
        .select('id, file_surat_tanggapan, link_surat_tanggapan')
        .eq('no_surat_pengajuan', cleanNoSurat)
        .maybeSingle();

      if (existing) {
        // Jika tidak mengunggah file_surat_tanggapan baru, pertahankan file_surat_tanggapan lama
        if (!rawData.file_surat_tanggapan && existing.file_surat_tanggapan) {
          delete rawData.file_surat_tanggapan;
        }
        if (!rawData.link_surat_tanggapan && existing.link_surat_tanggapan) {
          delete rawData.link_surat_tanggapan;
        }

        const { data: updatedData, error: updateError } = await supabase
          .from('tambah_pagu')
          .update(rawData)
          .eq('id', existing.id)
          .select();

        if (updateError) throw updateError;
        return NextResponse.json({ success: true, isUpdate: true, data: updatedData });
      }
    }

    // 4. Jika belum ada, buat record baru
    const { data, error } = await supabase.from('tambah_pagu').insert([rawData]).select();
    if (error) throw error;

    return NextResponse.json({ success: true, isUpdate: false, data });
  } catch (err: any) {
    console.error("Tambah Pagu API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
