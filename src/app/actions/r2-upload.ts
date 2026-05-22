'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';

export async function uploadFileToR2(formData: FormData, folder: string = 'umum') {
  console.log(`[R2] Memulai upload ke folder: ${folder}`);
  try {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
       console.error("[R2] File kosong atau tidak ditemukan");
       throw new Error("File kosong atau tidak ditemukan");
    }

    console.log(`[R2] Memproses file: ${file.name} (${file.size} bytes)`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `surat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const key = `${folder}/${fileName}`; 

    console.log(`[R2] Mengirim ke bucket dengan key: ${key}`);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    });

    const sendRes = await r2.send(command);
    console.log("[R2] Upload Berhasil:", sendRes);
    
    const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
    const publicUrl = `${domain}/${key}`; 

    return { success: true, publicUrl };
  } catch (error: any) {
    console.error('[R2_CRITICAL_ERROR]:', error);
    return { success: false, error: `R2 Error: ${error.message}` };
  }
}
