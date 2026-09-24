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

function getMimeType(pathOrUrl: string, fallback?: string): string {
  const clean = pathOrUrl.split('?')[0].toLowerCase();
  const ext = clean.split('.').pop() || '';
  const map: Record<string, string> = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    csv: 'text/csv',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    zip: 'application/zip',
    txt: 'text/plain'
  };
  if (map[ext]) return map[ext];
  if (fallback && fallback !== 'application/octet-stream' && fallback !== 'binary/octet-stream') {
    return fallback;
  }
  return 'application/octet-stream';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const filename = searchParams.get('filename');
  const download = searchParams.get('download');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';
    
    // Jika URL mengarah ke R2 (domain pub-*.r2.dev atau r2.cloudflarestorage.com), bypass menggunakan S3 Client langsung dari server
    // Ini mengeliminasi masalah pemblokiran domain *.r2.dev oleh ISP Indonesia (Indihome / Telkomsel)
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

      const contentType = getMimeType(filename || key, data.ContentType);
      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      };

      if (filename) {
        headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(filename)}"`;
      } else if (download === 'true') {
        headers['Content-Disposition'] = 'attachment';
      } else {
        headers['Content-Disposition'] = 'inline';
      }

      return new NextResponse(byteArray as any, { headers });
    }

    // Untuk Google Drive thumbnail atau URL eksternal lainnya
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    
    const contentType = getMimeType(filename || url, response.headers.get('Content-Type') || undefined);
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    if (filename) {
      headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(filename)}"`;
    } else if (download === 'true') {
      headers['Content-Disposition'] = 'attachment';
    } else {
      headers['Content-Disposition'] = 'inline';
    }

    return new NextResponse(arrayBuffer, { headers });
  } catch (error: any) {
    console.error('Error proxying file via /api/image-cors:', error?.message);
    return new NextResponse('Failed to proxy file: ' + error?.message, { status: 500 });
  }
}
