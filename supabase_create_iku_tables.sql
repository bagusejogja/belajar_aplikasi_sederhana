-- ==============================================================================
-- MIGRASI TABEL KHUSUS STATUS KUNCI & URAIAN IKU (PORTALKEU)
-- Jalankan skrip ini sekali di menu SQL Editor pada Dashboard Supabase Anda
-- ==============================================================================

-- 1. Tabel Status Kunci Kegiatan IKU (app_iku_locks)
CREATE TABLE IF NOT EXISTS public.app_iku_locks (
  id BIGSERIAL PRIMARY KEY,
  kegiatan_id BIGINT NOT NULL UNIQUE,
  locked_by TEXT DEFAULT 'User',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_iku_locks_kegiatan ON public.app_iku_locks (kegiatan_id);

-- 2. Tabel Custom Uraian Indikator IKU (app_iku_uraian)
CREATE TABLE IF NOT EXISTS public.app_iku_uraian (
  id BIGSERIAL PRIMARY KEY,
  ref_iku TEXT NOT NULL UNIQUE,
  uraian TEXT NOT NULL,
  updated_by TEXT DEFAULT 'User',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_iku_uraian_ref ON public.app_iku_uraian (ref_iku);

-- 3. Tabel Kegiatan Tambahan / Perubahan Data Kegiatan (app_iku_custom_kegiatan)
CREATE TABLE IF NOT EXISTS public.app_iku_custom_kegiatan (
  id BIGSERIAL PRIMARY KEY,
  kegiatan_id BIGINT, -- Terisi ID jika mengedit kegiatan lama, NULL jika kegiatan baru
  tujuan_kode TEXT,
  tujuan_nama TEXT,
  sasaran_kode TEXT,
  sasaran_nama TEXT,
  program_kode TEXT,
  program_nama TEXT,
  kegiatan_kode TEXT,
  kegiatan_nama TEXT NOT NULL,
  ref_iku TEXT NOT NULL,
  ref_tahun_iku INTEGER DEFAULT 2026,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_iku_custom_kegiatan_ref ON public.app_iku_custom_kegiatan (ref_iku);
CREATE INDEX IF NOT EXISTS idx_app_iku_custom_kegiatan_id ON public.app_iku_custom_kegiatan (kegiatan_id);

-- 4. Row Level Security (RLS) & Hak Akses
ALTER TABLE public.app_iku_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_iku_uraian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_iku_custom_kegiatan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to app_iku_locks" ON public.app_iku_locks;
CREATE POLICY "Public access to app_iku_locks"
  ON public.app_iku_locks FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to app_iku_uraian" ON public.app_iku_uraian;
CREATE POLICY "Public access to app_iku_uraian"
  ON public.app_iku_uraian FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to app_iku_custom_kegiatan" ON public.app_iku_custom_kegiatan;
CREATE POLICY "Public access to app_iku_custom_kegiatan"
  ON public.app_iku_custom_kegiatan FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE public.app_iku_locks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_iku_uraian TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.app_iku_custom_kegiatan TO anon, authenticated, service_role;
