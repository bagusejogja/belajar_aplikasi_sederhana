-- ====================================================================
-- PERBAIKAN 9 BARIS DATA rkat_penerimaan YANG TERGESER SAAT IMPORT
-- Target: Jalankan di Supabase SQL Editor
-- ====================================================================

UPDATE public.rkat_penerimaan
SET 
  nama_akun_penerimaan = '41101.04.06.01 Penerimaan UKT S2 | Tarif Uang Kuliah Tarif 1',
  tahun = renterima_is_aktif::integer,
  renterima_is_aktif = renterima_volume::integer,
  renterima_volume = renterima_tarif,
  renterima_tarif = renterima_jumlah,
  renterima_jumlah = renterima_pagu,
  renterima_pagu = status::numeric,
  status = keterangan,
  keterangan = sumber_dana,
  sumber_dana = 'Dana Masyarakat Tidak Mengikat',
  updated_at = NOW()
WHERE tahun = 41101;
