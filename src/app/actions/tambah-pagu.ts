'use server';

import { supabase } from '@/lib/supabase';
import { uploadFileToR2 } from './r2-upload';
import { revalidatePath } from 'next/cache';

export async function getTambahPagu() {
  const { data, error } = await supabase
    .from('tambah_pagu')
    .select('*, gov_units(nama_unit)')
    .order('created_time', { ascending: false });
    
  if (error) throw error;
  return data;
}

export async function createTambahPagu(formData: FormData) {
  try {
    // 1. Ekstrak data dari FormData
    const rawData: any = {
      is_active: 1 // Pastikan data aktif agar muncul di dashboard
    };
    formData.forEach((value, key) => {
      if (key !== 'file_surat_pengajuan' && key !== 'file_surat_tanggapan') {
        rawData[key] = value;
      }
    });

    // 2. Handle File Surat Pengajuan
    const filePengajuan = formData.get('file_surat_pengajuan') as File;
    if (filePengajuan && filePengajuan.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', filePengajuan);
      const uploadResult = await uploadFileToR2(uploadFormData, 'tambah-pagu/pengajuan');
      if (uploadResult.success) {
        rawData.file_surat_pengajuan = uploadResult.publicUrl;
      }
    }

    // 3. Handle File Surat Tanggapan
    const fileTanggapan = formData.get('file_surat_tanggapan') as File;
    if (fileTanggapan && fileTanggapan.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', fileTanggapan);
      const uploadResult = await uploadFileToR2(uploadFormData, 'tambah-pagu/tanggapan');
      if (uploadResult.success) {
        rawData.file_surat_tanggapan = uploadResult.publicUrl;
      }
    }

    // 4. Simpan ke Database
    const { data, error } = await supabase
      .from('tambah_pagu')
      .insert([rawData])
      .select();
      
    if (error) throw error;

    revalidatePath('/tambah-pagu');
    return { success: true, data };
  } catch (error: any) {
    console.error("Gagal simpan tambah pagu:", error);
    return { success: false, error: error.message };
  }
}

export async function updateTambahPagu(id: string, formData: any) {
  try {
    const { data, error } = await supabase
      .from('tambah_pagu')
      .update(formData)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    revalidatePath('/tambah-pagu');
    return { success: true, data };
  } catch (error: any) {
    console.error("Gagal update tambah pagu:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTambahPagu(id: string) {
  const { error } = await supabase
    .from('tambah_pagu')
    .update({ is_active: 0 })
    .eq('id', id);
    
  if (error) throw error;
  revalidatePath('/tambah-pagu');
  return { success: true };
}

export async function updatePaguSummary(id: number, summary: string) {
  try {
    const { error } = await supabase
      .from('tambah_pagu')
      .update({ ringkasan_substansi: summary })
      .eq('id', id);

    if (error) throw error;
    revalidatePath('/tambah-pagu');
    return { success: true };
  } catch (error: any) {
    console.error("Error update summary:", error);
    return { success: false, error: error.message };
  }
}

