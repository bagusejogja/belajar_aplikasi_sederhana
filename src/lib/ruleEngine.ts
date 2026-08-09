import { supabaseAdmin } from './supabase';

export function evaluateRulesInMemory(budgetData: any, rules: any[]) {
  if (!rules || rules.length === 0) {
    return { matched: false };
  }

  const bUnit = (budgetData.unitkerja_nama || '').trim().toLowerCase();
  const bAkun = (budgetData.akun || '').trim().toLowerCase();
  const cleanBudgetCode = bAkun.split(/[\s-]/)[0]; // misal "53102"

  const deskripsi = (budgetData.deskripsi || '').toLowerCase();
  const komponen = (budgetData.komponen_nama || '').toLowerCase();
  const lingkup = (budgetData.lingkup || '').toLowerCase();
  const maksud = (budgetData.maksud_tujuan || '').toLowerCase();

  const combinedText = `${deskripsi} | ${komponen} | ${lingkup} | ${maksud}`;

  // Cek setiap rule sesuai urutan prioritas
  for (const rule of rules) {
    let match = true;

    // 1. Cek Unit Kerja (Mendukung multi unit dipisah '|' atau ',')
    if (rule.unitkerja_nama && rule.unitkerja_nama.trim() && rule.unitkerja_nama.trim() !== '*') {
      const unitList = rule.unitkerja_nama
        .toLowerCase()
        .split(/\||,/g)
        .map((u: string) => u.trim())
        .filter((u: string) => u.length > 0);

      const isUnitMatched = unitList.some((rUnit: string) => {
        return rUnit === bUnit || bUnit.includes(rUnit) || rUnit.includes(bUnit);
      });

      if (!isUnitMatched) {
        match = false;
      }
    }

    // 2. Cek Akun (Mendukung wildcard '*' atau multi akun dipisah '|' atau ',')
    if (match && rule.akun && rule.akun.trim() && rule.akun.trim() !== '*') {
      const akunList = rule.akun
        .toLowerCase()
        .split(/\||,/g)
        .map((a: string) => a.trim())
        .filter((a: string) => a.length > 0);

      const isAkunMatched = akunList.some((rAkun: string) => {
        const cleanRuleCode = rAkun.split(/[\s-]/)[0];
        return (cleanRuleCode && cleanBudgetCode && cleanRuleCode === cleanBudgetCode) ||
               bAkun.startsWith(rAkun) || 
               bAkun.includes(rAkun) || 
               rAkun.includes(bAkun);
      });

      if (!isAkunMatched) {
        match = false;
      }
    }

    // 3. Cek Kata Kunci Deskripsi (Mendukung frasa & multi kriteria dipisah '|', ';', newline, atau 'atau'/'OR')
    if (match && rule.kata_kunci_deskripsi && rule.kata_kunci_deskripsi.trim() && rule.kata_kunci_deskripsi.trim() !== '*') {
      const keywords = rule.kata_kunci_deskripsi
        .toLowerCase()
        .split(/;|\||\n|\r|\s+atau\s+|\s+or\s+/gi)
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);

      const matchedKeyword = keywords.some((k: string) => combinedText.includes(k));
      if (!matchedKeyword) {
        match = false;
      }
    }

    // Jika semua kriteria cocok untuk rule ini
    if (match) {
      return {
        matched: true,
        rule_id: rule.id,
        status_kunci: rule.status_kunci || 'Y',
        custom_status: rule.custom_status || 'Wajib Ada',
        rule_name: rule.nama_rule || 'Rule Penguncian Anggaran'
      };
    }
  }

  return { matched: false };
}

export async function evaluateWithRuleEngine(budgetData: any) {
  // Ambil semua rules dari database
  const { data: rules, error } = await supabaseAdmin
    .from('rules')
    .select('*')
    .order('priority', { ascending: true });

  if (error || !rules) {
    console.error("Error fetching rules:", error);
    return { matched: false };
  }

  return evaluateRulesInMemory(budgetData, rules);
}
