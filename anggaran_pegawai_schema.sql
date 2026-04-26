-- Table for Anggaran Pegawai
CREATE TABLE IF NOT EXISTS public.gov_anggaran_pegawai (
    id SERIAL PRIMARY KEY,
    nama_pegawai TEXT NOT NULL,
    nip TEXT,
    tanggal_lahir DATE,
    jenis_kelamin TEXT,
    status TEXT,
    pendidikan TEXT,
    golongan TEXT,
    jabatan TEXT,
    kategori TEXT,
    kelas_jabatan_tukin TEXT,
    gaji_pokok_bulan NUMERIC(18,2) DEFAULT 0,
    tunjangan_istri NUMERIC(18,2) DEFAULT 0,
    tunjangan_anak NUMERIC(18,2) DEFAULT 0,
    tunjangan_upns NUMERIC(18,2) DEFAULT 0,
    tunjangan_struk NUMERIC(18,2) DEFAULT 0,
    tunjangan_fungs NUMERIC(18,2) DEFAULT 0,
    tunjangan_beras NUMERIC(18,2) DEFAULT 0,
    tunjangan_pph NUMERIC(18,2) DEFAULT 0,
    tunjangan_struktural NUMERIC(18,2) DEFAULT 0,
    tunjangan_fungsional NUMERIC(18,2) DEFAULT 0,
    tunjangan_kinerja NUMERIC(18,2) DEFAULT 0,
    no_sertifikasi_serdos TEXT,
    tanggal_sertifikasi_dosen DATE,
    tunjangan_serdos NUMERIC(18,2) DEFAULT 0,
    no_sertifikasi_gb TEXT,
    tanggal_sertifikasi_gb DATE,
    tunjangan_guru_besar NUMERIC(18,2) DEFAULT 0,
    uang_makan NUMERIC(18,2) DEFAULT 0,
    unit_kerja TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexing for performance
CREATE INDEX idx_gov_anggaran_pegawai_nip ON public.gov_anggaran_pegawai (nip);
CREATE INDEX idx_gov_anggaran_pegawai_unit ON public.gov_anggaran_pegawai (unit_kerja);
