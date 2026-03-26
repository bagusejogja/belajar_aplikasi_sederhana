import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Kita tambahkan pengecekan agar tidak error saat build jika .env belum diisi
const isSupabaseConfigured = supabaseUrl !== '' && supabaseUrl !== 'https://your-project.supabase.co';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);

export { isSupabaseConfigured };
