'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, Edit2, Edit3, Trash2, Folder, FileText, Upload, 
  Link as LinkIcon, Loader2, Save, X, ChevronDown, ChevronUp, ChevronRight, File, 
  Archive, Settings, Globe, FileSpreadsheet, Image as ImageIcon, ExternalLink,
  Layers, Calendar, FolderOpen, Table, Sparkles, CloudUpload, Check, CheckCircle2,
  AlertCircle, ArrowRight, Tag, Paperclip, FileUp, Info, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import Link from 'next/link';
import ArsipPublicView from '@/components/arsip/ArsipPublicView';

export default function ArsipKegiatanPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // View States: Default to 'list' (Daftar Folder) and all closed (empty array)
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');
  const [expandedCats, setExpandedCats] = useState<number[]>([]);
  const [expandedYears, setExpandedYears] = useState<string[]>([]);
  const [isPublicMode, setIsPublicMode] = useState(false);

  // Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ 
    id: null as any, 
    nama_kegiatan: '', 
    deskripsi: '', 
    template_fase: [{ nama_fase: '', catatan_global: '', _old_nama: '' }] as any[] 
  });

  const [isArcModalOpen, setIsArcModalOpen] = useState(false);
  const [arcForm, setArcForm] = useState({ 
    id: null as any, 
    kategori_id: null as any, 
    tahun: new Date().getFullYear(), 
    catatan: '', 
    fase_dokumen: [] as any[] 
  });

  const [uploadingPhase, setUploadingPhase] = useState<string | null>(null);

  // Modern Input Modals (Menggantikan window.prompt & native browser dialogs)
  const [linkModal, setLinkModal] = useState<{
    isOpen: boolean;
    arcId: number | null;
    phaseIdx: number | null;
    phases: any[];
    catName: string;
    tahun: number;
    phaseName: string;
    url: string;
    name: string;
    isSaving: boolean;
  }>({
    isOpen: false,
    arcId: null,
    phaseIdx: null,
    phases: [],
    catName: '',
    tahun: new Date().getFullYear(),
    phaseName: '',
    url: '',
    name: '',
    isSaving: false
  });

  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    arcId: number | null;
    phaseIdx: number | null;
    phases: any[];
    catName: string;
    tahun: number;
    phaseName: string;
    file: File | null;
    customName: string;
    isDragging: boolean;
    isUploading: boolean;
  }>({
    isOpen: false,
    arcId: null,
    phaseIdx: null,
    phases: [],
    catName: '',
    tahun: new Date().getFullYear(),
    phaseName: '',
    file: null,
    customName: '',
    isDragging: false,
    isUploading: false
  });

  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    arcId: number | null;
    phaseIdx: number | null;
    fileIdx: number | null;
    phases: any[];
    currentName: string;
    newName: string;
    isSaving: boolean;
  }>({
    isOpen: false,
    arcId: null,
    phaseIdx: null,
    fileIdx: null,
    phases: [],
    currentName: '',
    newName: '',
    isSaving: false
  });

  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    arcId: number | null;
    phaseIdx: number | null;
    phases: any[];
    phaseName: string;
    tahun: number;
    catatan: string;
    isSaving: boolean;
  }>({
    isOpen: false,
    arcId: null,
    phaseIdx: null,
    phases: [],
    phaseName: '',
    tahun: new Date().getFullYear(),
    catatan: '',
    isSaving: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: catData, error: catErr }, { data: arcData, error: arcErr }] = await Promise.all([
        supabase.from('app_arsip_kategori').select('*').order('nama_kegiatan', { ascending: true }),
        supabase.from('app_arsip_kegiatan').select('*, app_arsip_kategori(nama_kegiatan)').order('tahun', { ascending: false })
      ]);
      
      if (catErr) toast.error('Gagal memuat kategori: ' + catErr.message);
      if (arcErr) toast.error('Gagal memuat arsip: ' + arcErr.message);
      
      const loadedCats = catData || [];
      const loadedArcs = arcData || [];

      setCategories(loadedCats);
      setArchives(loadedArcs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // When changing category for matrix view, auto select available years
  useEffect(() => {
    if (selectedCatId) {
      const catArcs = archives.filter(a => a.kategori_id === selectedCatId);
      const catYears = catArcs.map(a => a.tahun).sort((a, b) => b - a);
      if (catYears.length > 0) {
        setSelectedYears(catYears);
      } else {
        setSelectedYears([new Date().getFullYear()]);
      }
    }
  }, [selectedCatId, archives]);

  const toggleCat = (id: number) => {
    setExpandedCats(prev => {
      const isCurrentlyExpanded = prev.includes(id);
      if (isCurrentlyExpanded) {
        return prev.filter(x => x !== id);
      } else {
        // Auto open latest year if not open
        const catArcs = archives.filter(a => a.kategori_id === id);
        if (catArcs.length > 0) {
          setExpandedYears(old => {
            const key = `${id}-${catArcs[0].tahun}`;
            return old.includes(key) ? old : [...old, key];
          });
        }
        return [...prev, id];
      }
    });
  };
  
  const toggleYear = (key: string) => {
    setExpandedYears(prev => {
       const catId = key.split('-')[0];
       const filtered = prev.filter(k => !k.startsWith(`${catId}-`));
       if (prev.includes(key)) return filtered;
       return [...filtered, key];
    });
  };

  const confirmAction = (msg: string, onConfirm: () => void) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-bold text-sm text-gray-800">{msg}</span>
        <div className="flex gap-2 justify-end">
          <button onClick={() => { toast.dismiss(t.id); onConfirm(); }} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Ya, Lanjutkan</button>
          <button onClick={() => toast.dismiss(t.id)} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 transition-colors">Batal</button>
        </div>
      </div>
    ), { duration: Infinity, style: { border: '1px solid #fee2e2' } });
  };

  const currentYear = new Date().getFullYear();
  const dbYears = archives.map(a => a.tahun);
  const startYear = 2023;
  const endYear = currentYear + 1;
  const baseYears = [];
  for (let y = startYear; y <= endYear; y++) {
    baseYears.push(y);
  }
  const allYears = Array.from(new Set([...dbYears, ...baseYears])).sort((a, b) => b - a);

  // Total stats computation
  const totalFilesCount = useMemo(() => {
    let count = 0;
    archives.forEach(a => {
      const phases = typeof a.fase_dokumen === 'string' ? JSON.parse(a.fase_dokumen) : (a.fase_dokumen || []);
      phases.forEach((p: any) => {
        count += (p.files || []).length;
      });
    });
    return count;
  }, [archives]);

  // --- CATEGORY LOGIC (SAFE SYNC WITH ZERO FILE LOSS) ---
  const handleCatSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Unique Category Name
    const existCat = categories.find(c => c.nama_kegiatan.toLowerCase() === catForm.nama_kegiatan.toLowerCase() && c.id !== catForm.id);
    if (existCat) {
      toast.error('Nama Kegiatan Besar sudah digunakan!');
      return;
    }

    const cleanTemplateFase = catForm.template_fase
      .filter((t: any) => t.nama_fase && t.nama_fase.trim() !== '')
      .map((t: any) => ({
        nama_fase: t.nama_fase.trim(),
        catatan_global: t.catatan_global || ''
      }));

    const payload = { 
      nama_kegiatan: catForm.nama_kegiatan.trim(),
      deskripsi: catForm.deskripsi || '',
      template_fase: JSON.stringify(cleanTemplateFase) 
    };

    let err;
    if (catForm.id) {
      const { error } = await supabase.from('app_arsip_kategori').update(payload).eq('id', catForm.id);
      err = error;

      if (!err) {
         // Sync archives safely without EVER losing files
         const { data: existingArcs } = await supabase.from('app_arsip_kegiatan').select('*').eq('kategori_id', catForm.id);
         if (existingArcs && existingArcs.length > 0) {
            for (const arc of existingArcs) {
               let oldArcPhases = typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : (arc.fase_dokumen || []);
               let matchedOldPhases = new Set<string>();

               let newArcPhases = catForm.template_fase
                 .filter((t: any) => t.nama_fase && t.nama_fase.trim() !== '')
                 .map((tpl: any, idx: number) => {
                    // 1. Try match by _old_nama (prior name before rename) or current nama_fase
                    let existing = oldArcPhases.find((o: any) => 
                      (tpl._old_nama && o.nama_fase?.trim() === tpl._old_nama?.trim()) || 
                      o.nama_fase?.trim() === tpl.nama_fase?.trim()
                    );

                    // 2. If not matched, try matching by index if that index hasn't been matched yet
                    if (!existing && oldArcPhases[idx] && !matchedOldPhases.has(oldArcPhases[idx].nama_fase)) {
                      existing = oldArcPhases[idx];
                    }

                    if (existing) {
                      matchedOldPhases.add(existing.nama_fase);
                    }

                    return {
                       nama_fase: tpl.nama_fase.trim(),
                       catatan_global: tpl.catatan_global || '',
                       catatan: existing?.catatan || '',
                       files: existing?.files || []
                    };
                 });

               // 3. Safety check: preserve any old phases that had files so no files are EVER lost!
               oldArcPhases.forEach((oldP: any) => {
                 if (!matchedOldPhases.has(oldP.nama_fase) && oldP.files && oldP.files.length > 0) {
                   newArcPhases.push({
                     nama_fase: oldP.nama_fase,
                     catatan_global: oldP.catatan_global || '',
                     catatan: oldP.catatan || '',
                     files: oldP.files || []
                   });
                 }
               });

               await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newArcPhases }).eq('id', arc.id);
            }
         }
      }
    } else {
      const { error } = await supabase.from('app_arsip_kategori').insert([payload]);
      err = error;
    }
    
    if (err) {
      toast.error('Gagal menyimpan kategori: ' + err.message);
      return;
    }
    toast.success('Kategori & Template berhasil disimpan!');
    setIsCatModalOpen(false);
    fetchData();
  };

  const handleCatDelete = async (id: number) => {
    const hasArchives = archives.some(a => a.kategori_id === id);
    if (hasArchives) {
       toast.error('Gagal! Folder ini sudah berisi arsip tahunan. Harap hapus arsip tahunannya terlebih dahulu.', { duration: 5000 });
       return;
    }
    confirmAction('Yakin ingin menghapus Folder Kategori ini?', async () => {
      await supabase.from('app_arsip_kategori').delete().eq('id', id);
      toast.success('Kategori dihapus');
      if (selectedCatId === id) setSelectedCatId(null);
      fetchData();
    });
  };

  // --- ARCHIVE LOGIC ---
  const handleArcSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arcForm.id) {
       const exists = archives.find(a => a.tahun === arcForm.tahun && a.kategori_id === arcForm.kategori_id);
       if (exists) {
          toast.error(`Arsip tahun ${arcForm.tahun} sudah ada!`);
          return;
       }
    }
    let err;
    if (arcForm.id) {
      const { error } = await supabase.from('app_arsip_kegiatan').update({ catatan: arcForm.catatan, fase_dokumen: arcForm.fase_dokumen }).eq('id', arcForm.id);
      err = error;
    } else {
      // Init from template
      const cat = categories.find(c => c.id === arcForm.kategori_id);
      let phases = [];
      if (cat && cat.template_fase) {
         const tpl = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : cat.template_fase;
         phases = tpl.map((p: any) => ({ nama_fase: typeof p === 'string' ? p : p.nama_fase, files: [], catatan_global: p.catatan_global || '' }));
      }
      const { error } = await supabase.from('app_arsip_kegiatan').insert([{ kategori_id: arcForm.kategori_id, tahun: arcForm.tahun, catatan: arcForm.catatan, fase_dokumen: phases }]);
      err = error;
    }
    
    if (err) {
      toast.error('Gagal menyimpan arsip tahun: ' + err.message);
      return;
    }
    toast.success('Arsip berhasil disimpan!');
    setIsArcModalOpen(false);
    fetchData();
  };

  const handleArcDelete = async (id: number) => {
    confirmAction('Yakin ingin menghapus arsip tahun ini?', async () => {
      await supabase.from('app_arsip_kegiatan').delete().eq('id', id);
      toast.success('Arsip dihapus');
      fetchData();
    });
  };

  // --- FILE & NOTE LOGIC ---
  const normalizePhases = (arr: any[]) => arr.map(p => typeof p === 'string' ? { nama_fase: p, files: [] } : { ...p, files: p.files || [] });

  const getFileItemMeta = (file: { name: string; url: string; type?: string }) => {
    const url = (file.url || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const cleanUrl = url.split('?')[0];
    const ext = (cleanUrl.split('.').pop() || name.split('.').pop() || '').toLowerCase();

    if (file.type === 'link' || url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('sharepoint.com') || url.includes('onedrive')) {
      if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
        return {
          label: 'GDrive',
          icon: <Globe size={13} className="text-emerald-600 shrink-0" />,
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          cardBg: 'hover:bg-emerald-50/30 hover:border-emerald-300'
        };
      }
      return {
        label: 'Link Web',
        icon: <LinkIcon size={13} className="text-sky-600 shrink-0" />,
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
        cardBg: 'hover:bg-sky-50/30 hover:border-sky-300'
      };
    }

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return {
        label: 'Excel',
        icon: <FileSpreadsheet size={13} className="text-emerald-600 shrink-0" />,
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cardBg: 'hover:bg-emerald-50/30 hover:border-emerald-300'
      };
    }

    if (['pdf'].includes(ext)) {
      return {
        label: 'PDF',
        icon: <FileText size={13} className="text-rose-600 shrink-0" />,
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        cardBg: 'hover:bg-rose-50/30 hover:border-rose-300'
      };
    }

    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
      return {
        label: 'Foto',
        icon: <ImageIcon size={13} className="text-amber-600 shrink-0" />,
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        cardBg: 'hover:bg-amber-50/30 hover:border-amber-300'
      };
    }

    if (['doc', 'docx'].includes(ext)) {
      return {
        label: 'Word',
        icon: <FileText size={13} className="text-blue-600 shrink-0" />,
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        cardBg: 'hover:bg-blue-50/30 hover:border-blue-300'
      };
    }

    return {
      label: ext.toUpperCase() || 'File',
      icon: <File size={13} className="text-indigo-600 shrink-0" />,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      cardBg: 'hover:bg-indigo-50/30 hover:border-indigo-300'
    };
  };

  // --- PRESET TEMPLATES LOGIC ---
  const applyPresetPhases = (type: 'rka' | 'pengadaan' | 'keuangan' | 'umum') => {
    let presets: { nama_fase: string; catatan_global: string; _old_nama: string }[] = [];
    if (type === 'rka') {
      presets = [
        { nama_fase: '1. Usulan & Kebutuhan Unit', catatan_global: 'Dokumen usulan dan KAK awal dari unit kerja.', _old_nama: '' },
        { nama_fase: '2. Pembahasan & Review Anggaran', catatan_global: 'Catatan telaah dari tim verifikasi dan perencana.', _old_nama: '' },
        { nama_fase: '3. Penetapan Pagu Definitif / SK', catatan_global: 'Surat Keputusan alokasi pagu resmi.', _old_nama: '' },
        { nama_fase: '4. Pelaksanaan & Penyerapan', catatan_global: 'Bukti realisasi dan SPJ kegiatan tahun berjalan.', _old_nama: '' },
        { nama_fase: '5. Laporan Pertanggungjawaban (LPJ)', catatan_global: 'Laporan akhir kegiatan dan evaluasi capaian.', _old_nama: '' }
      ];
    } else if (type === 'pengadaan') {
      presets = [
        { nama_fase: '1. HPS & Kerangka Acuan Kerja (KAK)', catatan_global: 'Rincian spesifikasi teknis dan perkiraan harga sendiri.', _old_nama: '' },
        { nama_fase: '2. Undangan / Dokumen Pengadaan', catatan_global: 'Dokumen lelang / pemilihan penyedia.', _old_nama: '' },
        { nama_fase: '3. Evaluasi & Penetapan Pemenang', catatan_global: 'Berita Acara Hasil Pemilihan (BAHP).', _old_nama: '' },
        { nama_fase: '4. Surat Perjanjian / Kontrak (SPK)', catatan_global: 'Naskah kontrak kerja sama resmi.', _old_nama: '' },
        { nama_fase: '5. BAST & Bukti Pembayaran', catatan_global: 'Berita Acara Serah Terima pekerjaan dan SP2D.', _old_nama: '' }
      ];
    } else if (type === 'keuangan') {
      presets = [
        { nama_fase: '1. Buku Kas Umum (BKU) & Rekening Koran', catatan_global: 'Mutasi kas dan mutasi bank bulanan.', _old_nama: '' },
        { nama_fase: '2. Berita Acara Rekonsiliasi Bank', catatan_global: 'Kesesuaian saldo catatan pembukuan dan bank.', _old_nama: '' },
        { nama_fase: '3. Laporan Realisasi Anggaran (LRA)', catatan_global: 'Tabel realisasi belanja dan pendapatan.', _old_nama: '' },
        { nama_fase: '4. Neraca & Catatan Atas Laporan (CALK)', catatan_global: 'Laporan posisi keuangan akhir periode.', _old_nama: '' }
      ];
    } else {
      presets = [
        { nama_fase: '1. Surat & Dokumen Masuk', catatan_global: '', _old_nama: '' },
        { nama_fase: '2. Dokumen Proses / Telaah', catatan_global: '', _old_nama: '' },
        { nama_fase: '3. Berita Acara / Laporan Hasil', catatan_global: '', _old_nama: '' }
      ];
    }

    setCatForm(prev => ({
      ...prev,
      template_fase: presets
    }));
    toast.success(`Template tahapan "${type.toUpperCase()}" berhasil diterapkan!`);
  };

  // --- MODAL OPENERS & HANDLERS ---
  const openLinkModal = (arcId: number, phaseIdx: number, phases: any[], catName: string, tahun: number, phaseName: string) => {
    const norm = normalizePhases(phases);
    const pName = phaseName || norm[phaseIdx]?.nama_fase || 'Dokumen';
    const defaultName = `${tahun} ${catName} - ${pName}`;
    setLinkModal({
      isOpen: true,
      arcId,
      phaseIdx,
      phases: norm,
      catName,
      tahun,
      phaseName: pName,
      url: '',
      name: defaultName,
      isSaving: false
    });
  };

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModal.arcId || linkModal.phaseIdx === null) return;
    if (!linkModal.url.trim()) {
      toast.error('Harap masukkan URL Google Drive / tautan dokumen!');
      return;
    }

    setLinkModal(prev => ({ ...prev, isSaving: true }));
    try {
      const newPhases = [...linkModal.phases];
      const finalName = linkModal.name.trim() || `${linkModal.tahun} ${linkModal.catName} - ${linkModal.phaseName}`;
      
      newPhases[linkModal.phaseIdx].files.push({
        name: finalName,
        url: linkModal.url.trim(),
        type: 'link',
        uploaded_at: new Date().toISOString()
      });

      const { error } = await supabase
        .from('app_arsip_kegiatan')
        .update({ fase_dokumen: newPhases })
        .eq('id', linkModal.arcId);

      if (error) throw error;
      toast.success('Tautan berhasil disimpan!');
      setLinkModal(prev => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan tautan: ' + (err.message || ''));
    } finally {
      setLinkModal(prev => ({ ...prev, isSaving: false }));
    }
  };

  const openUploadModal = (arcId: number, phaseIdx: number, phases: any[], catName: string, tahun: number, phaseName: string) => {
    const norm = normalizePhases(phases);
    const pName = phaseName || norm[phaseIdx]?.nama_fase || 'Dokumen';
    setUploadModal({
      isOpen: true,
      arcId,
      phaseIdx,
      phases: norm,
      catName,
      tahun,
      phaseName: pName,
      file: null,
      customName: '',
      isDragging: false,
      isUploading: false
    });
  };

  const handleProcessUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const { arcId, phaseIdx, phases, catName, tahun, phaseName, file, customName } = uploadModal;
    if (!arcId || phaseIdx === null || !file) {
      toast.error('Pilih file dokumen yang ingin diunggah!');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Ukuran file melebihi batas maksimal 50MB!');
      return;
    }

    setUploadModal(prev => ({ ...prev, isUploading: true }));
    const toastId = toast.loading(`Mengunggah "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
    const safeFolderName = catName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() || 'arsip_umum';
    const folderPath = `arsip_kegiatan/${safeFolderName}/${tahun}`;

    try {
      let publicUrl = '';

      // 1. Presigned Direct Upload
      try {
        const presignRes = await fetch('/api/upload/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            folder: folderPath
          })
        });
        const presignData = await presignRes.json();
        if (presignData.success && presignData.presignedUrl) {
          const directUploadRes = await fetch(presignData.presignedUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type || 'application/octet-stream' }
          });
          if (directUploadRes.ok) {
            publicUrl = presignData.publicUrl;
          }
        }
      } catch (presignErr) {
        console.warn("Presigned upload fallback:", presignErr);
      }

      // 2. Fallback Upload
      if (!publicUrl) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folderPath);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          publicUrl = data.publicUrl;
        } else {
          throw new Error(data.error || 'Gagal mengunggah file.');
        }
      }

      const newPhases = normalizePhases(phases);
      const extMatch = file.name.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0] : '';
      
      const safeCatName = catName.replace(/[^a-zA-Z0-9]/g, '_');
      const safePhaseName = phaseName.replace(/[^a-zA-Z0-9]/g, '_');
      const defaultFileName = `${tahun}_${safeCatName}_${safePhaseName}${ext}`;
      const finalFileName = customName.trim() ? (customName.trim().endsWith(ext) ? customName.trim() : `${customName.trim()}${ext}`) : defaultFileName;

      newPhases[phaseIdx].files.push({
        name: finalFileName,
        url: publicUrl,
        type: 'file',
        size: file.size,
        uploaded_at: new Date().toISOString()
      });

      const { error } = await supabase
        .from('app_arsip_kegiatan')
        .update({ fase_dokumen: newPhases })
        .eq('id', arcId);

      if (error) throw error;
      toast.success('Berkas berhasil diunggah!', { id: toastId });
      setUploadModal(prev => ({ ...prev, isOpen: false, isUploading: false }));
      fetchData();
    } catch (err: any) {
      toast.error('Gagal mengunggah berkas: ' + (err.message || ''), { id: toastId });
      setUploadModal(prev => ({ ...prev, isUploading: false }));
    }
  };

  const removeFile = async (arcId: number, phaseIdx: number, fileIdx: number, phases: any[]) => {
    confirmAction('Yakin ingin mencabut file ini dari daftar?', async () => {
      const newPhases = normalizePhases(phases);
      newPhases[phaseIdx].files = newPhases[phaseIdx].files.filter((_: any, i: number) => i !== fileIdx);
      await supabase.from('app_arsip_kegiatan').update({ fase_dokumen: newPhases }).eq('id', arcId);
      toast.success('File berhasil dicabut');
      fetchData();
    });
  };

  const openRenameModal = (arcId: number, phaseIdx: number, fileIdx: number, phases: any[], currentName: string) => {
    const norm = normalizePhases(phases);
    setRenameModal({
      isOpen: true,
      arcId,
      phaseIdx,
      fileIdx,
      phases: norm,
      currentName: currentName || '',
      newName: currentName || '',
      isSaving: false
    });
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    const { arcId, phaseIdx, fileIdx, phases, newName } = renameModal;
    if (!arcId || phaseIdx === null || fileIdx === null || !newName.trim()) {
      toast.error('Harap masukkan nama berkas baru!');
      return;
    }

    setRenameModal(prev => ({ ...prev, isSaving: true }));
    try {
      const newPhases = [...phases];
      newPhases[phaseIdx].files[fileIdx].name = newName.trim();
      const { error } = await supabase
        .from('app_arsip_kegiatan')
        .update({ fase_dokumen: newPhases })
        .eq('id', arcId);

      if (error) throw error;
      toast.success('Nama berkas berhasil diperbarui!');
      setRenameModal(prev => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (err: any) {
      toast.error('Gagal memperbarui nama: ' + (err.message || ''));
    } finally {
      setRenameModal(prev => ({ ...prev, isSaving: false }));
    }
  };

  const openNoteModal = (arcId: number, phaseIdx: number, phases: any[], phaseName: string, tahun: number, currentNote: string) => {
    const norm = normalizePhases(phases);
    setNoteModal({
      isOpen: true,
      arcId,
      phaseIdx,
      phases: norm,
      phaseName,
      tahun,
      catatan: currentNote || '',
      isSaving: false
    });
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const { arcId, phaseIdx, phases, catatan } = noteModal;
    if (!arcId || phaseIdx === null) return;

    setNoteModal(prev => ({ ...prev, isSaving: true }));
    try {
      const newPhases = [...phases];
      newPhases[phaseIdx].catatan = catatan.trim();
      const { error } = await supabase
        .from('app_arsip_kegiatan')
        .update({ fase_dokumen: newPhases })
        .eq('id', arcId);

      if (error) throw error;
      toast.success('Catatan tahap berhasil disimpan!');
      setNoteModal(prev => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (err: any) {
      toast.error('Gagal menyimpan catatan: ' + (err.message || ''));
    } finally {
      setNoteModal(prev => ({ ...prev, isSaving: false }));
    }
  };

  // Filter Categories by Search Query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(c => 
      c.nama_kegiatan?.toLowerCase().includes(q) ||
      c.deskripsi?.toLowerCase().includes(q) ||
      (typeof c.template_fase === 'string' ? c.template_fase : JSON.stringify(c.template_fase || [])).toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  // If in Public Presentation Mode, render ArsipPublicView directly inside dashboard
  if (isPublicMode) {
    return (
      <ArsipPublicView
        initialCategories={categories}
        initialArchives={archives}
        isEmbedded={true}
        onBackToDashboard={() => setIsPublicMode(false)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-24 font-sans text-gray-900">
      {/* 1. SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Archive size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Arsip Kegiatan Tahunan</h1>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {categories.length} Folder Kegiatan • {archives.length} Arsip Tahun • {totalFilesCount} File Lampiran
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Repositori berkas kegiatan, tahapan fase statis, dan matriks perbandingan tahunan
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
             <button 
               onClick={() => setViewMode('list')} 
               className={`h-7 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-2xs text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <Folder size={12} />
               <span>Daftar Folder</span>
             </button>
             <button 
               onClick={() => {
                 setViewMode('matrix');
                 if (!selectedCatId && categories.length > 0) {
                   setSelectedCatId(categories[0].id);
                 }
               }} 
               className={`h-7 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === 'matrix' ? 'bg-white shadow-2xs text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
             >
               <Table size={12} />
               <span>Matriks Sanding</span>
             </button>
          </div>

          <button 
            onClick={() => { 
              setCatForm({ 
                id: null, 
                nama_kegiatan: '', 
                deskripsi: '', 
                template_fase: [
                  { nama_fase: 'Tahap 1: Surat / Usulan', catatan_global: '', _old_nama: '' }, 
                  { nama_fase: 'Tahap 2: Dokumen Pendukung', catatan_global: '', _old_nama: '' }
                ] 
              }); 
              setIsCatModalOpen(true); 
            }}
            className="h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Plus size={14} />
            <span>Folder Baru</span>
          </button>

          {/* Button Mode Publik & Bagikan */}
          <button
            type="button"
            onClick={() => setIsPublicMode(true)}
            className="h-9 px-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Pratinjau Tampilan Publik / Share untuk Umum"
          >
            <span>👁️ Tampilan Publik</span>
          </button>

          <Link
            href="/share/arsip-kegiatan"
            target="_blank"
            className="h-9 px-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Buka Halaman Share Publik di Tab Baru"
          >
            <Share2 size={13} className="text-indigo-600" />
            <span>Bagikan</span>
          </Link>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 z-20 relative">
        <div className="flex-1 w-full flex flex-col md:flex-row items-center gap-2.5">
          {viewMode === 'matrix' ? (
            <>
              <div className="w-full md:w-80">
                <Select 
                  options={categories.map(c => ({ value: c.id, label: c.nama_kegiatan }))}
                  value={selectedCatId ? { value: selectedCatId, label: categories.find(c => c.id === selectedCatId)?.nama_kegiatan } : null}
                  onChange={(val: any) => setSelectedCatId(val ? val.value : null)}
                  placeholder="Pilih Kegiatan Besar..."
                  isClearable={false}
                  className="text-xs font-bold"
                  styles={{
                    control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
                    valueContainer: (base) => ({ ...base, padding: '0 8px' })
                  }}
                />
              </div>

              {selectedCatId && (
                <div className="w-full md:flex-1">
                  <Select
                    isMulti
                    options={allYears.map(y => ({ value: y, label: `Tahun ${y}` }))}
                    value={selectedYears.map(y => ({ value: y, label: `Tahun ${y}` }))}
                    onChange={(val: any) => setSelectedYears(val ? val.map((v: any) => v.value) : [])}
                    placeholder="Pilih Tahun untuk disandingkan..."
                    className="text-xs font-bold"
                    styles={{
                      control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }),
                      multiValue: (base) => ({ ...base, backgroundColor: '#4f46e5', borderRadius: '0.375rem', padding: '0 2px' }),
                      multiValueLabel: (base) => ({ ...base, color: 'white', fontWeight: 'bold', fontSize: '10px', padding: '0 4px' }),
                      multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#4338ca', color: 'white' } })
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700">Semua Folder Kegiatan ({filteredCategories.length})</span>
              <span className="text-[11px] text-gray-400 font-medium">Klik folder untuk membuka arsip tahunan & dokumen</span>
            </div>
          )}
        </div>

        {/* Global Search Box */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari folder / nama file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
          />
        </div>
      </div>

      {/* 3. MAIN CONTENT AREA */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-12 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="text-xs font-bold text-gray-500">Memuat Repositori Arsip Dokumen...</span>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW / DAFTAR FOLDER ACCORDION */
        <div className="space-y-3 animate-in fade-in duration-200">
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 py-16 text-center text-gray-400 font-bold italic text-xs shadow-xs">
              Belum ada folder kegiatan yang sesuai pencarian.
            </div>
          ) : (
            filteredCategories.map(cat => {
              const isCatExpanded = expandedCats.includes(cat.id);
              const catArcs = archives.filter(a => a.kategori_id === cat.id);
              const rawPhases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);
              const normalizedPhases = rawPhases.map((p: any) => {
                const name = typeof p === 'string' ? p : p.nama_fase;
                const globalNote = typeof p === 'string' ? '' : (p.catatan_global || '');
                return { nama_fase: name, catatan_global: globalNote, _old_nama: name };
              });

              return (
                <div key={cat.id} className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden transition-all duration-200">
                  {/* Folder Card Header */}
                  <div 
                    className={`p-4 px-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 cursor-pointer transition-colors ${isCatExpanded ? 'bg-indigo-50/60 border-b border-indigo-100' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleCat(cat.id)}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl ${isCatExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Folder size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900">{cat.nama_kegiatan}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-500 mt-0.5">
                          <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs text-indigo-700">
                            {catArcs.length} Tahun Tersedia
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs text-gray-600">
                            {normalizedPhases.length} Fase Dokumen
                          </span>
                          {cat.deskripsi && <span className="text-gray-400 truncate max-w-sm font-normal">{cat.deskripsi}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => {
                          setSelectedCatId(cat.id);
                          setViewMode('matrix');
                        }}
                        className="h-8 px-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors bg-white shadow-2xs border border-gray-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Buka Matriks Sanding Tahun"
                      >
                        <Table size={13}/>
                        <span>Matriks</span>
                      </button>

                      <button 
                        onClick={() => { 
                          setCatForm({ ...cat, template_fase: normalizedPhases }); 
                          setIsCatModalOpen(true); 
                        }} 
                        className="h-8 px-2.5 text-indigo-700 hover:bg-indigo-100/80 rounded-xl transition-colors bg-white shadow-2xs border border-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Edit Kategori & Template Fase"
                      >
                        <Settings size={13}/>
                        <span>Template</span>
                      </button>

                      <div 
                        onClick={() => toggleCat(cat.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer ml-1"
                      >
                        {isCatExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Folder Expanded Area */}
                  {isCatExpanded && (
                    <div className="p-4 md:p-5 bg-gray-50/50 space-y-4">
                      {/* Year Tabs Selector */}
                      <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3">
                        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                          <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">Pilih Tahun:</span>
                          {catArcs.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">Belum ada arsip tahunan.</span>
                          ) : (
                            catArcs.map(arc => {
                              const yearKey = `${cat.id}-${arc.tahun}`;
                              const isYearSelected = expandedYears.includes(yearKey);
                              const phases = typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : (arc.fase_dokumen || []);
                              const filesCount = phases.reduce((acc: number, p: any) => acc + (p.files?.length || 0), 0);

                              return (
                                <button
                                  key={arc.id}
                                  onClick={() => toggleYear(yearKey)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                    isYearSelected 
                                      ? 'bg-indigo-600 text-white shadow-xs' 
                                      : 'bg-white border border-gray-200 text-gray-700 hover:border-indigo-300'
                                  }`}
                                >
                                  <span>Tahun {arc.tahun}</span>
                                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] ${isYearSelected ? 'bg-indigo-700 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {filesCount} File
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>

                        <button 
                          onClick={() => { 
                            setArcForm({ id: null, kategori_id: cat.id, tahun: new Date().getFullYear(), catatan: '', fase_dokumen: [] }); 
                            setIsArcModalOpen(true); 
                          }}
                          className="h-8 px-3 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>Buka Tahun Baru</span>
                        </button>
                      </div>

                      {/* Detail / Phase Grid for Active Year */}
                      {(() => {
                        const activeArc = catArcs.find(arc => expandedYears.includes(`${cat.id}-${arc.tahun}`));
                        if (!activeArc) {
                          return (
                            <div className="py-8 text-center text-gray-400 font-bold italic text-xs">
                              Silakan klik salah satu tahun di atas untuk melihat dokumen.
                            </div>
                          );
                        }

                        const phases = typeof activeArc.fase_dokumen === 'string' ? JSON.parse(activeArc.fase_dokumen) : (activeArc.fase_dokumen || []);

                        return (
                          <div className="space-y-4 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between bg-white p-3 px-4 rounded-xl border border-gray-200 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <Calendar size={15} className="text-indigo-600" />
                                <span className="font-black text-xs text-gray-900">Arsip Tahun {activeArc.tahun}</span>
                                {activeArc.catatan && (
                                  <span className="text-[11px] text-gray-500 font-medium">({activeArc.catatan})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => { 
                                    setArcForm({ ...activeArc, fase_dokumen: phases }); 
                                    setIsArcModalOpen(true); 
                                  }} 
                                  className="h-7 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200 flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 size={10} /> Edit Catatan
                                </button>
                                <button 
                                  onClick={() => handleArcDelete(activeArc.id)} 
                                  className="h-7 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 size={10} /> Hapus Tahun
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                              {phases.map((phase: any, pIdx: number) => {
                                const catTemplatePhases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);
                                const globalNote = catTemplatePhases[pIdx]?.catatan_global || phase.catatan_global;

                                return (
                                  <div key={pIdx} className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3">
                                    <div>
                                      <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-black border border-indigo-200">
                                            {pIdx + 1}
                                          </span>
                                          <h4 className="font-bold text-xs text-gray-900 leading-snug">{phase.nama_fase}</h4>
                                        </div>
                                      </div>

                                      {globalNote && (
                                        <div className="border-l-2 border-indigo-200 pl-2 mb-2.5 bg-indigo-50/30 rounded-r py-0.5">
                                          <p className="text-[9px] text-indigo-900/90 leading-tight">
                                            <span className="font-bold text-indigo-700 uppercase block text-[7px] tracking-wider">Catatan Global:</span>
                                            {globalNote}
                                          </p>
                                        </div>
                                      )}

                                      {/* Catatan Fase */}
                                      <div className="group/note relative border-l-2 border-amber-300 pl-2.5 py-1 bg-amber-50/40 rounded-r-xl mb-3 transition-colors hover:bg-amber-50/70">
                                        <p className="text-[10px] text-amber-900 leading-snug pr-6 font-medium">
                                          <span className="font-black text-amber-700 uppercase block text-[8px] tracking-wider mb-0.5">Catatan Tahun {activeArc.tahun}:</span>
                                          {phase.catatan || <span className="text-amber-400 italic">Klik pensil untuk menulis catatan...</span>}
                                        </p>
                                        <button 
                                          onClick={() => openNoteModal(activeArc.id, pIdx, phases, phase.nama_fase, activeArc.tahun, phase.catatan)} 
                                          className="absolute top-1 right-1 opacity-0 group-hover/note:opacity-100 p-1 hover:bg-amber-200/80 rounded-md text-amber-800 transition-all cursor-pointer"
                                          title="Tulis / Edit Catatan Tahap"
                                        >
                                          <Edit2 size={10}/>
                                        </button>
                                      </div>

                                      {/* Upload & Link Actions */}
                                      <div className="flex gap-2 mb-3">
                                        <button 
                                          onClick={() => openUploadModal(activeArc.id, pIdx, phases, cat.nama_kegiatan, activeArc.tahun, phase.nama_fase)}
                                          className="cursor-pointer flex-1 h-8 bg-gradient-to-r from-indigo-50 to-indigo-100/60 hover:from-indigo-100 hover:to-indigo-200/80 border border-indigo-200/80 text-indigo-700 hover:text-indigo-900 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                                        >
                                          <CloudUpload size={13} className="text-indigo-600" />
                                          <span>Upload Berkas</span>
                                        </button>

                                        <button 
                                          onClick={() => openLinkModal(activeArc.id, pIdx, phases, cat.nama_kegiatan, activeArc.tahun, phase.nama_fase)} 
                                          className="cursor-pointer flex-1 h-8 bg-gradient-to-r from-sky-50 to-sky-100/60 hover:from-sky-100 hover:to-sky-200/80 border border-sky-200/80 text-sky-700 hover:text-sky-900 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-95"
                                        >
                                          <LinkIcon size={12} className="text-sky-600" />
                                          <span>Link GDrive</span>
                                        </button>
                                      </div>

                                      {/* File List */}
                                      {(!phase.files || phase.files.length === 0) ? (
                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider text-center py-3 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                          Belum Ada Lampiran
                                        </div>
                                      ) : (
                                        <ul className="space-y-1.5">
                                          {phase.files.map((file: any, fIdx: number) => {
                                            const meta = getFileItemMeta(file);
                                            return (
                                              <li 
                                                key={fIdx} 
                                                className={`group flex items-center justify-between p-1.5 px-2 rounded-xl bg-white border border-gray-200/80 shadow-2xs transition-all ${meta.cardBg}`}
                                              >
                                                <a 
                                                  href={file.url} 
                                                  target="_blank" 
                                                  rel="noreferrer" 
                                                  className="flex items-center gap-2 w-full pr-1 overflow-hidden" 
                                                  title={`Buka File: ${file.name}`}
                                                >
                                                  <div className={`p-1 rounded-md border flex items-center justify-center shrink-0 ${meta.badgeColor}`}>
                                                    {meta.icon}
                                                  </div>
                                                  <div className="flex flex-col min-w-0 flex-1">
                                                    <div className="flex items-center gap-1">
                                                      <span className="text-[10px] font-bold text-gray-800 group-hover:text-indigo-600 truncate leading-tight">
                                                        {file.name}
                                                      </span>
                                                      <ExternalLink size={9} className="opacity-0 group-hover:opacity-60 text-gray-400 shrink-0" />
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                      <span className={`px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider border ${meta.badgeColor}`}>
                                                        {meta.label}
                                                      </span>
                                                      {file.uploaded_at && (
                                                        <span className="text-[8px] text-gray-400 font-medium truncate">
                                                          {new Date(file.uploaded_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </a>

                                                <div className="flex items-center gap-0.5 shrink-0">
                                                  <button 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      openRenameModal(activeArc.id, pIdx, fIdx, phases, file.name);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                                                    title="Ubah Nama Tampilan File"
                                                  >
                                                    <Edit3 size={11} />
                                                  </button>
                                                  <button 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      removeFile(activeArc.id, pIdx, fIdx, phases);
                                                    }} 
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-all cursor-pointer" 
                                                    title="Hapus File Lampiran"
                                                  >
                                                    <Trash2 size={11} />
                                                  </button>
                                                </div>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* MATRIX SANDING TAHUN */
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden animate-in fade-in duration-200">
          {(() => {
            const cat = categories.find(c => c.id === selectedCatId);
            if (!cat) {
              return (
                <div className="py-20 text-center text-gray-400 font-bold italic text-xs">
                  Silakan pilih Kegiatan Besar pada dropdown di atas.
                </div>
              );
            }
            
            const rawPhases = typeof cat.template_fase === 'string' ? JSON.parse(cat.template_fase) : (cat.template_fase || []);
            const normalizedPhases = rawPhases.map((p: any) => {
              const name = typeof p === 'string' ? p : p.nama_fase;
              const globalNote = typeof p === 'string' ? '' : (p.catatan_global || '');
              return {
                nama_fase: name,
                catatan_global: globalNote,
                _old_nama: name
              };
            });

            return (
              <div className="overflow-x-auto custom-scrollbar">
                {/* Category Banner Header */}
                <div className="p-4 px-5 bg-gradient-to-r from-indigo-50/80 via-sky-50/40 to-white border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-[800px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <FolderOpen size={18} className="text-indigo-600" />
                      <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">{cat.nama_kegiatan}</h2>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100/80 text-indigo-800 text-[10px] font-bold">
                        {normalizedPhases.length} Fase Dokumen
                      </span>
                    </div>
                    {cat.deskripsi && (
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 max-w-2xl">{cat.deskripsi}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => { 
                        setCatForm({ ...cat, template_fase: normalizedPhases }); 
                        setIsCatModalOpen(true); 
                      }} 
                      className="h-8 px-3 text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Ubah Nama & Template Tahapan Fase"
                    >
                      <Settings size={13}/>
                      <span>Edit Template Fase</span>
                    </button>

                    <button 
                      onClick={() => { 
                        setArcForm({ id: null, kategori_id: cat.id, tahun: new Date().getFullYear(), catatan: '', fase_dokumen: [] }); 
                        setIsArcModalOpen(true); 
                      }} 
                      className="h-8 px-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus size={13}/>
                      <span>Buka Tahun Baru</span>
                    </button>
                  </div>
                </div>

                {/* Matrix Table */}
                {selectedYears.length === 0 ? (
                  <div className="text-center py-16 text-gray-400 font-bold italic text-xs">
                    Pilih minimal 1 tahun pada filter di atas untuk melihat tabel perbandingan dokumen.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-gray-50/90 text-gray-500 uppercase tracking-wider text-[10px] font-black border-b border-gray-200">
                        <th className="p-3.5 px-4 border-r border-gray-200 min-w-[260px] sticky left-0 bg-gray-50/95 z-20 shadow-xs">
                          Tahapan / Fase Dokumen
                        </th>
                        {selectedYears.map((y: number) => (
                          <th key={y} className="p-3.5 px-4 text-center border-r border-gray-200 font-black min-w-[300px]">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-gray-900 text-xs">TAHUN {y}</span>
                              {(() => {
                                const arc = archives.find(a => a.tahun === y && a.kategori_id === selectedCatId);
                                if (arc) {
                                  return (
                                    <button 
                                      onClick={() => {
                                        setArcForm({ ...arc, fase_dokumen: typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : arc.fase_dokumen });
                                        setIsArcModalOpen(true);
                                      }} 
                                      className="p-1 hover:bg-gray-200/80 rounded-md text-gray-400 hover:text-indigo-600 transition-colors"
                                      title="Edit Catatan Tahun Ini"
                                    >
                                      <Edit2 size={11}/>
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {normalizedPhases.map((phaseItem: any, pIdx: number) => {
                        const phaseName = phaseItem.nama_fase;
                        return (
                          <tr key={pIdx} className="hover:bg-gray-50/40 transition-colors">
                            {/* Sticky Left Column: Phase Name & Global Note */}
                            <td className="p-3.5 px-4 sticky left-0 bg-white border-r border-gray-200/80 z-10 align-top shadow-2xs">
                              <div className="flex items-start gap-2.5 mb-1.5">
                                <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 border border-indigo-200">
                                  {pIdx + 1}
                                </span>
                                <h3 className="font-bold text-xs text-gray-900 leading-snug">{phaseName}</h3>
                              </div>
                              {phaseItem.catatan_global && (
                                <div className="ml-7 border-l-2 border-indigo-200 pl-2 mt-1">
                                  <p className="text-[10px] text-indigo-900/90 leading-tight">
                                    <span className="font-bold text-indigo-700 uppercase block text-[8px] tracking-wider">Catatan Global:</span>
                                    {phaseItem.catatan_global}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* Year Columns */}
                            {selectedYears.map((y: number) => {
                              const arc = archives.find(a => a.tahun === y && a.kategori_id === selectedCatId);
                              if (!arc) {
                                return (
                                  <td key={`${pIdx}-${y}`} className="p-3.5 px-4 border-r border-gray-100 text-center align-top bg-gray-50/30">
                                    {pIdx === 0 ? (
                                      <button 
                                        onClick={() => { 
                                          setArcForm({ id: null, kategori_id: selectedCatId, tahun: y, catatan: '', fase_dokumen: [] }); 
                                          setIsArcModalOpen(true); 
                                        }}
                                        className="h-8 px-3 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                                      >
                                        <Plus size={13} /> Buka Arsip {y}
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 italic block mt-1">Menunggu arsip dibuka...</span>
                                    )}
                                  </td>
                                );
                              }
                              
                              // Locate Phase Data (with exact or fallback index matching)
                              const arcPhases = typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : (arc.fase_dokumen || []);
                              let arcPhaseIdx = arcPhases.findIndex((f: any) => f.nama_fase?.trim() === phaseName?.trim());
                              if (arcPhaseIdx === -1 && arcPhases[pIdx]) {
                                arcPhaseIdx = pIdx;
                              }
                              const phaseData = arcPhaseIdx >= 0 ? arcPhases[arcPhaseIdx] : null;

                              return (
                                <td key={`${pIdx}-${y}`} className="p-3 px-4 border-r border-gray-100 align-top bg-white">
                                  {!phaseData ? (
                                    <span className="text-[10px] text-gray-400 italic block text-center py-2">Fase belum aktif di tahun ini.</span>
                                  ) : (
                                    <div className="flex flex-col h-full space-y-2.5">
                                      {/* Action Buttons: Upload & Link */}
                                      <div className="flex items-center gap-1.5">
                                        <button 
                                          onClick={() => openUploadModal(arc.id, arcPhaseIdx, arcPhases, cat.nama_kegiatan, arc.tahun, phaseName)}
                                          className="cursor-pointer flex-1 h-7.5 bg-gradient-to-r from-indigo-50 to-indigo-100/60 hover:from-indigo-100 hover:to-indigo-200/80 border border-indigo-200 text-indigo-700 rounded-xl transition-all text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95" 
                                          title="Upload Dokumen Fisik (PDF/Excel/Word)"
                                        >
                                          <CloudUpload size={12} className="text-indigo-600" />
                                          <span>Upload</span>
                                        </button>

                                        <button 
                                          onClick={() => openLinkModal(arc.id, arcPhaseIdx, arcPhases, cat.nama_kegiatan, arc.tahun, phaseName)} 
                                          className="cursor-pointer flex-1 h-7.5 bg-gradient-to-r from-sky-50 to-sky-100/60 hover:from-sky-100 hover:to-sky-200/80 border border-sky-200 text-sky-700 rounded-xl transition-all text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95" 
                                          title="Beri Tautan Google Drive / Cloud URL"
                                        >
                                          <LinkIcon size={12} className="text-sky-600"/>
                                          <span>Tautan</span>
                                        </button>
                                      </div>

                                      {/* Phase Note */}
                                      <div className="group/note relative border-l-2 border-amber-300 pl-2.5 py-1 bg-amber-50/40 rounded-r-xl transition-colors hover:bg-amber-50/70">
                                        <p className="text-[10px] text-amber-900 leading-snug pr-6 font-medium">
                                          <span className="font-black text-amber-700 uppercase block text-[8px] tracking-wider mb-0.5">Catatan Fase:</span>
                                          {phaseData.catatan || <span className="text-amber-400 italic">Klik pensil untuk menulis catatan...</span>}
                                        </p>
                                        <button 
                                          onClick={() => openNoteModal(arc.id, arcPhaseIdx, arcPhases, phaseName, arc.tahun, phaseData.catatan)} 
                                          className="absolute top-1 right-1 opacity-0 group-hover/note:opacity-100 p-1 hover:bg-amber-200/80 rounded-md text-amber-800 transition-all cursor-pointer"
                                          title="Ubah Catatan Fase"
                                        >
                                          <Edit2 size={10}/>
                                        </button>
                                      </div>
                                      
                                      {/* Attached Files List */}
                                      <div className="flex-1">
                                        {(!phaseData.files || phaseData.files.length === 0) ? (
                                          <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider text-center py-2.5 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                            Belum Ada Lampiran
                                          </div>
                                        ) : (
                                          <ul className="space-y-1.5">
                                            {phaseData.files.map((file: any, fIdx: number) => {
                                              const meta = getFileItemMeta(file);
                                              return (
                                                <li 
                                                  key={fIdx} 
                                                  className={`group flex items-center justify-between p-1.5 px-2 rounded-xl bg-white border border-gray-200/80 shadow-2xs transition-all duration-150 ${meta.cardBg}`}
                                                >
                                                  <a 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="flex items-center gap-2 w-full pr-1 overflow-hidden" 
                                                    title={`Buka File: ${file.name}`}
                                                  >
                                                    <div className={`p-1 rounded-md border flex items-center justify-center shrink-0 ${meta.badgeColor}`}>
                                                      {meta.icon}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                      <div className="flex items-center gap-1">
                                                        <span className="text-[10px] font-bold text-gray-800 group-hover:text-indigo-600 truncate leading-tight">
                                                          {file.name}
                                                        </span>
                                                        <ExternalLink size={9} className="opacity-0 group-hover:opacity-60 text-gray-400 shrink-0" />
                                                      </div>
                                                      <div className="flex items-center gap-1 mt-0.5">
                                                        <span className={`px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider border ${meta.badgeColor}`}>
                                                          {meta.label}
                                                        </span>
                                                        {file.uploaded_at && (
                                                          <span className="text-[8px] text-gray-400 font-medium truncate">
                                                            {new Date(file.uploaded_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                  </a>

                                                  <div className="flex items-center gap-0.5 shrink-0">
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        openRenameModal(arc.id, arcPhaseIdx, fIdx, arcPhases, file.name);
                                                      }}
                                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                                                      title="Ubah Nama Tampilan File"
                                                    >
                                                      <Edit3 size={11} />
                                                    </button>
                                                    <button 
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(arc.id, arcPhaseIdx, fIdx, arcPhases);
                                                      }} 
                                                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-all cursor-pointer" 
                                                      title="Hapus File Lampiran"
                                                    >
                                                      <Trash2 size={11} />
                                                    </button>
                                                  </div>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      
                      {/* General Yearly Notes Row */}
                      <tr className="bg-amber-50/40 hover:bg-amber-50/60 transition-colors">
                        <td className="p-3.5 px-4 sticky left-0 bg-amber-50/90 border-r border-amber-200/80 shadow-2xs z-10 align-top">
                          <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                            <span>Catatan Umum Tahunan</span>
                          </h4>
                          <p className="text-[10px] text-amber-700/80 mt-0.5">Catatan rangkuman untuk keseluruhan kegiatan di tahun tersebut.</p>
                        </td>
                        {selectedYears.map((y: number) => {
                          const arc = archives.find(a => a.tahun === y && a.kategori_id === selectedCatId);
                          if (!arc) {
                             return <td key={`catatan-${y}`} className="p-3.5 px-4 border-r border-gray-100 text-center align-middle bg-gray-50/30"></td>;
                          }
                          return (
                            <td key={`catatan-${y}`} className="p-3 px-4 border-r border-amber-100 align-top">
                               <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">Isi Catatan {y}:</span>
                                  <button 
                                    onClick={() => { 
                                      setArcForm({ ...arc, fase_dokumen: typeof arc.fase_dokumen === 'string' ? JSON.parse(arc.fase_dokumen) : arc.fase_dokumen }); 
                                      setIsArcModalOpen(true); 
                                    }} 
                                    className="text-[9px] bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 px-2 py-0.5 rounded-md font-bold transition-all shadow-2xs cursor-pointer"
                                  >
                                    Edit
                                  </button>
                               </div>
                               <p className="text-[11px] text-amber-950 font-medium whitespace-pre-wrap leading-relaxed">
                                 {arc.catatan || <span className="text-amber-400 italic">Belum ada catatan umum...</span>}
                               </p>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 4. MODAL EDIT KATEGORI & TEMPLATE FASE STATIS */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 via-sky-50/50 to-white p-5 border-b border-gray-200/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    {catForm.id ? 'Edit Folder Kegiatan & Template Fase' : 'Buat Folder Kegiatan Baru'}
                  </h2>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Atur nama kegiatan dan tahapan fase statis yang berlaku untuk setiap tahun anggaran
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCatModalOpen(false)} 
                className="text-gray-400 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Body */}
            <form onSubmit={handleCatSave} className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  Nama Kegiatan Besar *
                </label>
                <input 
                  required 
                  type="text" 
                  value={catForm.nama_kegiatan} 
                  onChange={e => setCatForm({...catForm, nama_kegiatan: e.target.value})} 
                  className="w-full h-10 px-3.5 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 font-bold text-xs transition-all shadow-2xs" 
                  placeholder="Misal: Rencana Kerja dan Anggaran (RKA) Tahunan" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  Deskripsi / Keterangan Singkat
                </label>
                <input 
                  type="text" 
                  value={catForm.deskripsi} 
                  onChange={e => setCatForm({...catForm, deskripsi: e.target.value})} 
                  className="w-full h-10 px-3.5 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 font-medium text-xs transition-all shadow-2xs" 
                  placeholder="Deskripsi ruang lingkup kegiatan..."
                />
              </div>

              {/* Template Fase Manager */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-black text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Template Tahapan / Fase Dokumen</span>
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Fase ini otomatis terpasang saat membuka arsip tahun baru tanpa menghilangkan dokumen lama.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setCatForm({
                      ...catForm, 
                      template_fase: [...catForm.template_fase, { nama_fase: '', catatan_global: '', _old_nama: '' }]
                    })} 
                    className="h-8 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto transition-all"
                  >
                    <Plus size={13} /> Tambah Tahap
                  </button>
                </div>

                {/* Preset Chips Quick Loader */}
                <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Gunakan Template Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPresetPhases('rka')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-[10px] font-bold text-gray-700 hover:text-indigo-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>📑</span>
                      <span>RKA / RKAT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPhases('pengadaan')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-[10px] font-bold text-gray-700 hover:text-indigo-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>📦</span>
                      <span>Pengadaan & Kontrak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPhases('keuangan')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-[10px] font-bold text-gray-700 hover:text-indigo-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>💰</span>
                      <span>Laporan Keuangan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetPhases('umum')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-[10px] font-bold text-gray-700 hover:text-indigo-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <span>📁</span>
                      <span>Umum / Standar</span>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  {catForm.template_fase.map((faseObj, i) => (
                    <div key={i} className="flex gap-2.5 items-start bg-gray-50/80 border border-gray-200 rounded-2xl p-3 shadow-2xs transition-all hover:bg-white hover:border-indigo-200">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5 shrink-0 mt-1">
                        <button 
                          type="button" 
                          onClick={() => {
                            if (i === 0) return;
                            const newTpl = [...catForm.template_fase];
                            const temp = newTpl[i - 1];
                            newTpl[i - 1] = newTpl[i];
                            newTpl[i - 1]._old_nama = temp._old_nama;
                            newTpl[i] = temp;
                            setCatForm({...catForm, template_fase: newTpl});
                          }} 
                          disabled={i === 0} 
                          className="text-gray-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer rounded hover:bg-gray-100"
                          title="Geser ke Atas"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            if (i === catForm.template_fase.length - 1) return;
                            const newTpl = [...catForm.template_fase];
                            const temp = newTpl[i + 1];
                            newTpl[i + 1] = newTpl[i];
                            newTpl[i] = temp;
                            setCatForm({...catForm, template_fase: newTpl});
                          }} 
                          disabled={i === catForm.template_fase.length - 1} 
                          className="text-gray-400 hover:text-indigo-600 disabled:opacity-20 p-0.5 cursor-pointer rounded hover:bg-gray-100"
                          title="Geser ke Bawah"
                        >
                          <ChevronDown size={13} />
                        </button>
                      </div>

                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-black text-[10px] shrink-0 mt-1">
                        {i + 1}
                      </span>

                      <div className="flex-1 space-y-1.5">
                        <input 
                          type="text" 
                          value={faseObj.nama_fase} 
                          onChange={e => {
                            const newTpl = [...catForm.template_fase];
                            newTpl[i].nama_fase = e.target.value;
                            setCatForm({...catForm, template_fase: newTpl});
                          }} 
                          className="w-full h-8.5 px-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-bold text-xs" 
                          placeholder="Nama tahapan / dokumen..." 
                        />
                        <textarea
                          rows={1}
                          value={faseObj.catatan_global || ''}
                          onChange={e => {
                            const newTpl = [...catForm.template_fase];
                            newTpl[i].catatan_global = e.target.value;
                            setCatForm({...catForm, template_fase: newTpl});
                          }}
                          className="w-full p-2 bg-indigo-50/20 border border-indigo-100 rounded-xl outline-none focus:border-indigo-500 text-[10px] font-medium text-indigo-950 resize-none"
                          placeholder="Catatan panduan fase (opsional, muncul di semua tahun)..."
                        />
                      </div>

                      <button 
                        type="button" 
                        onClick={() => setCatForm({...catForm, template_fase: catForm.template_fase.filter((_, idx) => idx !== i)})} 
                        className="text-gray-300 hover:text-rose-600 p-1.5 mt-1 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Hapus Tahap Ini"
                      >
                        <X size={15}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="bg-gray-50/80 p-4 px-6 border-t border-gray-200 flex justify-end gap-2.5 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsCatModalOpen(false)} 
                className="h-9 px-4 font-bold text-gray-700 hover:bg-gray-200/70 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleCatSave} 
                className="h-9 px-5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5 shadow-xs text-xs cursor-pointer active:scale-95"
              >
                <Save size={14} /> Simpan Folder &amp; Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL ARSIP TAHUN (BUKA TAHUN BARU / EDIT CATATAN) */}
      {isArcModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-indigo-50 to-white p-5 border-b border-gray-200/80 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    {arcForm.id ? `Edit Catatan Tahun ${arcForm.tahun}` : 'Buka Arsip Tahun Baru'}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    {categories.find(c => c.id === arcForm.kategori_id)?.nama_kegiatan || 'Folder Kegiatan'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsArcModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleArcSave} className="p-5 space-y-4 text-xs">
              {!arcForm.id && (
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                    Pilih Tahun Cepat
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[2027, 2026, 2025, 2024, 2023].map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setArcForm({ ...arcForm, tahun: y })}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          arcForm.tahun === y
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  Tahun Anggaran *
                </label>
                <input 
                  disabled={!!arcForm.id} 
                  required 
                  type="number" 
                  value={arcForm.tahun} 
                  onChange={e => setArcForm({...arcForm, tahun: parseInt(e.target.value) || new Date().getFullYear()})} 
                  className="w-full h-10 px-3.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-xs outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed shadow-2xs" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  Catatan Umum Tahunan (Opsional)
                </label>
                <textarea 
                  rows={3} 
                  value={arcForm.catatan} 
                  onChange={e => setArcForm({...arcForm, catatan: e.target.value})} 
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-medium text-xs outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 resize-none shadow-2xs" 
                  placeholder="Catatan ringkas mengenai kegiatan di tahun ini..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsArcModalOpen(false)} 
                  className="h-9 px-4 font-bold text-gray-600 hover:bg-gray-100 rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="h-9 px-5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <Save size={14} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL TAMBAH TAUTAN GOOGLE DRIVE / CLOUD (MENGGANTIKAN WINDOW.PROMPT) */}
      {linkModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-50 via-indigo-50/40 to-white p-5 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-600 text-white rounded-2xl shadow-xs">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    Tambah Tautan Berkas Online
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Tahap: <span className="font-bold text-sky-700">{linkModal.phaseName}</span> • Tahun {linkModal.tahun}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setLinkModal(prev => ({ ...prev, isOpen: false }))} 
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Helper Deteksi Format Link Cerdas */}
            {(() => {
              const url = (linkModal.url || '').trim();
              let detected = null;
              if (url) {
                if (url.includes('docs.google.com/spreadsheets')) {
                  detected = {
                    type: 'sheets',
                    label: 'Google Sheets (Spreadsheet)',
                    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    cardBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
                    icon: <FileSpreadsheet size={18} className="text-emerald-600" />
                  };
                } else if (url.includes('docs.google.com/document')) {
                  detected = {
                    type: 'docs',
                    label: 'Google Docs (Dokumen Teks)',
                    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
                    cardBg: 'bg-blue-50/70 border-blue-200 text-blue-900',
                    icon: <FileText size={18} className="text-blue-600" />
                  };
                } else if (url.includes('drive.google.com/drive/folders')) {
                  detected = {
                    type: 'folder',
                    label: 'Google Drive (Folder Bersama)',
                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
                    cardBg: 'bg-amber-50/70 border-amber-200 text-amber-900',
                    icon: <Folder size={18} className="text-amber-600" />
                  };
                } else if (url.includes('drive.google.com')) {
                  detected = {
                    type: 'file',
                    label: 'Google Drive (Berkas Cloud)',
                    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
                    cardBg: 'bg-sky-50/70 border-sky-200 text-sky-900',
                    icon: <Globe size={18} className="text-sky-600" />
                  };
                } else if (url.includes('onedrive') || url.includes('sharepoint.com')) {
                  detected = {
                    type: 'onedrive',
                    label: 'OneDrive / SharePoint Cloud',
                    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                    cardBg: 'bg-indigo-50/70 border-indigo-200 text-indigo-900',
                    icon: <Globe size={18} className="text-indigo-600" />
                  };
                } else {
                  detected = {
                    type: 'web',
                    label: 'Tautan Berkas Web / URL Eksternal',
                    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
                    cardBg: 'bg-slate-50 border-slate-200 text-slate-900',
                    icon: <Globe size={18} className="text-slate-600" />
                  };
                }
              }

              // Bersihkan URL dari parameter tracking
              const cleanUrlString = (raw: string) => {
                try {
                  const u = new URL(raw.trim());
                  u.searchParams.delete('usp');
                  u.searchParams.delete('usp_drivesdk');
                  u.searchParams.delete('authuser');
                  return u.toString();
                } catch {
                  return raw.trim();
                }
              };

              return (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Simpan dengan URL yang bersih
                  setLinkModal(prev => ({ ...prev, url: cleanUrlString(prev.url) }));
                  handleSaveLink(e);
                }} className="p-5 space-y-4 text-xs">
                  {/* URL Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                        URL Google Drive / Cloud Link *
                      </label>
                      {detected && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${detected.badgeColor}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{detected.label}</span>
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <LinkIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        required 
                        autoFocus
                        type="url" 
                        value={linkModal.url} 
                        onChange={e => {
                          const val = e.target.value;
                          setLinkModal(prev => {
                            // Jika nama berkas masih kosong, beri nama default otomatis
                            const autoName = prev.name || `${prev.phaseName || 'Dokumen'} - ${prev.catName} (${prev.tahun})`;
                            return { ...prev, url: val, name: autoName };
                          });
                        }} 
                        className="w-full h-10 pl-9 pr-3.5 bg-gray-50 border border-gray-300 rounded-xl font-medium text-xs outline-none focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs" 
                        placeholder="https://drive.google.com/file/d/... atau https://docs.google.com/spreadsheets/..." 
                      />
                    </div>

                    {/* Live Preview Card Link Terdeteksi */}
                    {detected && (
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${detected.cardBg}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-lg bg-white border border-black/5 shadow-2xs shrink-0">
                            {detected.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] truncate">{detected.label}</p>
                            <p className="text-[10px] opacity-75 font-mono truncate max-w-sm">
                              {cleanUrlString(linkModal.url)}
                            </p>
                          </div>
                        </div>

                        {linkModal.url.includes('?') && (
                          <button
                            type="button"
                            onClick={() => setLinkModal(prev => ({ ...prev, url: cleanUrlString(prev.url) }))}
                            className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-[9px] font-bold shrink-0 hover:bg-gray-100 transition-colors shadow-2xs"
                            title="Bersihkan parameter pelacak Google Drive"
                          >
                            Bersihkan URL
                          </button>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400">
                      Mendukung Google Drive Folder, Spreadsheet, Dokumen, OneDrive, maupun tautan web publik lainnya.
                    </p>
                  </div>

                  {/* Display Name Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                        Nama Tampilan Berkas / Lampiran *
                      </label>
                      <button
                        type="button"
                        onClick={() => setLinkModal(prev => ({
                          ...prev,
                          name: `${prev.phaseName || 'Dokumen'} - ${prev.catName} (${prev.tahun})`
                        }))}
                        className="text-[10px] text-sky-600 hover:text-sky-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        title="Buat nama otomatis berdasarkan tahapan dan kegiatan"
                      >
                        <Sparkles size={11} />
                        <span>Isi Nama Otomatis</span>
                      </button>
                    </div>

                    <div className="relative">
                      <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        required 
                        type="text" 
                        value={linkModal.name} 
                        onChange={e => setLinkModal(prev => ({ ...prev, name: e.target.value }))} 
                        className="w-full h-10 pl-9 pr-3.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-xs outline-none focus:border-sky-600 focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs" 
                        placeholder="Contoh: Dokumen RAB & Kerangka Acuan Kerja 2026" 
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => setLinkModal(prev => ({ ...prev, isOpen: false }))} 
                      className="h-9 px-4 font-bold text-gray-600 hover:bg-gray-100 rounded-xl text-xs cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={linkModal.isSaving}
                      className="h-9 px-5 font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {linkModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>Simpan Tautan</span>
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* 7. MODAL UNGGAH BERKAS DENGAN DRAG & DROP ELEGAN */}
      {uploadModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50/40 to-white p-5 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
                  <CloudUpload size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    Unggah Berkas Lampiran
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Tahap: <span className="font-bold text-indigo-700">{uploadModal.phaseName}</span> • Tahun {uploadModal.tahun}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setUploadModal(prev => ({ ...prev, isOpen: false }))} 
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProcessUpload} className="p-5 space-y-4 text-xs">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setUploadModal(prev => ({ ...prev, isDragging: true }));
                }}
                onDragLeave={() => setUploadModal(prev => ({ ...prev, isDragging: false }))}
                onDrop={(e) => {
                  e.preventDefault();
                  setUploadModal(prev => ({ ...prev, isDragging: false }));
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) {
                    setUploadModal(prev => ({ 
                      ...prev, 
                      file: dropped,
                      customName: prev.customName || dropped.name
                    }));
                  }
                }}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  uploadModal.isDragging 
                    ? 'border-indigo-600 bg-indigo-50/60 ring-4 ring-indigo-100' 
                    : uploadModal.file 
                    ? 'border-emerald-300 bg-emerald-50/30' 
                    : 'border-gray-300 hover:border-indigo-400 bg-gray-50/50 hover:bg-indigo-50/20'
                }`}
                onClick={() => {
                  const el = document.getElementById('drag-drop-file-input');
                  el?.click();
                }}
              >
                <input 
                  id="drag-drop-file-input"
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    const picked = e.target.files?.[0];
                    if (picked) {
                      setUploadModal(prev => ({ 
                        ...prev, 
                        file: picked,
                        customName: prev.customName || picked.name
                      }));
                    }
                  }} 
                />

                {!uploadModal.file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <CloudUpload size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-800">
                        Seret &amp; Lepaskan berkas di sini, atau <span className="text-indigo-600 underline">klik untuk memilih</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Format: PDF, Excel, Word, Foto, ZIP • Maksimal 50MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0 text-left">
                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">{uploadModal.file.name}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">
                          {(uploadModal.file.size / 1024 / 1024).toFixed(2)} MB • Siap diunggah
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadModal(prev => ({ ...prev, file: null }));
                      }}
                      className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Ganti Berkas"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* Custom Display Name (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  Nama Tampilan Berkas (Opsional)
                </label>
                <input 
                  type="text" 
                  value={uploadModal.customName} 
                  onChange={e => setUploadModal(prev => ({ ...prev, customName: e.target.value }))} 
                  className="w-full h-10 px-3.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-xs outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs" 
                  placeholder={uploadModal.file ? uploadModal.file.name : "Nama tampilan berkas di sistem..."} 
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setUploadModal(prev => ({ ...prev, isOpen: false }))} 
                  className="h-9 px-4 font-bold text-gray-600 hover:bg-gray-100 rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={!uploadModal.file || uploadModal.isUploading}
                  className="h-9 px-5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {uploadModal.isUploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Sedang Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload size={14} />
                      <span>Unggah Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL UBAH NAMA BERKAS (MENGGANTIKAN WINDOW.PROMPT) */}
      {renameModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-indigo-50 to-white p-5 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    Ubah Nama Tampilan Berkas
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">Sesuaikan label judul berkas agar mudah dicari</p>
                </div>
              </div>
              <button 
                onClick={() => setRenameModal(prev => ({ ...prev, isOpen: false }))} 
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  Nama Berkas Baru *
                </label>
                <input 
                  required 
                  autoFocus
                  type="text" 
                  value={renameModal.newName} 
                  onChange={e => setRenameModal(prev => ({ ...prev, newName: e.target.value }))} 
                  className="w-full h-10 px-3.5 bg-gray-50 border border-gray-300 rounded-xl font-bold text-xs outline-none focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs" 
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setRenameModal(prev => ({ ...prev, isOpen: false }))} 
                  className="h-9 px-4 font-bold text-gray-600 hover:bg-gray-100 rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={renameModal.isSaving}
                  className="h-9 px-5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {renameModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Perbarui Nama</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL EDIT CATATAN FASE (MENGGANTIKAN WINDOW.PROMPT) */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-gray-200 animate-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-amber-50 to-white p-5 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                    Catatan Tahap Dokumen
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Tahap: <span className="font-bold text-amber-800">{noteModal.phaseName}</span> • Tahun {noteModal.tahun}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setNoteModal(prev => ({ ...prev, isOpen: false }))} 
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  Isi Catatan Khusus Tahap Ini
                </label>
                <textarea 
                  rows={4} 
                  autoFocus
                  value={noteModal.catatan} 
                  onChange={e => setNoteModal(prev => ({ ...prev, catatan: e.target.value }))} 
                  className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl font-medium text-xs outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100 resize-none shadow-2xs" 
                  placeholder="Ketik catatan panduan, tindak lanjut, atau progres berkas..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setNoteModal(prev => ({ ...prev, isOpen: false }))} 
                  className="h-9 px-4 font-bold text-gray-600 hover:bg-gray-100 rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={noteModal.isSaving}
                  className="h-9 px-5 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {noteModal.isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Simpan Catatan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
