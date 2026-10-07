-- Migration: Tambah kolom rka_selisih_data ke tabel mak_submissions
ALTER TABLE public.mak_submissions 
ADD COLUMN IF NOT EXISTS rka_selisih_data jsonb;

-- Reload schema cache PostgREST agar Supabase Client langsung mengenali kolom baru
NOTIFY pgrst, 'reload schema';
