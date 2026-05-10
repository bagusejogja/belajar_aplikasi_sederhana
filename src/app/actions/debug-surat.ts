'use server';

import { supabase } from '@/lib/supabase';

export async function debugSuratData() {
  try {
    const { data, error } = await supabase
      .from('surat_revisi')
      .select('id, no_surat, link_google_drive, file_upload')
      .limit(10);
    
    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message };
  }
}
