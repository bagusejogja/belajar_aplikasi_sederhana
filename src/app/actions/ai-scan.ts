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

export async function generateRingkasanFromText(ocrText: string) {
  try {
    const prompt = `
      Anda adalah asisten administrasi di pemerintahan. Buatlah ringkasan substansi dari teks surat usulan anggaran berikut:
      
      === TEKS ===
      ${ocrText}
      === END TEKS ===

      Berikan ringkasan yang jelas, padat, dan langsung pada intinya terkait apa tujuan utama surat ini, rincian biaya yang diusulkan, dan mengapa ini penting.
      Format dalam tag HTML ringan seperti <p>, <ul>, <li>, <strong> tanpa backtick markdown. Jangan berikan teks pembuka atau penutup selain HTML tersebut.
    `;

    const request = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    let result;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      result = await model.generateContent(request);
    } catch (err) {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      result = await fallbackModel.generateContent(request);
    }
    
    let ringkasan = result.response.text().replace(/```html|```/g, "").trim();
    return { success: true, data: { ringkasan_html: ringkasan } };
  } catch (error: any) {
    console.error("Error AI Ringkasan from Text:", error);
    return { success: false, error: error.message };
  }
}

export async function generateAnalysisFromText(ocrText: string) {
  try {
    const prompt = `
      Anda adalah asisten analis keuangan. Berikan analisis teknis mengenai kewajaran dan kesesuaian usulan anggaran berikut berdasarkan data keuangan yang tersedia:
      
      === DATA & TEKS SURAT ===
      ${ocrText}
      === END DATA ===

      Berikan hasil analisis yang menyoroti:
      1. Apakah sisa pagu saat ini masih mencukupi untuk memenuhi usulan anggaran?
      2. Bagaimana rasio atau proporsi usulan tersebut dibandingkan dengan sisa pagu dan realisasi saat ini?
      3. Apakah ada hal yang perlu diklarifikasi lebih lanjut terkait kesesuaian usulan dengan sisa pagu atau ketersediaan dana?
      4. KESIMPULAN KELAYAKAN: Berdasarkan analisis di atas, sebutkan secara tegas apakah pengajuan tambahan pagu ini "LAYAK DISETUJUI" atau "TIDAK LAYAK DISETUJUI" beserta alasan kuat (keterangan) yang mendukungnya.
      
      ATURAN MUTLAK: HANYA gunakan data kuantitatif, pagu, dan angka yang TERSEDIA di dalam teks ini. JANGAN PERNAH mengarang, menambah-nambahkan, atau berimajinasi tentang data keuangan, persentase, sisa pagu, atau kebijakan lain yang tidak tertulis secara eksplisit dalam teks yang diberikan. Jangan memberikan "Instruksi dan Masukan Tindak Lanjut" seolah-olah Anda seorang atasan, melainkan berikan poin-poin "Hasil Analisis Data" yang objektif.
      
      Format dalam tag HTML ringan seperti <p>, <ol>, <ul>, <li>, <strong> tanpa backtick markdown. Jangan berikan teks pembuka atau penutup selain HTML tersebut.
    `;

    const request = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
    let result;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      result = await model.generateContent(request);
    } catch (err) {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      result = await fallbackModel.generateContent(request);
    }
    
    let rekomendasi = result.response.text().replace(/```html|```/g, "").trim();
    return { success: true, data: { rekomendasi_html: rekomendasi } };
  } catch (error: any) {
    console.error("Error AI Analysis from Text:", error);
    return { success: false, error: error.message };
  }
}

export async function convertSuratToTextWithAI(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const rawText = (formData.get('rawText') as string) || '';

    let promptContext = '';
    let inlineData = undefined;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const base64Data = Buffer.from(bytes).toString('base64');
      inlineData = { data: base64Data, mimeType: file.type || 'application/pdf' };
    } else if (rawText) {
      promptContext = `TEKS SURAT:\n${rawText}\n`;
    } else {
      throw new Error("File atau teks surat tidak ditemukan");
    }

    const prompt = `
      ${promptContext}
      Tugas Anda adalah membaca dokumen/teks surat resmi berikut dan mengekstrak rincian persuratan.
      
      Berikan hasil dalam format JSON murni (tanpa markdown, tanpa teks tambahan) dengan struktur:
      {
        "no_surat": "Nomor surat lengkap",
        "tanggal_surat": "Tanggal surat",
        "perihal": "Perihal surat",
        "yth": "Penerima/Tujuan surat (contoh: Yth. Wakil Rektor Bidang SDM dan Keuangan)",
        "unit_pengirim": "Nama unit pengirim surat",
        "teks_copas_standar": "Sesuai surat Nomor [no_surat] tanggal [tanggal_surat] perihal [perihal]"
      }

      PENTING untuk field "teks_copas_standar":
      Format harus persis seperti format rujukan berikut (menggunakan "Nomor" berhuruf N kapital, TANPA titik dua ":"):
      "Sesuai surat Nomor [no_surat] tanggal [tanggal_surat] perihal [perihal]"

      Contoh output teks_copas_standar yang BENAR:
      "Sesuai surat Nomor 2107/UN1/DPM/Dit-PKM/PM.00/2026 tanggal 30 Juni 2026 perihal Permohonan penambahan pagu anggaran DPKM UGM"

      Hanya berikan JSON saja.
    `;

    const requestContent: any = { role: "user", parts: [{ text: prompt }] };
    if (inlineData) requestContent.parts.push({ inlineData });

    const request = {
      contents: [requestContent],
      generationConfig: { responseMimeType: "application/json" }
    };
    
    let result;
    try {
       const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
       result = await model.generateContent(request);
    } catch (err) {
       const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
       result = await fallbackModel.generateContent(request);
    }

    const responseText = result.response.text();
    const jsonString = responseText.replace(/```json|```/g, "").trim();
    const extractedData = JSON.parse(jsonString);

    return { success: true, data: extractedData };
  } catch (error: any) {
    console.error("Error Convert Surat AI:", error);
    return { success: false, error: error.message };
  }
}

