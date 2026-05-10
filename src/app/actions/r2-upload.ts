'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';

export async function uploadFileToR2(formData: FormData, folder: string = 'umum') {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error("Tidak ada file yang diterima");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;
    
    // Gunakan folder agar rapi di Cloudflare
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await r2.send(command);
    
    const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
    const publicUrl = `${domain}/${key}`; 

    return { success: true, publicUrl };
  } catch (error: any) {
    console.error('Error uploading to R2 via Server:', error);
    return { success: false, error: error.message };
  }
}
