require('dotenv').config({ path: '.env.local' }); // Or '.env'
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { finished } = require('stream/promises');

// Ensure dotenv is loaded properly
if (!process.env.R2_ACCOUNT_ID) {
  require('dotenv').config({ path: '.env' });
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const bucketName = process.env.R2_BUCKET_NAME || 'lampiran-aplikasi';
const backupDir = path.join(process.cwd(), 'backups', `r2_backup_sinkron`);

async function downloadStream(stream, filePath) {
  const fileStream = fs.createWriteStream(filePath);
  if (stream instanceof Readable) {
    stream.pipe(fileStream);
    await finished(fileStream);
  }
}

async function backupR2() {
  console.log(`Starting Incremental R2 Backup for bucket: ${bucketName}...`);
  console.log(`Target directory: ${backupDir}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  let isTruncated = true;
  let continuationToken = undefined;
  let totalFiles = 0;
  let skippedFiles = 0;

  try {
    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });

      const response = await r2.send(command);

      if (response.Contents) {
        for (const item of response.Contents) {
          const key = item.Key;
          const targetPath = path.join(backupDir, key.replace(/\//g, '_')); 

          // Cek apakah file sudah ada di lokal dan ukurannya sama
          let skip = false;
          if (fs.existsSync(targetPath)) {
            const stats = fs.statSync(targetPath);
            if (stats.size === item.Size) {
              skip = true;
            }
          }

          if (skip) {
            console.log(`⏩ Skipped (already exists): ${key}`);
            skippedFiles++;
            continue;
          }

          console.log(`⬇️ Downloading: ${key} -> ${targetPath}`);
          const getCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
          });

          const { Body } = await r2.send(getCommand);
          await downloadStream(Body, targetPath);
          totalFiles++;
        }
      }

      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    }

    console.log(`\n✅ Backup R2 Completed!`);
    console.log(`📥 Total downloaded today: ${totalFiles} files`);
    console.log(`⏩ Total skipped (already backed up): ${skippedFiles} files`);
    console.log(`📂 Files are safely synced in: ${backupDir}`);
  } catch (error) {
    console.error("❌ Error during R2 Backup:", error);
  }
}

backupR2();
