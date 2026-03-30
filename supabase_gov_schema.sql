-- SQL Schema for Government Fund Management (UGM) - AUTO INCREMENT IDs
-- Execute this in Supabase SQL Editor

-- 1. Table for Government COA (Master Accounts)
CREATE TABLE IF NOT EXISTS public.gov_accounts (
    id SERIAL PRIMARY KEY,
    account_code TEXT UNIQUE NOT NULL, -- e.g., 511111
    account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for Organizational Units (Master)
CREATE TABLE IF NOT EXISTS public.gov_units (
    id SERIAL PRIMARY KEY,
    kode_unit TEXT UNIQUE NOT NULL,
    nama_unit TEXT NOT NULL,
    group_org TEXT, -- e.g., KPTU, Fakultas, Pusat Studi
    pic TEXT, -- Primary contact / Nama Orang
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table for Transactions (Pagu & Realisasi)
CREATE TABLE IF NOT EXISTS public.gov_transactions (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    account_id INTEGER REFERENCES public.gov_accounts(id), 
    unit_id INTEGER REFERENCES public.gov_units(id),    
    nominal NUMERIC(18,2) DEFAULT 0,
    jenis TEXT CHECK (jenis IN (
      'pagu awal',
      'pengurangan pagu',
      'tambah pagu',
      'realokasi tambah',
      'realokasi kurang',
      'realisasi'
    )),
    nama_input TEXT, -- Nama orang di input (bisa beda dari PIC unit)
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) -- Keep UUID for external user link
);

-- Indexing for performance
CREATE INDEX idx_gov_trx_tanggal ON public.gov_transactions (tanggal);
CREATE INDEX idx_gov_trx_unit ON public.gov_transactions (unit_id);
CREATE INDEX idx_gov_trx_account ON public.gov_transactions (account_id);

-- ───── DATA PRE-FILL (MASTER ACCOUNTS) ─────
INSERT INTO public.gov_accounts (account_code, account_name) VALUES
('511111', 'Belanja Gaji Pokok PNS'),
('511119', 'Belanja Pembulatan Gaji PNS'),
('511121', 'Belanja Tunj. Suami/Istri PNS'),
('511122', 'Belanja Tunj. Anak PNS'),
('511123', 'Belanja Tunj. Struktural PNS'),
('511124', 'Belanja Tunj. Fungsional PNS'),
('511125', 'Belanja Tunj. PPh PNS'),
('511126', 'Belanja Tunj. Beras PNS'),
('511129', 'Belanja Uang Makan PNS'),
('511137', 'Belanja Tunj. Tugas Belajar Tenaga Pengajar Pasca Sarjana PNS'),
('511151', 'Belanja Tunjangan Umum PNS'),
('511153', 'Belanja Tunjangan Profesi Dosen'),
('511154', 'Belanja Tunjangan Kehormatan Profesor'),
('511611', 'Belanja Gaji Pokok PPPK'),
('511619', 'Belanja Pembulatan Gaji PPPK'),
('511621', 'Belanja Tunjangan Suami/Istri PPPK'),
('511622', 'Belanja Tunjangan Anak PPPK'),
('511624', 'Belanja Tunjangan Fungsional PPPK'),
('511625', 'Belanja Tunjangan Beras PPPK'),
('511628', 'Belanja Uang Makan PPPK'),
('511521', 'Belanja Tunjangan Tenaga Pendidik Non PNS')
ON CONFLICT (account_code) DO NOTHING;

-- ───── DATA PRE-FILL (ORGANIZATIONAL UNITS) ─────
INSERT INTO public.gov_units (kode_unit, nama_unit, group_org, pic) VALUES
('010101', 'Majelis Wali Amanat', 'KPTU', 'Bagus Sri Widodo'),
('010201', 'Dewan Guru Besar', 'KPTU', 'Bambang Indarto'),
('010301', 'Senat Akademik', 'KPTU', 'Muslifah Iswandari'),
('010401', 'Komite Audit', 'KPTU', 'Ridwan Aditya Mahendra'),
('010501', 'Sekretaris Universitas', 'KPTU', 'Bagus Sri Widodo'),
('010503', 'Biro Hukum dan Organisasi', 'KPTU', 'Bambang Indarto'),
('010506', 'Satuan Pengawas Internal', 'KPTU', 'Muslifah Iswandari'),
('010507', 'Direktorat Teknologi Informasi', 'KPTU', 'Ridwan Aditya Mahendra'),
('010508', 'Kantor Keamanan, Keselamatan Kerja, Kedaruratan, dan Lingkungan', 'KPTU', 'Bagus Sri Widodo'),
('010515', 'Biro Manajemen Strategis', 'KPTU', 'Bambang Indarto'),
('010516', 'Biro Transformasi Digital', 'KPTU', 'Muslifah Iswandari'),
('010517', 'Biro Pelayanan Kesehatan Terpadu', 'KPTU', 'Ridwan Aditya Mahendra'),
('010601', 'Direktorat Kajian dan Inovasi Akademik', 'KPTU', 'Bagus Sri Widodo'),
('010602', 'Satuan Penjaminan Mutu dan Reputasi Universitas', 'KPTU', 'Bambang Indarto'),
('010603', 'Direktorat Pendidikan Dan Pengajaran', 'KPTU', 'Muslifah Iswandari'),
('010604', 'Direktorat Kemahasiswaan', 'KPTU', 'Ridwan Aditya Mahendra'),
('010605', 'Perpustakaan dan Arsip', 'KPTU', 'Bagus Sri Widodo'),
('010702', 'Laboratorium Penelitian dan Pengujian Terpadu', 'KPTU', 'Bambang Indarto'),
('010703', 'Pusat Inovasi dan Agroteknologi', 'KPTU', 'Muslifah Iswandari'),
('010704', 'Direktorat Penelitian', 'KPTU', 'Ridwan Aditya Mahendra'),
('010801', 'Direktorat Perencanaan', 'KPTU', 'Bambang Indarto'),
('010802', 'Direktorat Keuangan', 'KPTU', 'Muslifah Iswandari'),
('010803', 'Direktorat Aset', 'KPTU', 'Ridwan Aditya Mahendra'),
('010804', 'Direktorat Sumber Daya Manusia', 'KPTU', 'Bagus Sri Widodo'),
('010809', 'Direktorat Kemitraan dan Relasi Global', 'KPTU', 'Bambang Indarto'),
('010810', 'Direktorat Pengembangan Usaha', 'KPTU', 'Muslifah Iswandari'),
('010811', 'Kantor Pengadaan', 'KPTU', 'Ridwan Aditya Mahendra'),
('010815', 'Kantor Alumni', 'KPTU', 'Bagus Sri Widodo'),
('02000010', 'Fakultas Biologi', 'Fakultas', 'Bagus Sri Widodo'),
('03000010', 'Fakultas Ekonomika dan Bisnis', 'Fakultas', 'Bambang Indarto'),
('04000010', 'Fakultas Farmasi', 'Fakultas', 'Muslifah Iswandari'),
('05000010', 'Fakultas Filsafat', 'Fakultas', 'Ridwan Aditya Mahendra'),
('06000010', 'Fakultas Geografi', 'Fakultas', 'Bambang Indarto'),
('07000010', 'Fakultas Hukum', 'Fakultas', 'Muslifah Iswandari'),
('08000010', 'Fakultas Ilmu Budaya', 'Fakultas', 'Ridwan Aditya Mahendra'),
('09000010', 'Fakultas Ilmu Sosial dan Ilmu Politik', 'Fakultas', 'Bambang Indarto'),
('10000010', 'Fakultas Kedokteran Kesehatan Masyarakat dan Keperawatan', 'Fakultas', 'Bagus Sri Widodo'),
('11000010', 'Fakultas Kedokteran Gigi', 'Fakultas', 'Muslifah Iswandari'),
('12000010', 'Fakultas Kedokteran Hewan', 'Fakultas', 'Bagus Sri Widodo'),
('13000010', 'Fakultas Kehutanan', 'Fakultas', 'Bambang Indarto'),
('14000010', 'Fakultas Matematika dan Ilmu Pengetahuan Alam', 'Fakultas', 'Muslifah Iswandari'),
('15000010', 'Fakultas Pertanian', 'Fakultas', 'Ridwan Aditya Mahendra'),
('16000010', 'Fakultas Peternakan', 'Fakultas', 'Ridwan Aditya Mahendra'),
('17000010', 'Fakultas Psikologi', 'Fakultas', 'Bagus Sri Widodo'),
('18000010', 'Fakultas Teknik', 'Fakultas', 'Bambang Indarto'),
('19000010', 'Fakultas Teknologi Pertanian', 'Fakultas', 'Muslifah Iswandari'),
('400705', 'Pusat Studi (PS) Kebudayaan', 'Pusat Studi', 'Muslifah Iswandari'),
('400706', 'Pusat Studi (PS) Kependudukan dan Kebijakan', 'Pusat Studi', 'Bambang Indarto'),
('400707', 'Pusat Studi (PS) Lingkungan Hidup', 'Pusat Studi', 'Ridwan Aditya Mahendra'),
('400708', 'Pusat Studi (PS) Pedesaan dan Kawasan', 'Pusat Studi', 'Ridwan Aditya Mahendra'),
('400712', 'Pusat Studi (PS) Pariwisata', 'Pusat Studi', 'Bambang Indarto'),
('--', 'Masjid Kampus', 'Tempat Ibadah', '-')
ON CONFLICT (kode_unit) DO NOTHING;
