import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const { filename, contentType, folder = 'uploads' } = await req.json();
    
    if (!filename) {
      return NextResponse.json({ success: false, error: 'Filename is required' }, { status: 400 });
    }

    const fileExt = filename.split('.').pop() || 'bin';
    const cleanFileName = `${folder.replace(/[^a-zA-Z0-9_\/]/g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const key = `${folder}/${cleanFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'lampiran-aplikasi',
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });

    // 10 minutes presigned url expiration
    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 600 });
    const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
    const publicUrl = `${domain}/${key}`;

    return NextResponse.json({ success: true, presignedUrl, publicUrl, key });
  } catch (err: any) {
    console.error("Presign Upload Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
