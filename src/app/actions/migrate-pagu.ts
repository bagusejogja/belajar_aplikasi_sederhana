'use server';

import { supabase } from '@/lib/supabase';
import { uploadFileToR2 } from './r2-upload';
import fs from 'fs';
import path from 'path';

export async function migratePaguFiles() {
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    details: [] as string[]
  };

  try {
    const { data: rows, error } = await supabase.from('tambah_pagu').select('*');
    if (error) throw error;
    if (!rows || rows.length === 0) return { message: "Tidak ada data ditemukan." };

    results.total = rows.length;

    const folderTambahPagu = 'D:\\BK\\OneDrive - UGM 365\\Desktop\\tambah_pagu';
    const folder365 = 'D:\\BK\\OneDrive - UGM 365\\Desktop\\365';

    // Ambil daftar file di folder 365 sekali saja untuk pencarian cepat
    let filesIn365: string[] = [];
    if (fs.existsSync(folder365)) {
      filesIn365 = fs.readdirSync(folder365);
    }

    for (const row of rows) {
      let updated = false;
      const updateData: any = {};

      const processField = async (fieldName: string, currentVal: string, noSurat: string) => {
        let fileToUpload = "";
        let targetFolder = "";

        // LOGIKA 1: Link IP Lama
        if (currentVal && currentVal.includes('10.8.119.2')) {
          const fileName = path.basename(currentVal);
          const fullPath = path.join(folderTambahPagu, fileName);
          if (fs.existsSync(fullPath)) {
            fileToUpload = fullPath;
            targetFolder = 'tambah-pagu/migrated-old-ip';
          }
        } 
        // LOGIKA 2: Kosong -> Cari di 365 (Fuzzy Match)
        else if (!currentVal && noSurat) {
          const cleanNoSurat = noSurat.replace(/[\/\\:*?"<>|]/g, '').toLowerCase().trim();
          
          // Cari file yang namanya mengandung "No Surat" (tanpa karakter khusus)
          const matchedFile = filesIn365.find(f => {
            const cleanFileName = f.replace(/[\/\\:*?"<>|]/g, '').toLowerCase();
            return cleanFileName.includes(cleanNoSurat);
          });

          if (matchedFile) {
            fileToUpload = path.join(folder365, matchedFile);
            targetFolder = 'tambah-pagu/migrated-from-365';
          } else {
            // Log jika tidak ketemu
            results.details.push(`[365] Tidak ada file cocok untuk No Surat: ${noSurat} (Dicari: ${cleanNoSurat})`);
          }
        }

        if (fileToUpload) {
          const fileName = path.basename(fileToUpload);
          const fileBuffer = fs.readFileSync(fileToUpload);
          const formData = new FormData();
          const file = new Blob([fileBuffer]);
          formData.append('file', file, fileName);

          const upload = await uploadFileToR2(formData, targetFolder);
          if (upload.success) {
            return upload.publicUrl;
          }
        }
        return null;
      };

      const newPengajuan = await processField('file_surat_pengajuan', row.file_surat_pengajuan, row.no_surat_pengajuan);
      if (newPengajuan) {
        updateData.file_surat_pengajuan = newPengajuan;
        updated = true;
      }

      const newTanggapan = await processField('file_surat_tanggapan', row.file_surat_tanggapan, row.no_surat_tanggapan);
      if (newTanggapan) {
        updateData.file_surat_tanggapan = newTanggapan;
        updated = true;
      }

      if (updated) {
        const { error: updateError } = await supabase.from('tambah_pagu').update(updateData).eq('id', row.id);
        if (!updateError) results.success++;
        else results.details.push(`Gagal update DB ID ${row.id}: ${updateError.message}`);
      }
    }

    return { 
      success: true, 
      message: `Proses Selesai. Berhasil Update: ${results.success} baris data.`,
      details: results.details 
    };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
