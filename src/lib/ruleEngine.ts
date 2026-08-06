import { supabaseAdmin } from './supabase';

export async function evaluateWithRuleEngine(budgetData: any) {
  // Ambil semua rules dari database dan urutkan berdasarkan prioritas (terkecil = diproses lebih dulu)
  const { data: rules, error } = await supabaseAdmin
    .from('rules')
    .select('*')
    .order('priority', { ascending: true });

  if (error || !rules) {
    console.error("Error fetching rules:", error);
    return { matched: false }; // Gagal memuat rule, anggap tidak match
  }

  // Cek setiap rule
  for (const rule of rules) {
    let match = true;

    // Cek Unit Kerja jika ada
    if (rule.unitkerja_nama && rule.unitkerja_nama !== budgetData.unitkerja_nama) {
      match = false;
    }

    // Cek Akun jika ada (cek prefix agar 521111 cocok dengan "521111 - Nama")
    if (match && rule.akun && !budgetData.akun.startsWith(rule.akun)) {
      match = false;
    }

    // Cek Kata Kunci Deskripsi menggunakan operator (cari di keempat kolom)
    if (match && rule.kata_kunci_deskripsi) {
      const keyword = rule.kata_kunci_deskripsi.toLowerCase();
      
      const deskripsi = (budgetData.deskripsi || '').toLowerCase();
      const komponen = (budgetData.komponen_nama || '').toLowerCase();
      const lingkup = (budgetData.lingkup || '').toLowerCase();
      const maksud = (budgetData.maksud_tujuan || '').toLowerCase();
      
      const combinedText = `${deskripsi} | ${komponen} | ${lingkup} | ${maksud}`;
      
      if (rule.operator === 'CONTAINS' && !combinedText.includes(keyword)) {
        match = false;
      } else if (rule.operator === 'EQUALS' && deskripsi !== keyword && komponen !== keyword && lingkup !== keyword && maksud !== keyword) {
        match = false;
      } else if (rule.operator === 'STARTS_WITH' && !deskripsi.startsWith(keyword) && !komponen.startsWith(keyword) && !lingkup.startsWith(keyword) && !maksud.startsWith(keyword)) {
        match = false;
      }
    }

    if (match) {
      return { matched: true, custom_status: rule.custom_status }; // Ditemukan kecocokan dengan Rule Eksak
    }
  }

  return { matched: false };
}
