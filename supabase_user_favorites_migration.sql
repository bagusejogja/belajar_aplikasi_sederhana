-- ==========================================================
-- Migration: app_user_favorites (Menu Favorit Personal Pengguna)
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.app_user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_path_favorite UNIQUE (user_id, path)
);

-- Index untuk mempercepat query per user
CREATE INDEX IF NOT EXISTS idx_user_favorites_userid ON public.app_user_favorites (user_id);

-- Enable RLS
ALTER TABLE public.app_user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy untuk membaca dan menulis favorit masing-masing user
DROP POLICY IF EXISTS "Allow user to manage own favorites" ON public.app_user_favorites;
CREATE POLICY "Allow user to manage own favorites"
    ON public.app_user_favorites
    FOR ALL
    USING (true)
    WITH CHECK (true);
