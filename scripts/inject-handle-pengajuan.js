const fs = require('fs');
const path = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';

let content = fs.readFileSync(path, 'utf8');

const uploadFunc = `
  const handlePengajuanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilePengajuan(file);

    setIsScanningPengajuan(true);
    try {
      const scanFormData = new FormData();
      scanFormData.append('file', file);
      const res = await scanSuratWithAI(scanFormData);
      if (res.success && res.data) {
        setFormData(prev => ({
          ...prev,
          no_surat_pengajuan: res.data.no_surat || prev.no_surat_pengajuan,
          tanggal_surat_pengajuan: res.data.tanggal_surat || prev.tanggal_surat_pengajuan,
          hal_surat_pengajuan: res.data.perihal_surat || prev.hal_surat_pengajuan,
          nominal_diajukan: res.data.nominal_usulan || prev.nominal_diajukan
        }));
        alert('Ekstraksi AI Berhasil! Metadata surat pengajuan telah terisi otomatis.');
      } else {
        alert('Gagal mengekstrak metadata dari surat pengajuan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat memindai surat pengajuan.');
    } finally {
      setIsScanningPengajuan(false);
    }
  };
`;

const handleTanggapanStart = content.indexOf("const handleAutoExtractTanggapanAI = async () => {");
if (handleTanggapanStart !== -1) {
  content = content.slice(0, handleTanggapanStart) + uploadFunc + content.slice(handleTanggapanStart);
}

fs.writeFileSync(path, content);
console.log('Injected handlePengajuanUpload');
