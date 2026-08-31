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
    
    // Jika URL mengarah ke R2 (domain pub-*.r2.dev atau r2.cloudflarestorage.com), bypass menggunakan S3 Client langsung dari server
    const isR2Url = url.includes('.r2.dev') || url.includes('r2.cloudflarestorage.com') || url.startsWith(domain);

    if (isR2Url) {
      // Ekstrak object key (apapun setelah nama domain/host)
      let key = url;
      if (key.includes('.r2.dev/')) {
        key = key.split('.r2.dev/')[1];
      } else if (key.startsWith(domain)) {
        key = key.replace(`${domain}/`, '');
      } else if (key.startsWith('http')) {
        try {
          const parsed = new URL(key);
          key = parsed.pathname.replace(/^\//, '');
        } catch {
          // ignore
        }
      }

      // Hapus query params dari key jika ada
      key = key.split('?')[0];

      const data = await r2.send(new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'lampiran-aplikasi',
        Key: key,
      }));
      
      const byteArray = await data.Body?.transformToByteArray();
      if (!byteArray) throw new Error('Empty S3 body');

      return new NextResponse(byteArray as any, {
        headers: {
          'Content-Type': data.ContentType || 'image/jpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Untuk Google Drive thumbnail atau URL eksternal lainnya
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error proxying image via /api/image-cors:', error?.message);
    return new NextResponse('Failed to proxy image: ' + error?.message, { status: 500 });
  }
}
