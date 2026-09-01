require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function parsePhpFormula(str) {
  if (!str || typeof str !== 'string') return null;
  try {
    const resMatch = str.match(/"hasil";a:2:\{([^}]+)\}/);
    let totalQty = '';
    let totalUnit = '';
    if (resMatch) {
      const regex = /i:(\d+);s:\d+:"([^"]*)"/g;
      let m;
      while ((m = regex.exec(resMatch[1])) !== null) {
        if (m[1] === '0') totalQty = m[2];
        if (m[1] === '1') totalUnit = m[2];
      }
    }
    return { totalQty, totalUnit };
  } catch (e) {
    return null;
  }
}

async function fetchAllBudgets() {
  let all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

async function updateBudgetsData() {
  console.log('Fetching all budgets from Supabase...');
  const budgets = await fetchAllBudgets();
  console.log(`Fetched ${budgets.length} budgets.`);

  let updatedCount = 0;
  let nulledAiReasonCount = 0;
  const updates = [];

  for (const b of budgets) {
    const usulanNominal = Number(b.total) || 0;
    let volAppr = Number(b.vol) || 0;
    let tarifAppr = Number(b.tarif) || 0;
    let totalAppr = usulanNominal;
    let penyesuaian = 0;

    if (b.approval_pagu_indikatif_anggaran_rumus) {
      const parsedAppr = parsePhpFormula(b.approval_pagu_indikatif_anggaran_rumus);
      if (parsedAppr) {
        const qtyAppr = parseFloat(parsedAppr.totalQty) || 0;
        const usulanFormula = parsePhpFormula(b.usulan_pagu_indikatif_anggaran_rumus);
        const usulanQty = usulanFormula ? parseFloat(usulanFormula.totalQty) || Number(b.vol) || 1 : Number(b.vol) || 1;
        const usulanTarif = (Number(b.total) > 0 && usulanQty > 0) ? (Number(b.total) / usulanQty) : (Number(b.tarif) || 0);
        tarifAppr = Number(b.tarif) || usulanTarif;
        volAppr = qtyAppr;
        totalAppr = qtyAppr * tarifAppr;
        penyesuaian = totalAppr - usulanNominal;
      }
    }

    let aiReason = b.ai_reason;
    if (aiReason && typeof aiReason === 'string' && aiReason.includes('Match exact rule dari Master Aturan')) {
      aiReason = null;
      nulledAiReasonCount++;
    }

    updates.push({
      ...b,
      tarif_approved: tarifAppr,
      volumen_approved: volAppr,
      total_approve: totalAppr,
      nominal_penyesuaian: penyesuaian,
      ai_reason: aiReason
    });
  }

  console.log(`Calculated updates for ${updates.length} rows.`);
  console.log(`Total ai_reason to be nulled: ${nulledAiReasonCount}`);
  console.log('Sample calculated row 0:', updates[0]);
  console.log('Sample calculated row with approval:', updates.find(u => u.nominal_penyesuaian !== 0));

  // Perform updates in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    // Try upserting or updating
    const { error } = await supabase.from('budgets').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error updating chunk ${i}-${i + chunkSize}:`, error.message);
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n>>> PENTING: Kolom belum dibuat di Supabase SQL Editor. Silakan jalankan query di supabase_add_approved_columns.sql terlebih dahulu! <<<');
        return;
      }
    } else {
      updatedCount += chunk.length;
      process.stdout.write(`\rUpdated ${updatedCount}/${updates.length} rows...`);
    }
  }
  console.log(`\nSuccessfully updated ${updatedCount} rows in budgets table!`);
}

updateBudgetsData();
