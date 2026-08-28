/**
 * Script untuk membersihkan dan memperbaiki ekstensi file di D:/backup_lampiran_r2
 * Mengubah file "view" tanpa ekstensi menjadi file gambar (.jpg / .png / .pdf) yang bisa langsung diklik di Windows.
 */

const fs = require('fs');
const path = require('path');

const TARGET_DIR = process.env.LOCAL_BACKUP_DIR || 'D:/backup_lampiran_r2';

function detectExtension(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    if (buffer[0] === 0xff && buffer[1] === 0xd8) return '.jpg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return '.png';
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return '.pdf';
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return '.gif';
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return '.webp';
    return '.jpg'; // default fallback for image attachments
  } catch (e) {
    return '.jpg';
  }
}

function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getAllFiles(fullPath, fileList);
      } else {
        fileList.push(fullPath);
      }
    } catch (e) {}
  }
  return fileList;
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  let items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      removeEmptyDirs(fullPath);
    }
  }
  items = fs.readdirSync(dir);
  if (items.length === 0 && dir !== TARGET_DIR) {
    try {
      fs.rmdirSync(dir);
    } catch (e) {}
  }
}

function runFix() {
  console.log('====================================================');
  console.log('🔧 MEMPERBAIKI EKSTENSI & STRUKTUR FILE LOKAL');
  console.log(`📁 Lokasi Target : ${TARGET_DIR}`);
  console.log('====================================================');

  const files = getAllFiles(TARGET_DIR);
  console.log(`🔍 Total file diperiksa: ${files.length}`);

  let fixedCount = 0;

  for (const file of files) {
    const baseName = path.basename(file);
    const ext = path.extname(file);

    // Cek jika file bernama "view" atau tidak memiliki ekstensi
    if (baseName === 'view' || !ext) {
      const detectedExt = detectExtension(file);
      
      // Cek apakah ini bagian dari folder migrated Google Drive
      // Contoh: D:\backup_lampiran_r2\transaksi\migrated_00ctjumt_1778167730464.com\file\d\...\view
      const relPath = path.relative(TARGET_DIR, file).replace(/\\/g, '/');
      const match = relPath.match(/^([^\/]+)\/(migrated_[a-zA-Z0-9_]+)\.com\/.+/);

      let newFilePath = '';
      if (match) {
        const folderName = match[1]; // e.g. "transaksi"
        const cleanFileName = match[2] + detectedExt; // e.g. "migrated_00ctjumt_1778167730464.jpg"
        newFilePath = path.join(TARGET_DIR, folderName, cleanFileName);
      } else {
        newFilePath = file + detectedExt;
      }

      try {
        const destDir = path.dirname(newFilePath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        // Pindahkan file ke nama yang baru
        fs.renameSync(file, newFilePath);
        fixedCount++;
        process.stdout.write(`✅ [${fixedCount}] Diperbaiki: ${path.basename(newFilePath)}\r`);
      } catch (err) {
        console.error(`❌ Gagal mengubah ${file}: ${err.message}`);
      }
    }
  }

  // Bersihkan folder-folder kosong hasil pemindahan
  console.log('\n🧹 Membersihkan subfolder kosong...');
  removeEmptyDirs(TARGET_DIR);

  console.log('====================================================');
  console.log('🎉 SELESAI!');
  console.log(`✨ Total ${fixedCount} file berhasil diubah menjadi format gambar/PDF yang bisa langsung diklik.`);
  console.log('====================================================');
}

runFix();
