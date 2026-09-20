-- ====================================================================
-- SCRIPT MIGRASI DATABASE SUPABASE: TAMBAH KOLOM PROP_ALOKASI_PROSENTASE_UNIT
-- Target Database: Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Tambah kolom prop_alokasi_prosentase_unit ke tabel rkat_penerimaan
ALTER TABLE public.rkat_penerimaan 
ADD COLUMN IF NOT EXISTS prop_alokasi_prosentase_unit NUMERIC(10,4) DEFAULT 100;

-- 2. Tambah kolom prop_alokasi_prosentase_unit ke tabel gov_units
ALTER TABLE public.gov_units 
ADD COLUMN IF NOT EXISTS prop_alokasi_prosentase_unit NUMERIC(10,4) DEFAULT 100;

-- 3. Reload schema cache PostgREST agar API Supabase langsung mengenali kolom baru
NOTIFY pgrst, 'reload schema';
