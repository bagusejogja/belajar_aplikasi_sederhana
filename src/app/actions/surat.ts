'use server';

import { supabase } from '@/lib/supabase';
import { uploadFileToR2 } from './r2-upload';
import { revalidatePath } from 'next/cache';

export async function createSuratRevisi(formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Sesi berakhir, silakan login kembali.");

    // 1. Handle File Upload ke R2 (jika ada file yang dipilih)
    let fileUrl = null;
    const file = formData.get('file_upload') as File;
    
    if (file && file.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      // Simpan di folder 'surat' di R2
      const uploadRes = await uploadFileToR2(uploadFormData, 'surat');
      
      if (uploadRes.success) {
        fileUrl = uploadRes.publicUrl;
      } else {
        throw new Error("Gagal mengupload file ke R2: " + uploadRes.error);
      }
    }

    // 2. Siapkan data untuk Database
    const data = {
      unit_id: parseInt(formData.get('unit_id') as string), // Ubah ke Integer
      tahun_anggaran: parseInt(formData.get('tahun_anggaran') as string),
      no_surat: formData.get('no_surat'),
      perihal_surat: formData.get('perihal_surat'),
      tanggal_surat: formData.get('tanggal_surat'),
      subyek_simaster: formData.get('subyek_simaster'),
      jenis_json: JSON.parse(formData.get('jenis_json') as string || '[]'),
      pic: formData.get('pic'),
      tanggal_disposisi: formData.get('tanggal_disposisi') || null,
      tanggal_selesai: formData.get('tanggal_selesai') || null,
      baris_rkat_dirubah: formData.get('baris_rkat_dirubah'),
      nominal_semula: formData.get('nominal_semula') ? parseFloat(formData.get('nominal_semula') as string) : null,
      nominal_menjadi: formData.get('nominal_menjadi') ? parseFloat(formData.get('nominal_menjadi') as string) : null,
      link_google_drive: formData.get('link_google_drive'),
      file_upload: fileUrl,
      created_by: user.id,
      is_active: 1
    };

    // 3. Simpan ke Tabel surat_revisi
    const { error } = await supabase.from('surat_revisi').insert(data);
    
    if (error) {
       console.error('Supabase Insert Error:', error);
       throw new Error("Gagal menyimpan ke database: " + error.message);
    }

    revalidatePath('/surat');
    return { success: true };
  } catch (error: any) {
    console.error('Error in createSuratRevisi:', error);
    return { success: false, error: error.message };
  }
}

export async function getSuratRevisi() {
   const { data, error } = await supabase
      .from('surat_revisi')
      .select('*, gov_units(nama_unit)')
      .eq('is_active', 1)
      .order('id', { ascending: false });
      
   if (error) {
     console.error("DEBUG - Error Fetch Surat:", error);
     throw error;
   }
   return data;
}

export async function updateSuratRevisi(id: string, payload: any) {
  try {
    const { error } = await supabase
      .from('surat_revisi')
      .update(payload)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/surat');
    return { success: true };
  } catch (error: any) {
    console.error('Error in updateSuratRevisi:', error);
    return { success: false, error: error.message };
  }
}

export async function getMyPermissions(path: string, token?: string, userId?: string, userEmail?: string) {
  try {
    const hardcodedAdminId = "e4f82337-1092-4322-a1d5-81dd5211e718";
    
    // PROTOKOL DARURAT: Jika Client sudah mengenali User, kita berikan akses Admin langsung
    if (userId === hardcodedAdminId || userEmail === "bagusejogja@gmail.com") {
      return { can_view: true, can_create: true, can_edit: true, can_delete: true, debug: "Emergency Client-Identity Bypass" };
    }

    if (token) {
      await supabase.auth.setSession({ access_token: token, refresh_token: '' });
    }

    let { data: { user } } = await supabase.auth.getUser();
    
    // JIKA GAGAL DAPAT USER, TAPI KITA PUNYA TOKEN, KITA COBA DECODE TOKENNYA (opsional)
    // ATAU: Kita beri pengecekan darurat jika memang ini adalah Anda (berdasarkan email/id yang dikirim client)
    
    if (user?.id === hardcodedAdminId || user?.email === "bagusejogja@gmail.com") {
      return { can_view: true, can_create: true, can_edit: true, can_delete: true, debug: "Super Admin Bypass Active" };
    }

    if (!user) return { can_view: false, can_create: false, debug: "No Auth User Found on Server" };

    // 2. Ambil role user dari DB
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (userError) return { can_view: false, can_create: false, debug: "DB Error: " + userError.message };
    if (!userData) return { can_view: false, can_create: false, debug: "User not in app_users table" };

    const userRole = userData.role?.toLowerCase();

    if (userRole === 'admin') {
      return { can_view: true, can_create: true, can_edit: true, can_delete: true, debug: "Admin Role Bypass" };
    }

    // 3. Ambil permission dari tabel app_role_menus
    const { data: permData, error: permError } = await supabase
      .from('app_role_menus')
      .select('*')
      .eq('role', userData.role)
      .eq('path', path)
      .single();

    if (permError) return { can_view: false, can_create: false, debug: "Perm Error: " + permError.message };

    return { ...permData, debug: "Permission Found" };
  } catch (err: any) {
    return { can_view: false, can_create: false, debug: "System Error: " + err.message };
  }
}
