'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';
import { supabase } from '@/lib/supabase';

export async function startMigration() {
  try {
    console.log("Memulai proses migrasi...");
    
    // 1. Ambil semua transaksi yang punya foto
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*');

    if (error) throw error;
    if (!transactions) return { success: false, message: "Tidak ada transaksi" };

    let totalMigrated = 0;
    const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';

    for (const trx of transactions) {
      const fields = ['foto_nota', 'foto_kegiatan', 'foto_barang', 'foto_bukti_transfer'];
      let isUpdated = false;
      const updatedFields: any = {};

      for (const field of fields) {
        const oldLink = trx[field];
        
        // Cek apakah link perlu dimigrasi (jika belum mengarah ke R2)
        if (oldLink && !oldLink.includes('r2.dev') && !oldLink.includes('cloudflarestorage.com')) {
          console.log(`Memindahkan [${field}] dari: ${oldLink}`);
          
          try {
            // Handle jika link berisi banyak URL (dipisah koma)
            const links = oldLink.split(',').map((s: string) => s.trim()).filter(Boolean);
            const newLinks = [];

            for (const link of links) {
              let downloadUrl = link;
              
              // Cek jika ini adalah link Google Drive
              const gdriveMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/) || link.match(/id=([a-zA-Z0-9_-]+)/);
              if (gdriveMatch && gdriveMatch[1]) {
                // Ubah link GDrive menjadi link thumbnail/download langsung agar bisa didownload script
                downloadUrl = `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w1000`;
              }

              // 2. Download file dari link lama
              const response = await fetch(downloadUrl);
              if (!response.ok) {
                console.warn(`Gagal download: ${downloadUrl}, dilewati.`);
                newLinks.push(link); 
                continue;
              }

              const contentType = response.headers.get('content-type') || 'image/jpeg';
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // 3. Buat nama file baru dengan folder transaksi/
              // Perbaikan: Ambil ekstensi dengan lebih aman, default ke jpg untuk GDrive
              let fileExt = 'jpg';
              if (!link.includes('drive.google.com')) {
                fileExt = link.split('.').pop()?.split('?')[0] || 'jpg';
                if (fileExt.length > 5) fileExt = 'jpg'; // Jika terlalu panjang, paksa jadi jpg
              }
              
              const fileName = `transaksi/migrated_${Math.random().toString(36).substring(2, 10)}_${Date.now()}.${fileExt}`;

              // 4. Upload ke R2
              const command = new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileName,
                Body: buffer,
                ContentType: contentType,
              });

              await r2.send(command);
              const newUrl = `${domain}/${fileName}`;
              newLinks.push(newUrl);
              totalMigrated++;
            }

            updatedFields[field] = newLinks.join(',');
            isUpdated = true;
          } catch (err) {
            console.error(`Error memproses field ${field}:`, err);
          }
        }
      }

      // 5. Update baris di Supabase jika ada perubahan
      if (isUpdated) {
        await supabase
          .from('transactions')
          .update(updatedFields)
          .eq('id', trx.id);
      }
    }

    return { 
      success: true, 
      message: `Migrasi selesai! ${totalMigrated} file telah dipindahkan ke Cloudflare R2.` 
    };
  } catch (error: any) {
    console.error('Migration Error:', error);
    return { success: false, error: error.message };
  }
}

export async function fixBrokenR2Links() {
  try {
    console.log("Memulai perbaikan link rusak...");
    const { data: transactions, error } = await supabase.from('transactions').select('*');
    if (error) throw error;

    let totalFixed = 0;
    const domain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev';

    for (const trx of transactions) {
      const fields = ['foto_nota', 'foto_kegiatan', 'foto_barang', 'foto_bukti_transfer'];
      let isUpdated = false;
      const updatedFields: any = {};

      for (const field of fields) {
        const link = trx[field];
        
        // Deteksi link yang rusak (mengandung .com/file/d/ dari GDrive)
        if (link && link.includes('.com/file/d/')) {
          console.log(`Memperbaiki link rusak di ${field}: ${link}`);
          
          // Ekstrak ID Google Drive dari link yang rusak
          const gdriveIdMatch = link.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (gdriveIdMatch && gdriveIdMatch[1]) {
            const gdriveId = gdriveIdMatch[1];
            const downloadUrl = `https://drive.google.com/thumbnail?id=${gdriveId}&sz=w1000`;

            const response = await fetch(downloadUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const fileName = `transaksi/fixed_${Math.random().toString(36).substring(2, 10)}_${Date.now()}.jpg`;

              const command = new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fileName,
                Body: buffer,
                ContentType: 'image/jpeg',
              });

              await r2.send(command);
              updatedFields[field] = `${domain}/${fileName}`;
              isUpdated = true;
              totalFixed++;
            }
          }
        }
      }

      if (isUpdated) {
        await supabase.from('transactions').update(updatedFields).eq('id', trx.id);
      }
    }

    return { success: true, message: `Berhasil memperbaiki ${totalFixed} link yang rusak!` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
