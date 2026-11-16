import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const MAX_FILE_BYTES = 4 * 1024 * 1024; // batas aman body serverless (4.5MB)
const MAX_MATERI_CHARS = 40000;

async function callGemini(parts: any[], jsonMode = true): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY belum dikonfigurasi di server.');
  const genAI = new GoogleGenerativeAI(key);
  let lastErr: any = null;
  for (const name of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const res = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.4,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      });
      const text = res.response.text();
      if (text) return text;
    } catch (e) {
      lastErr = e;
      console.error(`[latihan-soal] model ${name} gagal:`, e);
    }
  }
  throw new Error(lastErr?.message || 'AI tidak memberikan respons.');
}

function parseJson(text: string): any {
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.search(/[\[{]/);
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('Format jawaban AI tidak valid, silakan coba lagi.');
  }
}

const ANALYZE_PROMPT = `Kamu adalah guru yang membantu siswa berlatih. Baca seluruh isi dokumen/materi/gambar yang diberikan (bahasa Indonesia atau lainnya).
Kembalikan JSON murni dengan struktur:
{
  "judul": "judul singkat materi",
  "mapel": "mata pelajaran / bidang (tebakan terbaik)",
  "topik": ["topik utama 1", "topik utama 2"],
  "ringkasan": "ringkasan materi 3-6 kalimat",
  "materi_teks": "TRANSKRIP LENGKAP dan rapi seluruh isi materi/soal (rumus ditulis dalam teks biasa), maksimal 30000 karakter",
  "soal_terdeteksi": [
    { "nomor": 1, "soal": "teks lengkap soal beserta pilihan jawaban bila ada" }
  ]
}
Aturan: "soal_terdeteksi" hanya berisi soal yang MEMANG tertulis di dokumen (kosongkan [] bila dokumen hanya materi bacaan). Jangan mengarang soal di bagian ini.`;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // ============ ANALISIS FILE / TEKS ============
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file') as File | null;
      const pastedText = String(form.get('text') || '').trim();

      const parts: any[] = [{ text: ANALYZE_PROMPT }];

      if (file && file.size > 0) {
        if (file.size > MAX_FILE_BYTES) {
          return NextResponse.json({ error: 'Ukuran file maksimal 4 MB. Silakan kompres atau pecah filenya.' }, { status: 413 });
        }
        const buf = Buffer.from(await file.arrayBuffer());
        const name = (file.name || '').toLowerCase();
        const mime = file.type || '';

        if (mime === 'application/pdf' || name.endsWith('.pdf') || mime.startsWith('image/') || /\.(png|jpe?g|webp|heic|heif)$/.test(name)) {
          let mimeType = mime;
          if (!mimeType) {
            if (name.endsWith('.pdf')) mimeType = 'application/pdf';
            else if (name.endsWith('.png')) mimeType = 'image/png';
            else if (name.endsWith('.webp')) mimeType = 'image/webp';
            else mimeType = 'image/jpeg';
          }
          parts.push({ inlineData: { mimeType, data: buf.toString('base64') } });
        } else if (name.endsWith('.docx') || mime.includes('wordprocessingml')) {
          const { value } = await mammoth.extractRawText({ buffer: buf });
          if (!value.trim()) return NextResponse.json({ error: 'Isi dokumen Word kosong / tidak terbaca.' }, { status: 422 });
          parts.push({ text: `ISI DOKUMEN:\n${value.slice(0, MAX_MATERI_CHARS)}` });
        } else if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv') || mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') {
          const wb = XLSX.read(buf, { type: 'buffer' });
          const txt = wb.SheetNames.map(sn => `# Sheet: ${sn}\n${XLSX.utils.sheet_to_csv(wb.Sheets[sn])}`).join('\n\n');
          parts.push({ text: `ISI SPREADSHEET:\n${txt.slice(0, MAX_MATERI_CHARS)}` });
        } else if (name.endsWith('.txt') || name.endsWith('.md') || mime.startsWith('text/')) {
          parts.push({ text: `ISI DOKUMEN:\n${buf.toString('utf-8').slice(0, MAX_MATERI_CHARS)}` });
        } else if (name.endsWith('.doc')) {
          return NextResponse.json({ error: 'Format .doc lama belum didukung. Simpan ulang sebagai .docx atau PDF.' }, { status: 415 });
        } else {
          return NextResponse.json({ error: 'Format file tidak didukung. Gunakan PDF, Word (.docx), Excel, TXT, atau gambar (JPG/PNG).' }, { status: 415 });
        }
      } else if (pastedText) {
        parts.push({ text: `ISI MATERI/SOAL:\n${pastedText.slice(0, MAX_MATERI_CHARS)}` });
      } else {
        return NextResponse.json({ error: 'Pilih file atau tempel teks materi terlebih dahulu.' }, { status: 400 });
      }

      const data = parseJson(await callGemini(parts));
      return NextResponse.json({
        judul: data.judul || 'Materi Tanpa Judul',
        mapel: data.mapel || '-',
        topik: Array.isArray(data.topik) ? data.topik : [],
        ringkasan: data.ringkasan || '',
        materi_teks: String(data.materi_teks || pastedText || '').slice(0, MAX_MATERI_CHARS),
        soal_terdeteksi: Array.isArray(data.soal_terdeteksi) ? data.soal_terdeteksi : [],
      });
    }

    // ============ AKSI JSON ============
    const body = await req.json();
    const { action } = body;

    if (action === 'solve') {
      const soal = String(body.soal || '').trim();
      if (!soal) return NextResponse.json({ error: 'Soal kosong.' }, { status: 400 });
      const konteks = String(body.materi_teks || '').slice(0, 8000);
      const prompt = `Kamu adalah guru privat yang sabar. Selesaikan soal berikut untuk siswa.
${konteks ? `KONTEKS MATERI (opsional):\n${konteks}\n` : ''}
SOAL:
${soal}

Kembalikan JSON murni:
{
  "penjelasan": "penjelasan konsep inti yang diperlukan, ringkas dan mudah dipahami",
  "cara_pengerjaan": [
    { "nama": "Cara 1: nama metode", "langkah": ["langkah 1", "langkah 2"], "hasil": "hasil akhir cara ini" },
    { "nama": "Cara 2: metode alternatif (jika ada; minimal sertakan 2 cara bila memungkinkan)", "langkah": ["..."], "hasil": "..." }
  ],
  "jawaban": "jawaban akhir yang jelas",
  "tips": "tips agar tidak salah / kesalahan umum"
}
Gunakan teks biasa untuk rumus (contoh: x^2, a/b). Pastikan perhitungan benar dan konsisten antar cara.`;
      const data = parseJson(await callGemini([{ text: prompt }]));
      return NextResponse.json(data);
    }

    if (action === 'generate') {
      const materi = String(body.materi_teks || '').trim();
      if (!materi) return NextResponse.json({ error: 'Materi kosong. Unggah materi terlebih dahulu.' }, { status: 400 });
      const jumlah = Math.min(Math.max(parseInt(body.jumlah) || 10, 3), 30);
      const tingkat = String(body.tingkat || 'campuran');
      const komposisi = body.komposisi || { pg: 6, bs: 2, isian: 2 };
      const fokus = String(body.fokus || '').trim();

      const prompt = `Kamu adalah guru pembuat soal latihan. Buat ${jumlah} soal latihan BARU yang sesuai dengan pokok bahasan materi di bawah (jangan menyalin soal asli persis; buat variasi angka/kasus bila perlu).
Tingkat kesulitan: ${tingkat}.
Komposisi tipe soal (kira-kira, total harus ${jumlah}): pilihan ganda = ${komposisi.pg}, benar/salah = ${komposisi.bs}, isian singkat = ${komposisi.isian}.
${fokus ? `Fokus tambahan dari siswa: ${fokus}\n` : ''}
MATERI:
${materi.slice(0, MAX_MATERI_CHARS)}

Kembalikan JSON murni berupa objek:
{ "soal": [
  {
    "tipe": "pg" | "bs" | "isian",
    "pertanyaan": "teks soal",
    "pilihan": ["A teks", "B teks", "C teks", "D teks"],   // hanya untuk tipe pg, 4 pilihan tanpa awalan huruf
    "jawaban": "untuk pg: index pilihan benar sebagai angka string '0'-'3'; untuk bs: 'benar' atau 'salah'; untuk isian: jawaban singkat",
    "jawaban_alternatif": ["varian penulisan jawaban lain yang juga benar (hanya untuk isian)"],
    "pembahasan": "penjelasan singkat mengapa jawaban benar, termasuk langkah hitung bila ada",
    "topik": "subtopik soal"
  }
] }
Pastikan kunci jawaban 100% benar dan hanya ada satu jawaban benar untuk pilihan ganda.`;
      const data = parseJson(await callGemini([{ text: prompt }]));
      const list = Array.isArray(data) ? data : data.soal;
      if (!Array.isArray(list) || list.length === 0) {
        return NextResponse.json({ error: 'AI belum berhasil membuat soal. Coba lagi.' }, { status: 502 });
      }
      const cleaned = list
        .filter((q: any) => q && q.pertanyaan && q.jawaban !== undefined)
        .map((q: any, i: number) => ({
          id: `q${i + 1}`,
          tipe: ['pg', 'bs', 'isian'].includes(q.tipe) ? q.tipe : 'isian',
          pertanyaan: String(q.pertanyaan),
          pilihan: Array.isArray(q.pilihan) ? q.pilihan.map(String) : [],
          jawaban: String(q.jawaban),
          jawaban_alternatif: Array.isArray(q.jawaban_alternatif) ? q.jawaban_alternatif.map(String) : [],
          pembahasan: String(q.pembahasan || ''),
          topik: String(q.topik || ''),
        }));
      return NextResponse.json({ soal: cleaned });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: any) {
    console.error('[latihan-soal] error:', err);
    return NextResponse.json({ error: err?.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
