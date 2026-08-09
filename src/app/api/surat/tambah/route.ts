import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';

// Bypasses generic Node.js SSL handshake failures in Vercel
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const userId = formData.get('user_id') as string;
    const file = formData.get('file_upload') as any;
    
    let fileUrl = null;

    // 1. Upload ke R2 jika ada file
    if (file && file.size > 0) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileExt = file.name.split('.').pop();
        const fileName = `surat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const key = `surat/${fileName}`;

        await r2.send(new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: file.type || 'application/octet-stream',
        }));

        const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
        fileUrl = `${domain}/${key}`;
      } catch (r2Error: any) {
        console.error("R2 Upload Error:", r2Error);
        return NextResponse.json({ success: false, error: `Error R2 Upload: ${r2Error.message}` }, { status: 500 });
      }
    }

    // 2. Simpan ke Database
    const data = {
      unit_id: parseInt(formData.get('unit_id') as string),
      tahun_anggaran: parseInt(formData.get('tahun_anggaran') as string) || 2026,
      no_surat: formData.get('no_surat')?.toString() || '',
      perihal_surat: formData.get('perihal_surat')?.toString() || '',
      tanggal_surat: formData.get('tanggal_surat')?.toString() || null,
      subyek_simaster: formData.get('subyek_simaster')?.toString() || '',
      jenis_json: JSON.parse(formData.get('jenis_json') as string || '[]'),
      pic: formData.get('pic')?.toString() || '',
      tanggal_disposisi: formData.get('tanggal_disposisi')?.toString() || null,
      tanggal_selesai: formData.get('tanggal_selesai')?.toString() || null,
      baris_rkat_dirubah: formData.get('baris_rkat_dirubah')?.toString() || '',
      nominal_semula: formData.get('nominal_semula') ? parseFloat(formData.get('nominal_semula') as string) : null,
      nominal_menjadi: formData.get('nominal_menjadi') ? parseFloat(formData.get('nominal_menjadi') as string) : null,
      link_google_drive: formData.get('link_google_drive')?.toString() || '',
      file_upload: fileUrl,
      created_by: userId,
      is_active: 1
    };

    try {
      const { error } = await supabase.from('surat_revisi').insert(data);
      if (error) throw error;
    } catch (dbError: any) {
      console.error("Supabase Insert Error:", dbError);
      return NextResponse.json({ success: false, error: `Error Supabase Insert: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Error General:", err);
    return NextResponse.json({ success: false, error: `Error General: ${err.message}` }, { status: 500 });
  }
}
