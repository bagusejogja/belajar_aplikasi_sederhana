import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Kita tambahkan pengecekan agar tidak error saat build jika .env belum diisi
const isSupabaseConfigured = supabaseUrl !== '' && supabaseUrl !== 'https://your-project.supabase.co';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);

export const supabaseAdmin = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || (isSupabaseConfigured ? supabaseAnonKey : 'placeholder')
);

export { isSupabaseConfigured };

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseAdmin = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseServiceKey : 'placeholder'
);
