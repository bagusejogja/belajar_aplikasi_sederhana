-- ====================================================================
-- SCRIPT MIGRASI DATABASE SUPABASE: REVIEW ANGGARAN ADD APPROVED COLUMNS
-- Target Database: Supabase SQL Editor
-- ====================================================================

-- 1. Tambah Kolom Approved & Penyesuaian ke Tabel 'budgets'
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS tarif_approved NUMERIC DEFAULT 0;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS volumen_approved NUMERIC DEFAULT 0;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS total_approve NUMERIC DEFAULT 0;
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS nominal_penyesuaian NUMERIC DEFAULT 0;

-- 2. Bersihkan ai_reason yang berisi 'Match exact rule dari Master Aturan' menjadi NULL
UPDATE public.budgets 
SET ai_reason = NULL 
WHERE ai_reason ILIKE '%Match exact rule dari Master Aturan%';

-- 3. Reload schema cache Supabase PostgREST
NOTIFY pgrst, 'reload schema';
