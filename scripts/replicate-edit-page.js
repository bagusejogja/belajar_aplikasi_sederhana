const fs = require('fs');

const tambahPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/tambah/page.tsx';
const editPath = 'd:/BK/OneDrive - UGM 365/Desktop/verifikasi-online/src/app/(dashboard)/tambah-pagu/edit/[id]/page.tsx';

let content = fs.readFileSync(tambahPath, 'utf8');

// Normalize to LF
content = content.replace(/\r\n/g, '\n');

// 1. Rename Component Name and add useParams import
content = content.replace(
  "import { useRouter } from 'next/navigation';",
  "import { useRouter, useParams } from 'next/navigation';"
);

content = content.replace(
  "export default function TambahPaguPage() {",
  "export default function EditPaguPage() {\n  const params = useParams();"
);

// 2. Modify useEffect and fetchInitialData
const oldUseEffects = `  useEffect(() => {
    fetchUnits();
    fetchAnalisisAndUsed();
  }, []);

  useEffect(() => {
    if (formData.unit_id?.value) {
      fetchUnitPaguHistory(formData.unit_id.value);
      fetchRiwayatUnit(formData.unit_id.label);
    } else {
      setPaguUnitHistory([]);
      setRiwayatUsulanUnit([]);
    }
  }, [formData.unit_id]);

  const fetchUnits = async () => {
    const { data } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit', { ascending: true });
    if (data) {
      setListUnit(data.map(u => ({ value: u.id, label: u.nama_unit })));
    }
    setIsLoading(false);
  };`;

const newUseEffects = `  useEffect(() => {
    fetchInitialData();
  }, [params.id]);

  useEffect(() => {
    if (formData.unit_id?.value) {
      fetchUnitPaguHistory(formData.unit_id.value);
      fetchRiwayatUnit(formData.unit_id.label);
    } else {
      setPaguUnitHistory([]);
      setRiwayatUsulanUnit([]);
    }
  }, [formData.unit_id]);

  const fetchInitialData = async () => {
    try {
      const { data: units } = await supabase.from('gov_units').select('id, nama_unit').order('nama_unit', { ascending: true });
      const unitOptions = units?.map(u => ({ value: u.id, label: u.nama_unit })) || [];
      setListUnit(unitOptions);

      // Fetch used
      const { data: used } = await supabase.from('tambah_pagu').select('no_surat_pengajuan');
      const usedNoSurat = new Set(used?.map(u => u.no_surat_pengajuan).filter(Boolean) || []);

      // Fetch analisis list
      const { data: allAnalisis } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, unit_pengirim, perihal, total_anggaran, nominal_disetujui, keputusan, created_at')
        .order('created_at', { ascending: false });

      if (allAnalisis) {
        setListAnalisis(allAnalisis.map((item: any) => ({
          ...item,
          is_used: usedNoSurat.has(item.no_surat)
        })));
      }

      // Fetch edit record
      const { data: pagu, error } = await supabase
        .from('tambah_pagu')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      if (pagu) {
        setFormData({
          ...pagu,
          unit_id: unitOptions.find(u => u.value === pagu.unit_id) || null,
        });
        
        // Also look up if this record is matching any of the analisis list to restore selection
        if (pagu.no_surat_pengajuan && allAnalisis) {
          const matchedAnalisis = allAnalisis.find(a => a.no_surat === pagu.no_surat_pengajuan);
          if (matchedAnalisis) {
            setSelectedAnalisis(matchedAnalisis);
          }
        }
      }
    } catch (e: any) {
      alert("Gagal load data usulan: " + e.message);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };`;

content = content.replace(oldUseEffects, newUseEffects);

// 3. Remove fetchAnalisisAndUsed function
content = content.replace(`  const fetchAnalisisAndUsed = async () => {
    try {
      const { data: used } = await supabase.from('tambah_pagu').select('no_surat_pengajuan');
      const usedNoSurat = new Set(used?.map(u => u.no_surat_pengajuan).filter(Boolean) || []);

      const { data: allAnalisis, error } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, unit_pengirim, perihal, total_anggaran, nominal_disetujui, keputusan, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (allAnalisis) {
        setListAnalisis(allAnalisis.map((item: any) => ({
          ...item,
          is_used: usedNoSurat.has(item.no_surat)
        })));
      }
    } catch (e) {
      console.error("Gagal load data analisis:", e);
    }
    setLoadingAnalisis(false);
  };`, '');

// 4. Update currentLink getters to support existing record R2 links
content = content.replace(
  "const currentPengajuanLink = formData.link_surat_pengajuan || selectedAnalisis?.link_lampiran || '';",
  "const currentPengajuanLink = formData.link_surat_pengajuan || (formData.file_surat_pengajuan && formData.file_surat_pengajuan.startsWith('http') ? formData.file_surat_pengajuan : '') || selectedAnalisis?.link_lampiran || '';"
);

content = content.replace(
  "const currentTanggapanLink = formData.link_surat_tanggapan || '';",
  "const currentTanggapanLink = formData.link_surat_tanggapan || (formData.file_surat_tanggapan && formData.file_surat_tanggapan.startsWith('http') ? formData.file_surat_tanggapan : '') || '';"
);

// 5. Update handleSubmit to call Edit API
const oldSubmitBlock = `      const response = await fetch('/api/tambah-pagu/tambah', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      if (result.success) {
        alert("Usulan Pagu Berhasil Ditambahkan!");
        router.push('/tambah-pagu');
      } else {
        throw new Error(result.error || "Gagal menyimpan usulan.");
      }`;

const newSubmitBlock = `      // Append ID for Edit API
      data.append('id', params.id as string);

      const response = await fetch('/api/tambah-pagu/edit', {
        method: 'POST',
        body: data,
      });

      const result = await response.json();
      if (result.success) {
        alert("Perubahan Berhasil Disimpan!");
        router.push('/tambah-pagu');
      } else {
        throw new Error(result.error || "Gagal menyimpan perubahan.");
      }`;

content = content.replace(oldSubmitBlock, newSubmitBlock);

// 6. Update titles and metadata
content = content.replace(
  '<div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-1">\n            <Sparkles size={14} /> New Entry\n          </div>\n          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tambah Usulan Pagu</h1>',
  '<div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">\n            <Sparkles size={14} /> Update Entry\n          </div>\n          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Edit Usulan Pagu</h1>'
);

content = content.replace(
  'Informasi usulan baru dan lampiran surat pengajuan dari unit kerja.',
  'Perbarui data usulan atau status persetujuan pagu.'
);

// Normalize back to CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync(editPath, content);
console.log('Replicated tambah/page.tsx into edit/[id]/page.tsx successfully.');
