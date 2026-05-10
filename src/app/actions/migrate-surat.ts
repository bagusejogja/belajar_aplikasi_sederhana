'use server';

import { supabase } from '@/lib/supabase';
import { uploadFileToR2 } from './r2-upload';
import fs from 'fs';
import path from 'path';

export async function migrateSuratRevisiFiles() {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    details: [] as string[]
  };

  try {
    const { data: rows, error } = await supabase.from('surat_revisi').select('*');
    if (error) throw error;
    if (!rows || rows.length === 0) return { message: "Tidak ada data ditemukan di tabel surat_revisi." };

    results.total = rows.length;
    const folderSource = 'D:\\BK\\OneDrive - UGM 365\\Desktop\\365-2';

    if (!fs.existsSync(folderSource)) {
      return { success: false, message: `Folder sumber tidak ditemukan: ${folderSource}` };
    }

    for (const row of rows) {
      let updated = false;
      const updateData: any = {};

      const driveLink = row.link_google_drive || "";
      const is365 = driveLink.toLowerCase().includes('365');
      
      // PERBAIKAN: Menambahkan pengecekan untuk string '\N'
      const isFileEmpty = 
        !row.file_upload || 
        row.file_upload === "" || 
        row.file_upload === "null" || 
        row.file_upload === "\\N" || 
        row.file_upload === "\N";

      if (is365 && isFileEmpty) {
        let fileNameFromLink = driveLink.split('/').pop() || "";
        fileNameFromLink = decodeURIComponent(fileNameFromLink);
        fileNameFromLink = fileNameFromLink.split('?')[0];

        if (fileNameFromLink) {
          const fullPath = path.join(folderSource, fileNameFromLink);
          
          if (fs.existsSync(fullPath)) {
            const fileName = path.basename(fullPath);
            const fileBuffer = fs.readFileSync(fullPath);
            
            const formData = new FormData();
            const file = new Blob([fileBuffer]);
            formData.append('file', file, fileName);

            const upload = await uploadFileToR2(formData, 'surat-revisi/migrated-from-sharepoint');
            
            if (upload.success) {
              updateData.file_upload = upload.publicUrl;
              updated = true;
            }
          } else {
            // Log file yang tidak ditemukan agar bisa dicek manual
            results.details.push(`[File Hilang] ID ${row.id}: ${fileNameFromLink}`);
          }
        }
      }

      if (updated) {
        const { error: updateError } = await supabase.from('surat_revisi').update(updateData).eq('id', row.id);
        if (!updateError) results.success++;
        else results.details.push(`Gagal update DB ID ${row.id}: ${updateError.message}`);
      }
    }

    return { 
      success: true, 
      message: `Migrasi Selesai. Berhasil Update: ${results.success} data.`,
      details: results.details 
    };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
