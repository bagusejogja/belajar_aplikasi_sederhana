-- SQL Schema for Government Fund Management (UGM)
-- Execute this in Supabase SQL Editor

-- 1. Table for Organizational Units (Master)
CREATE TABLE IF NOT EXISTS public.gov_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_unit TEXT UNIQUE NOT NULL,
    nama_unit TEXT NOT NULL,
    group_org TEXT, -- e.g., KPTU, Fakultas, Pusat Studi
    pic TEXT, -- Primary contact / Nama Orang
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table for Government COA (Master Accounts)
CREATE TABLE IF NOT EXISTS public.gov_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code TEXT UNIQUE NOT NULL, -- e.g., 511111
    account_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table for Transactions (Pagu & Realisasi)
CREATE TABLE IF NOT EXISTS public.gov_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    account_id TEXT NOT NULL, -- FK to gov_accounts or code
    unit_id TEXT NOT NULL,    -- FK to gov_units or code
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
    created_by UUID REFERENCES auth.users(id)
);

-- Indexing for performance
CREATE INDEX idx_gov_trx_tanggal ON public.gov_transactions (tanggal);
CREATE INDEX idx_gov_trx_unit ON public.gov_transactions (unit_id);
CREATE INDEX idx_gov_trx_account ON public.gov_transactions (account_id);

-- 4. Enable Row Level Security (RLS) for basic safety
ALTER TABLE public.gov_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gov_transactions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read master data
CREATE POLICY "Allow read for all users" ON public.gov_units FOR SELECT USING (true);
CREATE POLICY "Allow read for all accounts" ON public.gov_accounts FOR SELECT USING (true);

-- Transactions: Admins can do everything, others read the results
CREATE POLICY "Admins can manage transactions" ON public.gov_transactions 
    FOR ALL USING (auth.role() = 'service_role' OR EXISTS (
        SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'Admin'
    ));
