/**
 * SINKRONISASI PINTAR LAMPIRAN CLOUDFLARE R2 KE KOMPUTER LOKAL
 * Model: Incremental Update (Hanya mengunduh file baru/belum ada di folder lokal).
 * Otomatis memperbaiki ekstensi file (.jpg / .png / .pdf).
 * 
 * Cara Penggunaan:
 * node scripts/sync-r2-local.js
 */

const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Folder tujuan penyimpanan lokal di komputer (Default ke D:/backup_lampiran_r2)
const TARGET_DIR = process.env.LOCAL_BACKUP_DIR || (fs.existsSync('D:/') ? 'D:/backup_lampiran_r2' : path.join(process.cwd(), 'backup_lampiran_r2'));

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

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

function detectExtensionFromBuffer(buffer) {
  if (!buffer || buffer.length < 4) return '.jpg';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return '.jpg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return '.png';
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return '.pdf';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return '.gif';
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return '.webp';
  return '.jpg';
}

function getCleanLocalPath(key, buffer, contentType) {
  let ext = detectExtensionFromBuffer(buffer);
  if (!ext && contentType) {
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
    else if (contentType.includes('png')) ext = '.png';
    else if (contentType.includes('pdf')) ext = '.pdf';
  }

  // Jika format Google Drive: "transaksi/migrated_00ctjumt_1778167730464.com/file/d/1IYecZrsqDQQKtZyxSypOp85TxicSoCp5/view"
  const match = key.match(/^([^\/]+)\/(migrated_[a-zA-Z0-9_]+)\.com\/.+/);
  if (match) {
    const folder = match[1];
    const cleanFileName = match[2] + ext;
    return path.join(TARGET_DIR, folder, cleanFileName);
  }

  // Jika berakhiran /view
  if (key.endsWith('/view')) {
    const cleanKey = key.replace(/\/view$/, '') + ext;
    return path.join(TARGET_DIR, cleanKey);
  }

  // Jika belum punya ekstensi
  if (!path.extname(key)) {
    return path.join(TARGET_DIR, key + ext);
  }

  return path.join(TARGET_DIR, key);
}

async function runSync() {
  console.log('====================================================');
  console.log('🔄 SINKRONISASI PINTAR LAMPIRAN CLOUDFLARE R2');
  console.log('====================================================');
  console.log(`📁 Folder Lokal Target : ${TARGET_DIR}`);
  console.log(`☁️ Bucket Cloudflare R2: ${BUCKET_NAME}`);
  console.log('----------------------------------------------------');

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`✨ Membuat folder baru: ${TARGET_DIR}`);
  }

  // 1. Ambil seluruh daftar objek dari R2
  console.log('🔍 Mengambil daftar file dari Cloudflare R2...');
  let allObjects = [];
  let token = undefined;

  do {
    const res = await r2.send(new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      ContinuationToken: token
    }));
    if (res.Contents) allObjects = allObjects.concat(res.Contents);
    token = res.NextContinuationToken;
  } while (token);

  // Filter file lampiran (abaikan dump database di backups/)
  const filesToSync = allObjects.filter(obj => obj.Key && !obj.Key.startsWith('backups/'));

  console.log(`📦 Ditemukan ${filesToSync.length} file lampiran di Cloudflare R2.`);
  console.log('----------------------------------------------------');

  let downloadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filesToSync.length; i++) {
    const item = filesToSync[i];
    const key = item.Key;

    // Cek apakah file sudah ada dalam nama bersih (dengan ekstensi)
    let potentialCleanPath = getCleanLocalPath(key, null, null);
    if (fs.existsSync(potentialCleanPath)) {
      const stats = fs.statSync(potentialCleanPath);
      if (stats.size === item.Size) {
        skippedCount++;
        process.stdout.write(`⏩ [${i+1}/${filesToSync.length}] Sudah ada: ${path.basename(potentialCleanPath)}\r`);
        continue;
      }
    }

    // Unduh file baru/berbeda
    try {
      const getRes = await r2.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }));
      if (getRes.Body) {
        const fileBuffer = await streamToBuffer(getRes.Body);
        const finalLocalPath = getCleanLocalPath(key, fileBuffer, getRes.ContentType);
        const localDir = path.dirname(finalLocalPath);

        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        fs.writeFileSync(finalLocalPath, fileBuffer);
        downloadedCount++;
        console.log(`⬇️ [${i+1}/${filesToSync.length}] Baru: ${path.basename(finalLocalPath)} (${(item.Size / 1024).toFixed(1)} KB)`);
      }
    } catch (err) {
      console.error(`❌ Gagal unduh ${key}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n====================================================');
  console.log('✅ SINKRONISASI SELESAI!');
  console.log(`📥 File Baru Terunduh : ${downloadedCount}`);
  console.log(`⏩ File Dilewati (Ada) : ${skippedCount}`);
  console.log(`❌ File Gagal         : ${errorCount}`);
  console.log(`📂 Lokasi Penyimpanan : ${TARGET_DIR}`);
  console.log('====================================================');
}

runSync().catch(err => {
  console.error("FATAL ERROR:", err);
});
