-- ====================================================================
-- SCRIPT MIGRASI DATABASE SUPABASE: KOMPARASI LAPORAN ADD VERSI COLUMN
-- Target Database: Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Tambah Kolom 'versi' ke Tabel 'app_laporan_statis' jika belum ada
ALTER TABLE public.app_laporan_statis 
ADD COLUMN IF NOT EXISTS versi VARCHAR(50) DEFAULT 'Final';

-- 2. Update data lama yang kolom versinya masih NULL menjadi 'Final'
UPDATE public.app_laporan_statis 
SET versi = 'Final' 
WHERE versi IS NULL;

-- 3. Update Constraint Unique agar mendukung multi-versi per (akun_id, tahun, versi)
-- Hapus constraint lama jika ada (biasanya app_laporan_statis_akun_id_tahun_key)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'app_laporan_statis_akun_id_tahun_key'
    ) THEN
        ALTER TABLE public.app_laporan_statis DROP CONSTRAINT app_laporan_statis_akun_id_tahun_key;
    END IF;
END $$;

-- Buat unique constraint baru pada (akun_id, tahun, versi)
ALTER TABLE public.app_laporan_statis 
DROP CONSTRAINT IF EXISTS app_laporan_statis_akun_tahun_versi_key;

ALTER TABLE public.app_laporan_statis 
ADD CONSTRAINT app_laporan_statis_akun_tahun_versi_key UNIQUE (akun_id, tahun, versi);

-- 4. Reload PostgREST schema cache agar langsung aktif di API Supabase
NOTIFY pgrst, 'reload schema';
