import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import JSZip from 'jszip';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'lampiran-aplikasi';
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';

async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';
    const filterFolder = searchParams.get('folder') || '';
    const filterYear = searchParams.get('year') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const batchOffset = parseInt(searchParams.get('offset') || '0', 10);
    const batchLimit = parseInt(searchParams.get('limit') || '1000', 10);

    // 1. Fetch all objects from R2
    let allObjects: any[] = [];
    let continuationToken: string | undefined = undefined;

    do {
      const listCmd: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      });
      const response: any = await r2.send(listCmd);
      if (response.Contents) {
        allObjects = allObjects.concat(response.Contents);
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // Filter out SQL/JSON backup database dumps from backups/
    const allAttachments = allObjects.filter(obj => obj.Key && !obj.Key.startsWith('backups/'));

    // Compute folder breakdown
    const folderStats: Record<string, { count: number; size: number }> = {};
    const yearsSet = new Set<string>();

    allAttachments.forEach(obj => {
      const parts = obj.Key.split('/');
      const folder = parts.length > 1 ? parts[0] : 'root';
      if (!folderStats[folder]) {
        folderStats[folder] = { count: 0, size: 0 };
      }
      folderStats[folder].count++;
      folderStats[folder].size += (obj.Size || 0);

      if (obj.LastModified) {
        yearsSet.add(new Date(obj.LastModified).getFullYear().toString());
      }
    });

    // 2. Action: List Metadata & Manifest
    if (action === 'list' || action === 'manifest') {
      const totalSize = allAttachments.reduce((acc, curr) => acc + (curr.Size || 0), 0);

      const responsePayload: any = {
        success: true,
        totalFiles: allAttachments.length,
        totalSize,
        availableYears: Array.from(yearsSet).sort().reverse(),
        folders: folderStats,
        bucket: BUCKET_NAME
      };

      if (action === 'manifest') {
        responsePayload.items = allAttachments.map(obj => {
          const key = obj.Key!;
          return {
            key,
            size: obj.Size || 0,
            url: `${PUBLIC_DOMAIN}/${key}`,
            lastModified: obj.LastModified ? obj.LastModified.toISOString() : ''
          };
        });
      }

      return NextResponse.json(responsePayload);
    }

    // 3. Action: Package & Download as ZIP Archive
    if (action === 'zip') {
      // Filter attachments according to folder, year, and date range
      const startMs = startDate ? new Date(startDate).getTime() : 0;
      const endMs = endDate ? new Date(endDate).getTime() : Infinity;

      const filteredList = allAttachments.filter(obj => {
        if (filterFolder) {
          const parts = obj.Key.split('/');
          const folder = parts.length > 1 ? parts[0] : 'root';
          if (folder !== filterFolder) return false;
        }
        if (filterYear && obj.LastModified) {
          const fileYear = new Date(obj.LastModified).getFullYear().toString();
          if (fileYear !== filterYear) return false;
        }
        if (obj.LastModified) {
          const fileMs = new Date(obj.LastModified).getTime();
          if (startMs && fileMs < startMs) return false;
          if (endMs && fileMs > endMs) return false;
        }
        return true;
      });

      if (filteredList.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: `Tidak ada file lampiran yang ditemukan untuk folder: "${filterFolder || 'Semua'}"` 
        }, { status: 404 });
      }

      const zip = new JSZip();
      // Slice according to offset and limit (max 1000 per zip for browser stability)
      const maxPerZip = Math.min(batchLimit, 1000);
      const processingList = filteredList.slice(batchOffset, batchOffset + maxPerZip);

      // Concurrently fetch files in batches of 15
      const batchSize = 15;
      for (let i = 0; i < processingList.length; i += batchSize) {
        const batch = processingList.slice(i, i + batchSize);
        await Promise.all(batch.map(async (obj) => {
          try {
            const getCmd = new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: obj.Key,
            });
            const s3Item = await r2.send(getCmd);
            if (s3Item.Body) {
              const fileBuffer = await streamToBuffer(s3Item.Body);
              zip.file(obj.Key, fileBuffer);
            }
          } catch (fetchErr) {
            console.warn(`Gagal mengambil file ${obj.Key} untuk ZIP:`, fetchErr);
          }
        }));
      }

      const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer', 
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const folderTag = filterFolder ? `folder_${filterFolder}_` : '';
      const yearTag = filterYear ? `tahun_${filterYear}_` : '';
      const partTag = filteredList.length > maxPerZip ? `_part${Math.floor(batchOffset / maxPerZip) + 1}` : '';
      const zipName = `lampiran_${folderTag}${yearTag}${timestamp}${partTag}.zip`;
      const uint8 = new Uint8Array(zipBuffer);

      return new NextResponse(uint8, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${zipName}"`,
          'Content-Type': 'application/zip',
          'Content-Length': uint8.byteLength.toString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    console.error("Attachments API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
