import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeBudgetWithAI(budgetData: any) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // 1. Try Gemini API if key exists
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      const prompt = `Kamu adalah sistem pakar Reviewer Anggaran (Budget Locking Engine).
Tugasmu adalah menganalisis baris usulan anggaran dan menentukan apakah item tersebut bersifat MANDATORY (Wajib Ada, Kunci = 'Y') atau DISCRETIONARY (Bisa Disesuaikan, Kunci = 'N').

Data Usulan:
Unit Kerja: ${budgetData.unitkerja_nama || '-'}
Akun: ${budgetData.akun || '-'}
Komponen: ${budgetData.komponen_nama || '-'}
Lingkup: ${budgetData.lingkup || '-'}
Maksud & Tujuan: ${budgetData.maksud_tujuan || '-'}
Deskripsi: ${budgetData.deskripsi || '-'}
Total: Rp ${budgetData.total || 0}

Aturan Penilaian:
1. Item kategori Kunci = 'Y': Beban operasional wajib/berulang yang mengikat secara kontrak atau hukum (contoh: Pajak, Retribusi, PBB, Langganan Software Utama seperti Google Workspace, Microsoft 365, Sewa Server/Cloud, Pemeliharaan Rutin).
2. Item kategori Kunci = 'N': Pembelian aset baru, peremajaan perangkat, pelatihan, atau kegiatan incidental yang bisa ditunda.

Berikan hasil dalam format JSON murni:
{
  "kunci_rekomendasi": "Y" atau "N",
  "confidence_score": 0.95,
  "alasan": "Penjelasan singkat 1 kalimat alasan rekomendasi"
}`;

      const res = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      const responseText = res.response.text();
      if (responseText) {
        return JSON.parse(responseText);
      }
    } catch (err) {
      console.error("Gemini AI review error, trying fallback:", err);
    }
  }

  // 2. Try OpenAI API via native fetch if key exists
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content: `Kamu adalah sistem pakar Reviewer Anggaran (Budget Locking Engine). Kembalikan JSON: {"kunci_rekomendasi": "Y"|"N", "confidence_score": 0.9, "alasan": "..."}`
            },
            {
              role: 'user',
              content: `Deskripsi: ${budgetData.deskripsi || ''}, Total: ${budgetData.total || 0}`
            }
          ]
        })
      });
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return JSON.parse(content);
    } catch (err) {
      console.error("OpenAI fetch error:", err);
    }
  }

  // 3. Smart Heuristic AI Fallback (Default when no API keys are present)
  const text = `${budgetData.deskripsi || ''} ${budgetData.komponen_nama || ''} ${budgetData.akun || ''}`.toLowerCase();
  const mandatoryKeywords = ['gaji', 'pajak', 'listrik', 'air', 'sewa server', 'cloud', 'internet', 'retribusi', 'pbb', 'software', 'lisensi', 'google workspace', 'microsoft 365', 'rutin', 'wajib'];
  
  const isMandatory = mandatoryKeywords.some(k => text.includes(k));
  
  return {
    kunci_rekomendasi: isMandatory ? 'Y' : 'N',
    confidence_score: isMandatory ? 0.88 : 0.65,
    alasan: isMandatory 
      ? 'Terdeteksi sebagai belanja operasional wajib/berulang yang mengikat operasional.' 
      : 'Diidentifikasi sebagai kebutuhan discretionary/pendukung yang dapat disesuaikan.'
  };
}
