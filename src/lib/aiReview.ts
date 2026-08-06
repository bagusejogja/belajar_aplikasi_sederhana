import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function analyzeBudgetWithAI(budgetData: any) {
  const systemPrompt = `Kamu adalah sistem pakar Reviewer Anggaran (Budget Locking Engine).
Tugasmu adalah menganalisis baris usulan anggaran dan menentukan apakah item tersebut bersifat MANDATORY (Wajib Ada, Kunci = 'Y') atau DISCRETIONARY (Bisa Disesuaikan, Kunci = 'N').

Aturan Penilaian:
1. Item kategori Kunci = 'Y':
   - Beban operasional wajib/berulang yang mengikat secara kontrak atau hukum (contoh: Pajak, Retribusi, PBB, Langganan Software Utama seperti Google Workspace, Microsoft 365, Sewa Server/Cloud).
   - Pemeliharaan rutin gedung/infrastruktur vital jika disebutkan dalam komitmen operasional.
2. Item kategori Kunci = 'N':
   - Pembelian aset baru, peremajaan perangkat, pelatihan, atau kegiatan incidental yang bisa ditunda jika pagu dikurangi.

Kembalikan output WAJIB dalam format JSON murni tanpa markdown block:
{
  "kunci_rekomendasi": "Y" | "N",
  "confidence_score": 0.00 - 1.00,
  "alasan": "Penjelasan singkat 1 kalimat alasan rekomendasi"
}`;

  const userPrompt = `        Anda adalah asisten AI penelaah anggaran (Smart Budget Reviewer).
        Tugas Anda adalah membaca data usulan anggaran berikut dan menentukan apakah anggaran ini merupakan kebutuhan 'Wajib' (Y) atau 'Opsional/Discretionary' (N).

        Data Usulan:
        Unit Kerja: ${budgetData.unitkerja_nama}
        Akun: ${budgetData.akun}
        Komponen: ${budgetData.komponen_nama}
        Lingkup: ${budgetData.lingkup || '-'}
        Maksud & Tujuan: ${budgetData.maksud_tujuan || '-'}
        Deskripsi: ${budgetData.deskripsi}
        Total: Rp ${budgetData.total}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content received from OpenAI");
    
    return JSON.parse(content);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}
