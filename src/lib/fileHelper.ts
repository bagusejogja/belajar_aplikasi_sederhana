/**
 * Helper terpadu untuk memastikan seluruh file/lampiran dapat dibuka & diunduh
 * dengan aman di segala jaringan ISP (Indihome, Telkomsel, FirstMedia, dll.)
 * tanpa terkena blokir DNS pada domain Cloudflare R2 (*.r2.dev).
 */
export function getSafeFileUrl(url?: string | null, filename?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // 1. Google Drive link (ubah ke thumbnail jika cocok untuk preview)
  const gdriveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1] && !trimmed.includes('export=download')) {
    // Jika tidak diminta download file spesifik, bisa direct thumbnail
    // Namun untuk file umum tetap izinkan link aslinya jika bukan R2
  }

  // 2. Bypass blokir ISP Indonesia pada Cloudflare R2 (*.r2.dev & r2.cloudflarestorage.com)
  if (
    trimmed.includes('.r2.dev') || 
    trimmed.includes('r2.cloudflarestorage.com') ||
    trimmed.includes('lampiran-aplikasi')
  ) {
    const fnParam = filename ? `&filename=${encodeURIComponent(filename)}` : '';
    return `/api/image-cors?url=${encodeURIComponent(trimmed)}${fnParam}`;
  }

  return trimmed;
}

/**
 * Helper untuk unduhan langsung dengan nama file yang rapi
 */
export function getDownloadSafeFileUrl(url?: string | null, filename?: string): string {
  if (!url) return '';
  const safe = getSafeFileUrl(url, filename);
  if (safe.startsWith('/api/image-cors')) {
    return `${safe}&download=true`;
  }
  return safe;
}
