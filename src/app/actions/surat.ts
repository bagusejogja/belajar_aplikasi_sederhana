'use server';

import { supabase } from '@/lib/supabase';
import { uploadFileToR2 } from './r2-upload';
import { revalidatePath } from 'next/cache';

export async function createSuratRevisi(formData: FormData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userIdFallback = formData.get('user_id') as string;
    
    if (!user && !userIdFallback) {
      throw new Error("Sesi berakhir, silakan login kembali.");
    }
    
    const activeUserId = user?.id || userIdFallback;

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

    // 2. Siapkan data untuk Database (DENGAN PENGECEKAN KETAT)
    const unitIdStr = formData.get('unit_id') as string;
    const tahunStr = formData.get('tahun_anggaran') as string;
    const nominalSemulaStr = formData.get('nominal_semula') as string;
    const nominalMenjadiStr = formData.get('nominal_menjadi') as string;
    
    if (!unitIdStr || isNaN(parseInt(unitIdStr))) {
      return { success: false, error: "Unit Kerja harus dipilih dengan benar!" };
    }

    const data = {
      unit_id: parseInt(unitIdStr),
      tahun_anggaran: parseInt(tahunStr) || new Date().getFullYear(),
      no_surat: formData.get('no_surat')?.toString() || '',
      perihal_surat: formData.get('perihal_surat')?.toString() || '',
      tanggal_surat: formData.get('tanggal_surat')?.toString() || null,
      subyek_simaster: formData.get('subyek_simaster')?.toString() || '',
      jenis_json: JSON.parse(formData.get('jenis_json') as string || '[]'),
      pic: formData.get('pic')?.toString() || '',
      tanggal_disposisi: formData.get('tanggal_disposisi')?.toString() || null,
      tanggal_selesai: formData.get('tanggal_selesai')?.toString() || null,
      baris_rkat_dirubah: formData.get('baris_rkat_dirubah')?.toString() || '',
      nominal_semula: nominalSemulaStr ? parseFloat(nominalSemulaStr) : null,
      nominal_menjadi: nominalMenjadiStr ? parseFloat(nominalMenjadiStr) : null,
      link_google_drive: formData.get('link_google_drive')?.toString() || '',
      file_upload: fileUrl,
      created_by: activeUserId,
      is_active: 1
    };

    console.log("[DEBUG] Memasuki tahap simpan ke DB...");
    const { error: dbError } = await supabase.from('surat_revisi').insert(data);
    
    if (dbError) {
       console.error('SUPABASE_INSERT_FAILED:', dbError);
       return { success: false, error: `Gagal Simpan Database: ${dbError.message} (Pstgrs: ${dbError.code})` };
    }

    console.log("[DEBUG] Simpan Berhasil di sisi Server!");
    revalidatePath('/surat');
    return { success: true };
  } catch (error: any) {
    console.error('SERVER_ACTION_FATAL_CRASH:', error);
    // Kita tangkap error mentahnya dan kembalikan sebagai string agar tidak "Unexpected Response"
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      success: false, 
      error: `Server Error Detail: ${errorMessage}` 
    };
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

export async function updateSuratRevisi(id: string, payload: any, userIdFallback?: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const activeUserId = user?.id || userIdFallback;
    
    if (!activeUserId) throw new Error("Identitas user tidak ditemukan.");

    const { error } = await supabase
      .from('surat_revisi')
      .update({ ...payload, updated_by: activeUserId })
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
    
    // FALLBACK STRATEGY: Jika auth.getUser gagal, gunakan ID/Email dari client (Bapak)
    const effectiveUserId = user?.id || userId;
    const effectiveUserEmail = user?.email || userEmail;
    
    if (!effectiveUserId) return { can_view: false, can_create: false, debug: "No Auth User Found on Server & Client" };

    if (effectiveUserId === hardcodedAdminId || effectiveUserEmail === "bagusejogja@gmail.com") {
      return { can_view: true, can_create: true, can_edit: true, can_delete: true, debug: "Super Admin Bypass Active" };
    }

    // 2. Ambil role user dari DB menggunakan ID yang tersedia
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('role')
      .eq('id', effectiveUserId)
      .single();
      
    if (userError) return { can_view: false, can_create: false, debug: "DB Error: " + userError.message };
    if (!userData) return { can_view: false, can_create: false, debug: "User not in app_users table" };

    const userRole = userData.role?.toLowerCase();

    if (userRole === 'admin') {
      return { can_view: true, can_create: true, can_edit: true, can_delete: true, debug: "Admin Role Bypass" };
    }

    // 3. Ambil permission dari tabel app_role_menus (Gunakan ILIKE agar tidak sensitif huruf besar/kecil)
    const { data: permData, error: permError } = await supabase
      .from('app_role_menus')
      .select('*')
      .ilike('role', userData.role)
      .eq('path', path)
      .maybeSingle(); // Gunakan maybeSingle agar tidak error jika tidak ditemukan

    if (permError) return { can_view: false, can_create: false, debug: "Perm Error: " + permError.message };

    return { ...permData, userRole, debug: "Permission Found" };
  } catch (err: any) {
    return { can_view: false, can_create: false, debug: "System Error: " + err.message };
  }
}
