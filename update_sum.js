const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Mengubah is_sum = false untuk PENERIMAAN dan PENGELUARAN...");
  
  const { data: d1, error: e1 } = await supabase
    .from('app_laporan_akun')
    .update({ is_sum: false })
    .eq('keterangan', 'PENERIMAAN')
    .select();
    
  const { data: d2, error: e2 } = await supabase
    .from('app_laporan_akun')
    .update({ is_sum: false })
    .eq('keterangan', 'PENGELUARAN')
    .select();
    
  console.log("D1:", d1, "E1:", e1);
  console.log("D2:", d2, "E2:", e2);
  console.log("Selesai!");
}

run();
