import { NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
    
    // Jika URL adalah R2, gunakan S3 Client untuk membypass blokir ISP
    if (url.startsWith(domain)) {
      const key = url.replace(`${domain}/`, '');
      const data = await r2.send(new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'lampiran-aplikasi',
        Key: key,
      }));
      
      const byteArray = await data.Body?.transformToByteArray();
      if (!byteArray) throw new Error('Empty S3 body');

      return new NextResponse(byteArray as any, {
        headers: {
          'Content-Type': data.ContentType || 'application/pdf',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    const arrayBuffer = await response.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return new NextResponse('Failed to proxy image', { status: 500 });
  }
}
