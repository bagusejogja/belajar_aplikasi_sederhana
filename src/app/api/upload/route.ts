import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as any;
    const folder = formData.get('folder') as string || 'uploads';
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

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
    const publicUrl = `${domain}/${key}`;

    return NextResponse.json({ success: true, publicUrl, key });
  } catch (err: any) {
    console.error("Upload API Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { url, key } = await req.json();
    let targetKey = key;

    if (!targetKey && url) {
      const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
      targetKey = url.replace(`${domain}/`, '');
    }

    if (!targetKey) {
      return NextResponse.json({ success: false, error: 'Key or URL required' }, { status: 400 });
    }

    await r2.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'lampiran-aplikasi',
      Key: targetKey,
    }));

    return NextResponse.json({ success: true, message: 'File deleted from R2' });
  } catch (err: any) {
    console.error("Delete R2 Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

