'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function scanSuratWithAI(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error("File tidak ditemukan");

    // 1. Konversi file ke Buffer & Base64
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString('base64');

    // 2. Inisialisasi Model Gemini Flash (Versi Paling Stabil)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Siapkan Prompt yang Sangat Spesifik
    const prompt = `
      Tugas Anda adalah mengekstrak informasi dari gambar/PDF surat resmi pemerintah Indonesia berikut.
      Berikan hasil dalam format JSON murni (tanpa markdown, tanpa teks tambahan) dengan kunci berikut:
      {
        "no_surat": "Isi dengan nomor surat lengkap",
        "tanggal_surat": "Isi dengan tanggal surat (Ubah tanggal format Indonesia seperti '1 Januari 2026' menjadi format YYYY-MM-DD. WAJIB YYYY-MM-DD)",
        "perihal_surat": "Isi dengan perihal/hal surat secara lengkap",
        "unit_kerja": "Isi dengan nama instansi/unit pengirim surat",
        "nominal_usulan": "Isi dengan total nominal usulan anggaran/tambahan pagu yang diminta (hanya angka)"
      }
      
      Jika ada informasi yang tidak ditemukan, kosongkan nilainya.
      PENTING: Hanya berikan JSON saja.
    `;

    // 4. Kirim ke Gemini dengan mode JSON (dengan fallback jika 503)
    const request = {
      contents: [{ role: "user", parts: [ { text: prompt }, { inlineData: { data: base64Data, mimeType: file.type } } ] }],
      generationConfig: { responseMimeType: "application/json" }
    };
    
    let result;
    try {
       const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
       result = await model.generateContent(request);
    } catch (err) {
       console.log('Gemini 2.5 Flash error, fallback to gemini-2.0-flash', err);
       const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
       result = await fallbackModel.generateContent(request);
    }

    const responseText = result.response.text();
    
    // 5. Bersihkan hasil (kadang AI memberikan markdown block)
    const jsonString = responseText.replace(/```json|```/g, "").trim();
    const extractedData = JSON.parse(jsonString);

    return { success: true, data: extractedData };

  } catch (error: any) {
    console.error("Error AI Scan:", error);
    return { success: false, error: error.message };
  }
}

export async function summarizeSubstanceWithAI(fileUrl: string) {
  try {
    // 1. Ambil file dari URL (R2/Public)
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Gagal mengunduh file untuk dianalisis");
    
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'application/pdf';

    // 2. Inisialisasi Model
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 3. Prompt untuk Ringkasan Substansi
    const prompt = `
      Anda adalah asisten ahli keuangan pemerintah. Analisis dokumen usulan anggaran berikut.
      Berikan ringkasan substansi dalam MAKSIMAL 2 kalimat yang menjelaskan:
      - Apa yang diusulkan?
      - Mengapa usulan ini penting/mendesak?
      
      Gunakan bahasa yang formal, padat, dan profesional.
      LANGSUNG berikan ringkasannya saja tanpa kata pengantar.
    `;

    // 4. Kirim ke Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    return { success: true, summary: result.response.text().trim() };

  } catch (error: any) {
    console.error("Error AI Summary:", error);
    return { success: false, error: error.message };
  }
}

export async function listAvailableModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    return { success: true, models: data.models?.map((m: any) => m.name) || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateAnalysisFromText(ocrText: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Anda adalah asisten ahli keuangan pemerintah. Analisis hasil ekstraksi teks dari usulan anggaran berikut:
      
      === TEKS ===
      ${ocrText}
      === END TEKS ===

      Berikan hasil analisis yang sangat tajam, analitis, dan bergaya bahasa birokrasi pemerintahan formal dalam format JSON murni dengan kunci:
      {
        "ringkasan_html": "Berikan ringkasan substansi dari surat ini (Apa tujuan utama, rincian biaya yang diusulkan, dan mengapa ini penting). Gunakan kalimat formal dan padat. Format dalam HTML ringan (misal <p>...</p>).",
        "rekomendasi_html": "Berikan evaluasi kritis tentang kelayakan usulan ini. Pertimbangkan aspek efisiensi anggaran, urgensi, dan berikan rekomendasi final yang tegas. Format HTML ringan."
      }

      PENTING: Hanya kembalikan JSON murni. Jangan tambah markdown blok \`\`\`json.
    `;

    const request = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    };

    let result;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      result = await model.generateContent(request);
    } catch (err) {
      console.log('Gemini 2.5 Flash error, fallback to gemini-2.0-flash', err);
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      result = await fallbackModel.generateContent(request);
    }
    
    const responseText = result.response.text();
    let extractedData: any = {};
    
    try {
       const jsonString = responseText.replace(/```json|```/g, "").trim();
       extractedData = JSON.parse(jsonString);
    } catch (parseError) {
       console.log("JSON parse failed, returning raw text...", parseError);
       let cleanText = responseText.replace(/```json|```/g, "").replace(/[{}]/g, "").trim();
       
       const extractVal = (key: string, text: string) => {
          const regex = new RegExp(`"${key}"\\s*:\\s*"(.*?)"(?:,|\\n|$)`, 'is');
          const match = text.match(regex);
          return match ? match[1].replace(/\\"/g, '"').replace(/\\n/g, '<br/>') : '';
       };
       
       extractedData = {
          ringkasan_html: extractVal('ringkasan_html', responseText) || "<p><b>Error Parsing JSON. Output Mentah:</b></p><br/>" + cleanText,
          rekomendasi_html: extractVal('rekomendasi_html', responseText) || ""
       };
    }

    return { success: true, data: extractedData };
  } catch (error: any) {
    console.error("Error AI Analysis from Text:", error);
    return { success: false, error: error.message };
  }
}

