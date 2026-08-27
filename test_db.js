const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env
const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL.replace(/"/g, '');
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY.replace(/"/g, '');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data: tambahPaguData, error: tpError } = await supabase
    .from('tambah_pagu')
    .select('*')
    .ilike('no_surat_pengajuan', '%728/UN1/K4L/K-K4L/KU.00.01/2026%');

  console.log('Tambah Pagu matching 728:', tambahPaguData, tpError);

  const { data: utamaData, error: utError } = await supabase
    .from('app_analisis_utama')
    .select('*')
    .ilike('no_surat', '%728/UN1/K4L/K-K4L/KU.00.01/2026%');

  console.log('Analisis Utama matching 728:', utamaData, utError);
}

checkDb();
