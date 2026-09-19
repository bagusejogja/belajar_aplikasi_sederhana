-- ====================================================================
-- SCRIPT MIGRASI: Tambah Kolom db_id Pada Tabel rkat_pengeluaran
-- Target: Jalankan di Supabase SQL Editor
-- ====================================================================

ALTER TABLE public.rkat_pengeluaran 
ADD COLUMN IF NOT EXISTS db_id TEXT;

-- Index untuk mempermudah dan mempercepat query pencarian db_id
CREATE INDEX IF NOT EXISTS idx_rkat_pengeluaran_db_id 
ON public.rkat_pengeluaran(db_id);

-- Reload schema PostgREST agar API Supabase langsung mengenali kolom baru
NOTIFY pgrst, 'reload schema';
