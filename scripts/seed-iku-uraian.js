const fs = require('fs');
const path = require('path');

const data = require('../src/data/iku-data.json');
const masters = data.masterReferences || [];

// Filter master 2026 dan yang memiliki uraian/nama referensi
const lines = [
  '-- ==============================================================================;',
  '-- SEED DATA MASTER REFERENSI & URAIAN IKU KE TABEL app_iku_uraian',
  '-- Jalankan di SQL Editor Supabase agar tabel app_iku_uraian langsung terisi',
  '-- ==============================================================================;',
  ''
];

masters.forEach(m => {
  const name = String(m.nama_ref_iku || '').trim().replace(/'/g, "''");
  const uraian = String(m.uraian || '').trim().replace(/'/g, "''");
  if (!name) return;
  lines.push(
    `INSERT INTO public.app_iku_uraian (ref_iku, uraian, updated_by) ` +
    `VALUES ('${name}', '${uraian}', 'Master Bawaan ${m.ref_tahun_iku || 2026}') ` +
    `ON CONFLICT (ref_iku) DO UPDATE SET uraian = EXCLUDED.uraian;`
  );
});

fs.writeFileSync(path.join(__dirname, '../supabase_seed_iku_uraian.sql'), lines.join('\n'), 'utf-8');
console.log('Successfully generated supabase_seed_iku_uraian.sql with', masters.length, 'records.');
