-- =========================================================================
-- MIGRATION: Table app_documents & app_document_categories
-- Modul: Persuratan -> Dokumen & Masa Berlaku
-- Deskripsi: Pencatatan arsip dokumen persuratan lengkap dengan pelacakan masa berlaku
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.app_documents (
    id BIGSERIAL PRIMARY KEY,
    jenis_dokumen VARCHAR(100) NOT NULL DEFAULT 'Lainnya',
    nomor_surat VARCHAR(255) NOT NULL,
    perihal TEXT NOT NULL,
    tanggal_surat DATE,
    tanggal_berlaku DATE,
    tanggal_berakhir DATE,
    unit_kerja VARCHAR(255),
    pihak_terkait TEXT,
    penandatangan VARCHAR(255),
    sifat_dokumen VARCHAR(50) DEFAULT 'Biasa',
    lokasi_fisik VARCHAR(255),
    file_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    link_eksternal TEXT,
    tags TEXT[] DEFAULT '{}',
    keterangan TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for fast search and expiry status filtering
CREATE INDEX IF NOT EXISTS idx_app_documents_nomor ON public.app_documents(nomor_surat);
CREATE INDEX IF NOT EXISTS idx_app_documents_jenis ON public.app_documents(jenis_dokumen);
CREATE INDEX IF NOT EXISTS idx_app_documents_tgl_berakhir ON public.app_documents(tanggal_berakhir);
CREATE INDEX IF NOT EXISTS idx_app_documents_tgl_berlaku ON public.app_documents(tanggal_berlaku);
CREATE INDEX IF NOT EXISTS idx_app_documents_unit ON public.app_documents(unit_kerja);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_documents ENABLE ROW LEVEL SECURITY;

-- Permissive policies for read/write
CREATE POLICY "Allow public read access to app_documents" ON public.app_documents
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to app_documents" ON public.app_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to app_documents" ON public.app_documents
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to app_documents" ON public.app_documents
    FOR DELETE USING (true);


-- -------------------------------------------------------------------------
-- TABLE: app_document_categories (Daftar Dinamis Jenis / Kategori Dokumen)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_document_categories (
    id BIGSERIAL PRIMARY KEY,
    nama VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_document_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to app_document_categories" ON public.app_document_categories
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to app_document_categories" ON public.app_document_categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to app_document_categories" ON public.app_document_categories
    FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to app_document_categories" ON public.app_document_categories
    FOR DELETE USING (true);

-- Default Initial Categories
INSERT INTO public.app_document_categories (nama) VALUES
    ('Surat Keputusan (SK)'),
    ('Surat Tugas'),
    ('Perjanjian Kerjasama (MoU/PKS)'),
    ('Surat Edaran'),
    ('Surat Perintah Kerja (SPK)'),
    ('Surat Keterangan'),
    ('Berita Acara'),
    ('SOP / Pedoman'),
    ('Kontrak / Pengadaan'),
    ('Nota Dinas'),
    ('Lainnya')
ON CONFLICT (nama) DO NOTHING;

NOTIFY pgrst, 'reload schema';
