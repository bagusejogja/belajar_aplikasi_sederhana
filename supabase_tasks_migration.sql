-- =========================================================================
-- MIGRATION: Table app_tasks (Manajemen Kegiatan: Catatan & Tugas Kerja)
-- Deskripsi: Mencatat tugas dan kegiatan kerja harian / berkala
-- Fasilitas: Catatan, Multi-Link, Screenshot (URL/Base64/Storage), File Dokumen
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.app_tasks (
    id BIGSERIAL PRIMARY KEY,
    judul TEXT NOT NULL,
    deskripsi TEXT,
    kategori TEXT DEFAULT 'Umum', -- e.g., 'Verifikasi', 'Anggaran', 'Rapat', 'Persuratan', 'Umum'
    prioritas TEXT DEFAULT 'Sedang', -- 'Rendah', 'Sedang', 'Tinggi', 'Urgent'
    status TEXT DEFAULT 'Belum Dikerjakan', -- 'Belum Dikerjakan', 'Sedang Dikerjakan', 'Selesai', 'Ditunda'
    deadline DATE,
    pic TEXT,
    catatan TEXT,
    links JSONB DEFAULT '[]'::jsonb, -- Array of objects: [{ "title": "...", "url": "..." }]
    screenshots JSONB DEFAULT '[]'::jsonb, -- Array of objects: [{ "url": "...", "caption": "...", "created_at": "..." }]
    dokumen JSONB DEFAULT '[]'::jsonb, -- Array of objects: [{ "name": "...", "url": "...", "size": 12345, "type": "pdf" }]
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for rapid filtering
CREATE INDEX IF NOT EXISTS idx_app_tasks_status ON public.app_tasks(status);
CREATE INDEX IF NOT EXISTS idx_app_tasks_prioritas ON public.app_tasks(prioritas);
CREATE INDEX IF NOT EXISTS idx_app_tasks_deadline ON public.app_tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_app_tasks_kategori ON public.app_tasks(kategori);

-- Enable RLS
ALTER TABLE public.app_tasks ENABLE ROW LEVEL SECURITY;

-- Permissive policy for authenticated / anon users (similar to app_timeline)
CREATE POLICY "Allow public read access to app_tasks" ON public.app_tasks
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to app_tasks" ON public.app_tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to app_tasks" ON public.app_tasks
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to app_tasks" ON public.app_tasks
    FOR DELETE USING (true);
