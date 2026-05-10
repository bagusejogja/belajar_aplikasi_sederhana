import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Baca .env.local secara manual untuk menghindari error modul
const envContent = fs.readFileSync(".env.local", "utf8");
const process_env: Record<string, string> = {};
envContent.split("\n").forEach(line => {
  const [key, ...value] = line.split("=");
  if (key && value) process_env[key.trim()] = value.join("=").trim().replace(/^"|"$/g, '');
});

const supabaseUrl = process_env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process_env.SUPABASE_SERVICE_ROLE_KEY || process_env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process_env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process_env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process_env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process_env.R2_BUCKET_NAME!;
const PUBLIC_URL = "https://pub-75569bb9cb0a485b933e7b4f4c7f4080.r2.dev";
const LOCAL_FOLDER = "D:\\BK\\OneDrive - UGM 365\\Desktop\\arsip_surat_revisi";

async function migrate() {
  console.log("🚀 Memulai migrasi file ke Cloudflare R2...");

  if (!fs.existsSync(LOCAL_FOLDER)) {
    console.error("❌ Folder lokal tidak ditemukan:", LOCAL_FOLDER);
    return;
  }

  const files = fs.readdirSync(LOCAL_FOLDER);
  console.log(`📂 Ditemukan ${files.length} file di folder lokal.`);

  for (const filename of files) {
    const filePath = path.join(LOCAL_FOLDER, filename);
    
    // Skip jika bukan file (misal folder)
    if (!fs.statSync(filePath).isFile()) continue;

    try {
      console.log(`\n--- Memproses: ${filename} ---`);

      // 1. Upload ke R2
      const fileBuffer = fs.readFileSync(filePath);
      const r2Key = `surat/${filename}`;
      
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: getContentType(filename),
      }));

      const r2Url = `${PUBLIC_URL}/${r2Key}`;
      console.log(`✅ Berhasil upload ke R2: ${r2Url}`);

      // 2. Update Database Supabase
      // Kita cari baris yang kolom file_upload-nya cocok dengan nama file ini
      const { data, error } = await supabase
        .from('surat_revisi')
        .update({ file_upload: r2Url })
        .eq('file_upload', filename); // Mencocokkan nama file mentah di DB

      if (error) {
        console.error(`❌ Gagal update DB untuk ${filename}:`, error.message);
      } else {
        console.log(`✨ Database diperbarui untuk ${filename}`);
      }

    } catch (err: any) {
      console.error(`💥 Error saat memproses ${filename}:`, err.message);
    }
  }

  console.log("\n✅ Migrasi Selesai!");
}

function getContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

migrate();
