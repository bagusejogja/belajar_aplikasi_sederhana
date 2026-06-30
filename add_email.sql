ALTER TABLE public.mak_submissions ADD COLUMN IF NOT EXISTS email varchar(255); NOTIFY pgrst, 'reload schema';
