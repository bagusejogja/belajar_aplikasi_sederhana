-- ====================================================================
-- SKRIP SQL: Pembuatan Tabel Menu Favorit Personal Pengguna
-- Jalankan skrip ini pada Supabase SQL Editor agar menu favorit
-- tersimpan permanen di cloud database (tidak hilang saat ganti browser/device)
-- ====================================================================

-- 1. Buat tabel app_user_favorites jika belum ada
CREATE TABLE IF NOT EXISTS public.app_user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_user_favorite UNIQUE (user_id, path)
);

-- 2. Buat index untuk mempercepat pencarian favorit per user
CREATE INDEX IF NOT EXISTS idx_app_user_favorites_user_id ON public.app_user_favorites (user_id);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE public.app_user_favorites ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan RLS: Memungkinkan select, insert, delete untuk authenticated dan anon
DROP POLICY IF EXISTS "Public access to app_user_favorites" ON public.app_user_favorites;
CREATE POLICY "Public access to app_user_favorites"
ON public.app_user_favorites
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Berikan izin akses
GRANT ALL ON TABLE public.app_user_favorites TO anon, authenticated, service_role;
