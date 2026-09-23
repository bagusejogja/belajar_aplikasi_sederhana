-- ====================================================================
-- SCRIPT MIGRASI DATABASE SUPABASE: TAMBAH FORMULA & CATATAN
-- Target Database: Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Tambah Kolom 'formula' ke Tabel 'app_laporan_akun' (Master Akun Laporan)
ALTER TABLE public.app_laporan_akun 
ADD COLUMN IF NOT EXISTS formula TEXT DEFAULT NULL;

-- 2. Tambah Kolom 'catatan' ke Tabel 'app_laporan_statis' (Nilai Anggaran & Realisasi)
ALTER TABLE public.app_laporan_statis 
ADD COLUMN IF NOT EXISTS catatan TEXT DEFAULT NULL;

-- 3. Reload PostgREST schema cache agar kolom baru langsung terbaca di API Supabase
NOTIFY pgrst, 'reload schema';
