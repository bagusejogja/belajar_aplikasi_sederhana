import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { evaluateWithRuleEngine } from '@/lib/ruleEngine';
import { analyzeBudgetWithAI } from '@/lib/aiReview';

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();
    if (!rawText) {
      return NextResponse.json({ success: false, error: 'Teks kosong' }, { status: 400 });
    }

    const lines = rawText.trim().split('\n');
    if (lines.length === 0) {
      return NextResponse.json({ success: false, error: 'Data tidak ditemukan' }, { status: 400 });
    }

    // Cek apakah baris pertama header
    let hasHeader = false;
    let headers: string[] = [];
    const firstLineCells = lines[0].split('\t').map((h: string) => h.trim().toLowerCase());
    
    if (firstLineCells.some((cell: string) => cell.includes('unit') || cell.includes('akun') || cell.includes('deskripsi') || cell.includes('total') || cell.includes('id') || cell.includes('tarif'))) {
      hasHeader = true;
      headers = firstLineCells;
    }

    const findIndex = (keywords: string[], defaultIdx: number) => {
      if (!hasHeader) return defaultIdx;
      const idx = headers.findIndex((h: string) => keywords.some((k: string) => h === k || h.includes(k)));
      return idx !== -1 ? idx : defaultIdx;
    };

    // Index pencocokan header persis tanpa false-positive 'usulan'
    const idDbIdx = findIndex(['id_angg', 'id_db', 'id db', 'id_database', 'no_id', 'id'], 0);
    const lingkupIdx = findIndex(['lingkup'], 1);
    const maksudIdx = findIndex(['maksud_tujuan', 'maksud', 'tujuan'], 2);
    const komponenIdx = findIndex(['komponen_nama', 'komponen'], 3);
    const deskripsiIdx = findIndex(['anggaran_deskripsi', 'deskripsi'], 5);
    const tarifIdx = findIndex(['tarif', 'harga_satuan', 'hargasatuan', 'harga'], 6);
    const volIdx = findIndex(['vol', 'volume', 'qty'], 7);
    const totalIdx = findIndex(['total', 'jumlah', 'nominal'], 8);
    const unitKerjaIdx = findIndex(['unitkerjanama', 'unitkerja_nama', 'unitkerja', 'unit_kerja', 'unit'], 9);
    const akunIdx = findIndex(['akun', 'kode_akun'], 10);

    const rawBudgets = [];
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const cells = lines[i].split('\t');
      
      const cleanNum = (val: string) => {
        if (!val) return 0;
        let s = val.trim().replace(/rp/gi, '').trim();
        if (s.includes(',')) {
          const parts = s.split(',');
          const intPart = parts[0].replace(/[^0-9-]/g, '');
          const decPart = parts[1] ? parts[1].replace(/[^0-9]/g, '') : '0';
          s = `${intPart}.${decPart}`;
        } else {
          s = s.replace(/[^0-9.-]/g, '');
          if ((s.match(/\./g) || []).length > 1) {
            s = s.replace(/\./g, '');
          }
        }
        const num = parseFloat(s);
        return isNaN(num) ? 0 : num;
      };

      const vol = cleanNum(cells[volIdx]) || 1;
      const tarif = cleanNum(cells[tarifIdx]) || 0;
      let total = cleanNum(cells[totalIdx]);
      if (total === 0 && tarif > 0) {
        total = vol * tarif;
      }

      const idDbVal = cells[idDbIdx]?.trim() || `ID-${Date.now()}-${i}`;

      rawBudgets.push({
        id_db: idDbVal,
        unitkerja_nama: cells[unitKerjaIdx]?.trim() || '-',
        akun: cells[akunIdx]?.trim() || '-',
        komponen_nama: cells[komponenIdx]?.trim() || '',
        deskripsi: cells[deskripsiIdx]?.trim() || '-',
        lingkup: cells[lingkupIdx]?.trim() || '',
        maksud_tujuan: cells[maksudIdx]?.trim() || '',
        vol: vol,
        tarif: tarif,
        total: total,
        kunci: 'N'
      });
    }

    if (rawBudgets.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada baris data valid untuk diimpor' }, { status: 400 });
    }

    // Deduplikasi berdasar id_db
    const budgetMap = new Map<string, any>();
    for (const b of rawBudgets) {
      budgetMap.set(b.id_db, b);
    }
    const budgetsToInsert = Array.from(budgetMap.values());

    // Upsert ke database Supabase
    const { data: insertedData, error } = await supabaseAdmin
      .from('budgets')
      .upsert(budgetsToInsert, { onConflict: 'id_db' })
      .select('*');

    if (error) {
      console.warn('Upsert warning:', error.message);
    }

    const itemsToProcess = insertedData && insertedData.length > 0 ? insertedData : budgetsToInsert;

    // Process rule & AI evaluation
    (async () => {
      for (const budget of itemsToProcess) {
        try {
          const ruleMatch = await evaluateWithRuleEngine(budget);
          let updatePayload: any = {};
          if (ruleMatch.matched) {
            updatePayload = {
              kunci: 'Y',
              kunci_by: 'RULE',
              custom_status: ruleMatch.custom_status || 'Wajib Ada',
              ai_reason: 'Match exact rule dari Master Aturan',
            };
          } else {
            const aiResult = await analyzeBudgetWithAI(budget);
            if (aiResult) {
              updatePayload = {
                kunci: 'N', // STATUS FINAL TETAP BEBAS (N) UNTUK DIKONFIRMASI MANUAL VIA BUTTON "SETUJUI AI"
                kunci_by: 'AI',
                custom_status: '', // Kosong agar Status Final Bebas
                ai_confidence: aiResult.confidence_score,
                ai_reason: aiResult.alasan,
              };
            }
          }
          if (budget.id && Object.keys(updatePayload).length > 0) {
            await supabaseAdmin.from('budgets').update(updatePayload).eq('id', budget.id);
          }
        } catch (e) {
          console.error('Error evaluating budget item:', e);
        }
      }
    })();

    return NextResponse.json({ 
      success: true, 
      count: budgetsToInsert.length 
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
