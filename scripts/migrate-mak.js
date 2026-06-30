const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Manual env parsing since dotenv might not be installed globally
let envUrl = '';
let envKey = '';
try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const lines = envContent.split('\n');
  lines.forEach(l => {
    if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) envUrl = l.split('=')[1].replace(/['"]/g, '').trim();
    if (l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) envKey = l.split('=')[1].replace(/['"]/g, '').trim();
  });
} catch (e) {
  try {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const lines = envContent.split('\n');
    lines.forEach(l => {
      if (l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) envUrl = l.split('=')[1].replace(/['"]/g, '').trim();
      if (l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) envKey = l.split('=')[1].replace(/['"]/g, '').trim();
    });
  } catch (e2) {}
}

const SUPABASE_URL = envUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tkeswcrglwcrxflxkcrc.supabase.co';
const SUPABASE_ANON_KEY = envKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_n02D5Nio17suATl3JVxTdg_OsuJDUqI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseDate(dateStr) {
  if (!dateStr) return null;
  // Format: "25/08/2025 2.22.36 PM" or "25/08/2025"
  const parts = dateStr.trim().split(' ');
  if (parts.length === 0) return null;
  
  const dateParts = parts[0].split('/');
  if (dateParts.length !== 3) return new Date().toISOString();
  
  const day = dateParts[0];
  const month = dateParts[1];
  const year = dateParts[2];
  
  let hour = 0, minute = 0, second = 0;
  if (parts.length >= 2) {
    const timeParts = parts[1].split('.');
    hour = parseInt(timeParts[0]) || 0;
    minute = parseInt(timeParts[1]) || 0;
    second = parseInt(timeParts[2]) || 0;
    
    if (parts[2] === 'PM' && hour < 12) hour += 12;
    if (parts[2] === 'AM' && hour === 12) hour = 0;
  }
  
  const d = new Date(year, month - 1, day, hour, minute, second);
  return d.toISOString();
}

async function migrate() {
  if (!fs.existsSync('data_mak.tsv')) {
    console.error('File data_mak.tsv tidak ditemukan!');
    console.log('Silakan buat file "data_mak.tsv" dan paste data Excel Anda ke dalamnya, lalu jalankan script ini lagi.');
    process.exit(1);
  }

  const content = fs.readFileSync('data_mak.tsv', 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const headers = lines[0].split('\t');
  console.log('Total baris:', lines.length - 1);
  
  const payloads = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    
    const startTime = cols[1];
    const email = cols[3];
    const unit = cols[5];
    const excelUrl = cols[6];
    const catatanUrl = cols[7];
    const tahun = cols[8] || '2025'; 
    const sudahDiproses = cols[9];
    const pic = cols[10];
    
    let lampiran_catatan = [];
    if (catatanUrl && catatanUrl.trim() !== '') {
      let filename = 'catatan_verifikator';
      try {
        const urlObj = new URL(catatanUrl);
        const pathParts = urlObj.pathname.split('/');
        filename = decodeURIComponent(pathParts[pathParts.length - 1]);
      } catch (e) {}
      lampiran_catatan.push({ url: catatanUrl, name: filename });
    }
    
    const status = (sudahDiproses && sudahDiproses.trim() !== '') ? 'Selesai' : 'Proses Revisi';
    
    payloads.push({
      email: email,
      unit: unit,
      pic: pic || '-',
      tahun: tahun.trim(),
      status: status,
      kategori: 'Perubahan MAK',
      lampiran_excel: excelUrl,
      lampiran_catatan: lampiran_catatan,
      created_at: parseDate(startTime),
      updated_at: parseDate(sudahDiproses) || parseDate(cols[2]) || new Date().toISOString()
    });
  }
  
  console.log(`Siap memigrasikan ${payloads.length} data...`);
  
  for (let i = 0; i < payloads.length; i += 50) {
    const batch = payloads.slice(i, i + 50);
    const { data, error } = await supabase.from('mak_submissions').insert(batch);
    if (error) {
      console.error('Error saat insert batch:', error);
    } else {
      console.log(`Berhasil insert baris ${i + 1} sampai ${i + batch.length}`);
    }
  }
  
  console.log('Migrasi Selesai!');
}

migrate();
