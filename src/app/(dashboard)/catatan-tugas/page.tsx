'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ListTodo, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  Image as ImageIcon, 
  Paperclip, 
  Trash2, 
  Edit3, 
  X, 
  Upload, 
  Download, 
  Eye, 
  Sparkles,
  Layers,
  Tag,
  User,
  ArrowUpRight,
  Database,
  Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TaskLink {
  title: string;
  url: string;
}

interface TaskScreenshot {
  url: string;
  caption?: string;
  created_at?: string;
}

interface TaskDocument {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

interface TaskItem {
  id: number | string;
  judul: string;
  deskripsi?: string | null;
  kategori?: string | null;
  prioritas?: 'Rendah' | 'Sedang' | 'Tinggi' | 'Urgent';
  status: 'Belum Dikerjakan' | 'Sedang Dikerjakan' | 'Selesai' | 'Ditunda';
  deadline?: string | null;
  pic?: string | null;
  catatan?: string | null;
  links: TaskLink[];
  screenshots: TaskScreenshot[];
  dokumen: TaskDocument[];
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

const KATEGORI_OPTIONS = [
  'Umum',
  'Verifikasi Kas',
  'Anggaran & Pagu',
  'Penerimaan',
  'Persuratan & SK',
  'Rapat & Koordinasi',
  'Laporan & Evaluasi'
];

const PRIORITAS_CONFIG = {
  Urgent: { label: 'Urgent', bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  Tinggi: { label: 'Tinggi', bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  Sedang: { label: 'Sedang', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  Rendah: { label: 'Rendah', bg: 'bg-slate-50 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
};

const STATUS_CONFIG = {
  'Belum Dikerjakan': { label: 'Belum Dikerjakan', bg: 'bg-gray-100 text-gray-700 border-gray-200' },
  'Sedang Dikerjakan': { label: 'Sedang Dikerjakan', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
  'Selesai': { label: 'Selesai', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Ditunda': { label: 'Ditunda', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function CatatanTugasPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterPrioritas, setFilterPrioritas] = useState<string>('Semua');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [dbFallback, setDbFallback] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox Zoom Modal for Screenshot
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State
  const [formJudul, setFormJudul] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formKategori, setFormKategori] = useState('Umum');
  const [formPrioritas, setFormPrioritas] = useState<'Rendah' | 'Sedang' | 'Tinggi' | 'Urgent'>('Sedang');
  const [formStatus, setFormStatus] = useState<'Belum Dikerjakan' | 'Sedang Dikerjakan' | 'Selesai' | 'Ditunda'>('Belum Dikerjakan');
  const [formDeadline, setFormDeadline] = useState('');
  const [formPic, setFormPic] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formLinks, setFormLinks] = useState<TaskLink[]>([]);
  const [formScreenshots, setFormScreenshots] = useState<TaskScreenshot[]>([]);
  const [formDokumen, setFormDokumen] = useState<TaskDocument[]>([]);

  // Helper inputs for adding links/files
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch data
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_tasks')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        // Fallback to localStorage if table doesn't exist yet
        console.warn('Supabase app_tasks not available, using local cache:', error.message);
        setDbFallback(true);
        const cached = localStorage.getItem('app_tasks_backup');
        if (cached) {
          try {
            setTasks(JSON.parse(cached));
          } catch {
            setTasks([]);
          }
        }
      } else if (data) {
        setTasks(data);
        localStorage.setItem('app_tasks_backup', JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Fetch tasks error:', err);
      const cached = localStorage.getItem('app_tasks_backup');
      if (cached) {
        try { setTasks(JSON.parse(cached)); } catch { setTasks([]); }
      }
    } finally {
      setLoading(false);
    }
  };

  // Clipboard Paste Listener (Ctrl + V) when modal is open to auto-add screenshot
  useEffect(() => {
    if (!isModalOpen) return;
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await uploadScreenshotFile(file, 'Screenshot Clipboard');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isModalOpen]);

  // Upload file handler to Cloudflare R2
  const uploadToFileServer = async (file: File, folder = 'tasks/dokumen'): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.publicUrl) {
        return json.publicUrl;
      } else {
        throw new Error(json.error || 'Gagal mengupload file ke server');
      }
    } catch (err: any) {
      console.warn('Upload API failed, converting to local blob URL:', err.message);
      // Fallback to local Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }
  };

  // Upload Screenshot Handler
  const uploadScreenshotFile = async (file: File, defaultCaption?: string) => {
    setUploadingFile(true);
    setUploadProgressText('Mengupload screenshot...');
    try {
      const url = await uploadToFileServer(file, 'tasks/screenshots');
      if (url) {
        const newSS: TaskScreenshot = {
          url,
          caption: defaultCaption || file.name || 'Screenshot',
          created_at: new Date().toISOString()
        };
        setFormScreenshots(prev => [...prev, newSS]);
      }
    } catch (err: any) {
      alert('Gagal mengupload screenshot: ' + err.message);
    } finally {
      setUploadingFile(false);
      setUploadProgressText('');
    }
  };

  // Upload Document Handler
  const uploadDocFile = async (file: File) => {
    setUploadingFile(true);
    setUploadProgressText(`Mengupload ${file.name}...`);
    try {
      const url = await uploadToFileServer(file, 'tasks/dokumen');
      if (url) {
        const newDoc: TaskDocument = {
          name: file.name,
          url,
          size: file.size,
          type: file.name.split('.').pop()?.toLowerCase() || 'file'
        };
        setFormDokumen(prev => [...prev, newDoc]);
      }
    } catch (err: any) {
      alert('Gagal mengupload dokumen: ' + err.message);
    } finally {
      setUploadingFile(false);
      setUploadProgressText('');
    }
  };

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormJudul('');
    setFormDeskripsi('');
    setFormKategori('Umum');
    setFormPrioritas('Sedang');
    setFormStatus('Belum Dikerjakan');
    setFormDeadline('');
    setFormPic('');
    setFormCatatan('');
    setFormLinks([]);
    setFormScreenshots([]);
    setFormDokumen([]);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setFormJudul(task.judul);
    setFormDeskripsi(task.deskripsi || '');
    setFormKategori(task.kategori || 'Umum');
    setFormPrioritas(task.prioritas || 'Sedang');
    setFormStatus(task.status);
    setFormDeadline(task.deadline || '');
    setFormPic(task.pic || '');
    setFormCatatan(task.catatan || '');
    setFormLinks(Array.isArray(task.links) ? [...task.links] : []);
    setFormScreenshots(Array.isArray(task.screenshots) ? [...task.screenshots] : []);
    setFormDokumen(Array.isArray(task.dokumen) ? [...task.dokumen] : []);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsModalOpen(true);
  };

  // Save Task
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul.trim()) {
      alert('Judul tugas wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      judul: formJudul.trim(),
      deskripsi: formDeskripsi.trim() || null,
      kategori: formKategori,
      prioritas: formPrioritas,
      status: formStatus,
      deadline: formDeadline || null,
      pic: formPic.trim() || null,
      catatan: formCatatan.trim() || null,
      links: formLinks,
      screenshots: formScreenshots,
      dokumen: formDokumen,
      updated_at: new Date().toISOString()
    };

    try {
      if (editingTask) {
        // UPDATE
        const { error } = await supabase
          .from('app_tasks')
          .update(payload)
          .eq('id', editingTask.id);

        if (error) {
          // Local fallback
          setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...payload } : t));
          localStorage.setItem('app_tasks_backup', JSON.stringify(tasks));
        }
      } else {
        // INSERT
        const newRecord = {
          ...payload,
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('app_tasks')
          .insert([newRecord])
          .select();

        if (error || !data || data.length === 0) {
          // Local fallback
          const localItem: TaskItem = {
            id: Date.now(),
            ...newRecord
          };
          setTasks(prev => [localItem, ...prev]);
          localStorage.setItem('app_tasks_backup', JSON.stringify([localItem, ...tasks]));
        }
      }

      setIsModalOpen(false);
      loadTasks();
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Gagal menyimpan tugas: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Task
  const handleDelete = async (id: number | string) => {
    if (!confirm('Yakin ingin menghapus catatan tugas ini?')) return;
    try {
      await supabase.from('app_tasks').delete().eq('id', id);
      setTasks(prev => prev.filter(t => t.id !== id));
      localStorage.setItem('app_tasks_backup', JSON.stringify(tasks.filter(t => t.id !== id)));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Toggle Quick Status Complete
  const handleToggleComplete = async (task: TaskItem) => {
    const nextStatus = task.status === 'Selesai' ? 'Belum Dikerjakan' : 'Selesai';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));

    try {
      await supabase
        .from('app_tasks')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', task.id);
    } catch (err) {
      console.warn('Quick status update local fallback:', err);
    }
  };

  // Link Add Handler
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    let url = newLinkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const title = newLinkTitle.trim() || url;
    setFormLinks(prev => [...prev, { title, url }]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  // Filter and Search Logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.deskripsi && t.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.catatan && t.catatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.pic && t.pic.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'Semua' || t.status === filterStatus;
    const matchesPrioritas = filterPrioritas === 'Semua' || t.prioritas === filterPrioritas;
    const matchesKategori = filterKategori === 'Semua' || t.kategori === filterKategori;

    return matchesSearch && matchesStatus && matchesPrioritas && matchesKategori;
  });

  // KPI Calculations
  const countTotal = tasks.length;
  const countSelesai = tasks.filter(t => t.status === 'Selesai').length;
  const countPending = tasks.filter(t => t.status === 'Belum Dikerjakan' || t.status === 'Sedang Dikerjakan').length;
  const countUrgent = tasks.filter(t => (t.prioritas === 'Urgent' || t.prioritas === 'Tinggi') && t.status !== 'Selesai').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* DB MIGRATION BANNER (If table not migrated yet) */}
      {dbFallback && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Database className="shrink-0 mt-0.5 text-amber-600" size={18} />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Mode Penyimpanan Lokal Aktif</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Tabel database <code>app_tasks</code> belum dijalankan di SQL editor Supabase. Data tugas Anda saat ini tersimpan aman di browser (localStorage). Jalankan script <code>supabase_tasks_migration.sql</code> untuk sinkronisasi multi-user.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest">
            <ListTodo size={16} className="text-indigo-400" />
            <span>Manajemen Kegiatan</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Catatan & Tugas Kerja</h1>
          <p className="text-indigo-200/80 text-xs md:text-sm max-w-xl">
            Pencatatan tugas harian, pengingat deadline, penyimpanan tautan hasil kerja, tangkapan layar (screenshot), dan arsip dokumen pendukung.
          </p>
        </div>

        <div className="z-10 flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-black px-5 py-3 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all hover:scale-105 text-xs md:text-sm shrink-0 cursor-pointer"
          >
            <Plus size={18} /> Tambah Tugas Baru
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tugas</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{countTotal}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Tugas Aktif</p>
            <p className="text-2xl font-black text-sky-900 mt-1">{countPending}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Selesai</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{countSelesai}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Prioritas / Urgent</p>
            <p className="text-2xl font-black text-rose-900 mt-1">{countUrgent}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Cari tugas, catatan, PIC..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white text-xs font-bold text-gray-800 transition-all"
          />
        </div>

        {/* Filter Status */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="Semua">Semua Status</option>
          <option value="Belum Dikerjakan">⏳ Belum Dikerjakan</option>
          <option value="Sedang Dikerjakan">⚡ Sedang Dikerjakan</option>
          <option value="Selesai">✅ Selesai</option>
          <option value="Ditunda">⏸️ Ditunda</option>
        </select>

        {/* Filter Prioritas */}
        <select
          value={filterPrioritas}
          onChange={e => setFilterPrioritas(e.target.value)}
          className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="Semua">Semua Prioritas</option>
          <option value="Urgent">🔥 Urgent</option>
          <option value="Tinggi">⚡ Tinggi</option>
          <option value="Sedang">⭐ Sedang</option>
          <option value="Rendah">☕ Rendah</option>
        </select>

        {/* Filter Kategori */}
        <select
          value={filterKategori}
          onChange={e => setFilterKategori(e.target.value)}
          className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="Semua">Semua Kategori</option>
          {KATEGORI_OPTIONS.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Kartu
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
          >
            Tabel
          </button>
        </div>
      </div>

      {/* TASK LIST CONTENT */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs">
            <ListTodo size={32} />
          </div>
          <h3 className="text-base font-black text-gray-800">Belum Ada Tugas Ditemukan</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Tidak ada tugas yang sesuai dengan filter atau kata kunci pencarian Anda. Klik tombol Tambah Tugas Baru untuk mulai mencatat.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-transform hover:scale-105"
          >
            + Buat Tugas Baru
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'Selesai';
            const prioritasInfo = PRIORITAS_CONFIG[task.prioritas || 'Sedang'];
            const statusInfo = STATUS_CONFIG[task.status || 'Belum Dikerjakan'];

            const hasOverdue = task.deadline && new Date(task.deadline) < new Date(new Date().setHours(0,0,0,0)) && !isCompleted;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden group ${isCompleted ? 'border-gray-200/80 opacity-85' : 'border-gray-200 shadow-xs'}`}
              >
                <div className="p-5 space-y-3 flex-1">
                  
                  {/* Badges row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                      {task.kategori || 'Umum'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 ${prioritasInfo?.bg || 'bg-gray-50 text-gray-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${prioritasInfo?.dot || 'bg-gray-400'}`} />
                        {task.prioritas || 'Sedang'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${statusInfo?.bg || 'bg-gray-100 text-gray-700'}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Checkbox */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className="mt-0.5 text-gray-400 hover:text-emerald-600 transition-colors shrink-0"
                      title={isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={18} className="text-emerald-600 fill-emerald-50" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    <h3 className={`text-sm font-black leading-snug break-words flex-1 ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.judul}
                    </h3>
                  </div>

                  {/* Description / Catatan */}
                  {(task.deskripsi || task.catatan) && (
                    <p className="text-xs text-gray-600 whitespace-pre-wrap break-words line-clamp-3 leading-relaxed">
                      {task.deskripsi || task.catatan}
                    </p>
                  )}

                  {/* Meta details: Deadline & PIC */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-gray-500 font-medium">
                    {task.deadline && (
                      <div className={`flex items-center gap-1 font-bold ${hasOverdue ? 'text-rose-600' : 'text-gray-600'}`}>
                        <Calendar size={13} />
                        <span>{task.deadline}</span>
                        {hasOverdue && <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded">Lewat</span>}
                      </div>
                    )}
                    {task.pic && (
                      <div className="flex items-center gap-1 text-gray-600 font-bold">
                        <User size={13} />
                        <span>{task.pic}</span>
                      </div>
                    )}
                  </div>

                  {/* ATTACHMENTS PREVIEW (Links, Screenshots, Docs) */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    
                    {/* Multi-Links */}
                    {task.links && task.links.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Tautan / Link:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {task.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors border border-indigo-100/80 truncate max-w-full"
                              title={link.url}
                            >
                              <ExternalLink size={11} className="shrink-0" />
                              <span className="truncate max-w-[180px]">{link.title || link.url}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Screenshots Gallery */}
                    {task.screenshots && task.screenshots.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Screenshots ({task.screenshots.length}):</span>
                        <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                          {task.screenshots.map((ss, sIdx) => (
                            <div
                              key={sIdx}
                              onClick={() => setPreviewImage(ss.url)}
                              className="w-16 h-12 rounded-lg border border-gray-200 overflow-hidden shrink-0 cursor-pointer relative group/ss bg-gray-50"
                              title="Klik untuk memperbesar screenshot"
                            >
                              <img src={ss.url} alt={ss.caption || 'SS'} className="w-full h-full object-cover group-hover/ss:scale-110 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/ss:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye size={12} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dokumen Lampiran */}
                    {task.dokumen && task.dokumen.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Dokumen Lampiran ({task.dokumen.length}):</span>
                        <div className="flex flex-col gap-1">
                          {task.dokumen.map((doc, dIdx) => (
                            <a
                              key={dIdx}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="flex items-center justify-between p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[11px] font-bold text-gray-700 transition-colors border border-gray-200/60"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Paperclip size={12} className="text-gray-400 shrink-0" />
                                <span className="truncate">{doc.name}</span>
                              </div>
                              <Download size={12} className="text-gray-400 hover:text-indigo-600 shrink-0 ml-1" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {task.created_at ? new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                      title="Edit tugas"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                      title="Hapus tugas"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-wider">
                  <th className="p-3.5 w-10 text-center">✓</th>
                  <th className="p-3.5">Judul Tugas</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Prioritas</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Deadline</th>
                  <th className="p-3.5">PIC</th>
                  <th className="p-3.5">Lampiran</th>
                  <th className="p-3.5 w-20 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map(task => {
                  const isCompleted = task.status === 'Selesai';
                  const prioritasInfo = PRIORITAS_CONFIG[task.prioritas || 'Sedang'];
                  const statusInfo = STATUS_CONFIG[task.status || 'Belum Dikerjakan'];

                  return (
                    <tr key={task.id} className={`hover:bg-gray-50/80 transition-colors ${isCompleted ? 'bg-gray-50/30 text-gray-400' : ''}`}>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(task)}
                          className="text-gray-400 hover:text-emerald-600 transition-colors"
                        >
                          {isCompleted ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Circle size={16} />}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900 break-words">{task.judul}</div>
                        {task.deskripsi && <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{task.deskripsi}</div>}
                      </td>
                      <td className="p-3.5 font-bold text-gray-600">{task.kategori || 'Umum'}</td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${prioritasInfo?.bg}`}>
                          {task.prioritas || 'Sedang'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${statusInfo?.bg}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-gray-600">{task.deadline || '-'}</td>
                      <td className="p-3.5 font-bold text-gray-700">{task.pic || '-'}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                          {task.links && task.links.length > 0 && <span title={`${task.links.length} Link`}>🔗 {task.links.length}</span>}
                          {task.screenshots && task.screenshots.length > 0 && <span title={`${task.screenshots.length} Screenshot`}>📸 {task.screenshots.length}</span>}
                          {task.dokumen && task.dokumen.length > 0 && <span title={`${task.dokumen.length} Dokumen`}>📎 {task.dokumen.length}</span>}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleOpenEdit(task)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit3 size={13} /></button>
                          <button onClick={() => handleDelete(task.id)} className="p-1 text-gray-400 hover:text-rose-600"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT TUGAS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div ref={modalRef} className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gray-50 p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ListTodo size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-800">
                    {editingTask ? 'Edit Catatan Tugas' : 'Tambah Catatan Tugas Baru'}
                  </h2>
                  <p className="text-[11px] text-gray-500">Isi detail kegiatan, lampiran link, tangkapan layar, dan berkas kerja.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-xs transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Judul Tugas */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
                  Judul Tugas / Catatan Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={e => setFormJudul(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Anggaran dengan UPU..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-900 text-xs"
                />
              </div>

              {/* Grid Baris: Kategori, Prioritas, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Kategori</label>
                  <select
                    value={formKategori}
                    onChange={e => setFormKategori(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {KATEGORI_OPTIONS.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Prioritas</label>
                  <select
                    value={formPrioritas}
                    onChange={e => setFormPrioritas(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Rendah">☕ Rendah</option>
                    <option value="Sedang">⭐ Sedang</option>
                    <option value="Tinggi">⚡ Tinggi</option>
                    <option value="Urgent">🔥 Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Belum Dikerjakan">⏳ Belum Dikerjakan</option>
                    <option value="Sedang Dikerjakan">⚡ Sedang Dikerjakan</option>
                    <option value="Selesai">✅ Selesai</option>
                    <option value="Ditunda">⏸️ Ditunda</option>
                  </select>
                </div>
              </div>

              {/* Grid Baris: Deadline & PIC */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Batas Waktu (Deadline)</label>
                  <input
                    type="date"
                    value={formDeadline}
                    onChange={e => setFormDeadline(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Penanggung Jawab (PIC)</label>
                  <input
                    type="text"
                    value={formPic}
                    onChange={e => setFormPic(e.target.value)}
                    placeholder="Nama PIC pelaksana tugas..."
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Deskripsi & Catatan */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Catatan / Rincian Pekerjaan</label>
                <textarea
                  rows={3}
                  value={formCatatan}
                  onChange={e => setFormCatatan(e.target.value)}
                  placeholder="Catatan instruksi, poin-poin pembahasan, hal-hal penting..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-indigo-500"
                />
              </div>

              {/* FASILITAS INPUT 1: MULTI-LINK */}
              <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink size={14} className="text-indigo-600" /> Tautan / Link Kerja
                  </h4>
                  <span className="text-[10px] text-indigo-600 font-bold">{formLinks.length} Tautan Ditambahkan</span>
                </div>

                {/* Input New Link */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Judul / Label link (misal: Google Drive / Spreadsheet)..."
                    value={newLinkTitle}
                    onChange={e => setNewLinkTitle(e.target.value)}
                    className="flex-1 p-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-gray-800 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newLinkUrl}
                    onChange={e => setNewLinkUrl(e.target.value)}
                    className="flex-1 p-2 bg-white border border-indigo-200 rounded-lg text-xs font-mono text-gray-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg text-xs shrink-0 cursor-pointer"
                  >
                    + Tambah Link
                  </button>
                </div>

                {/* List of Links */}
                {formLinks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {formLinks.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-100 text-xs">
                        <div className="flex items-center gap-2 truncate flex-1">
                          <ExternalLink size={12} className="text-indigo-500 shrink-0" />
                          <span className="font-bold text-gray-800">{item.title}</span>
                          <span className="text-[11px] text-gray-400 truncate max-w-[240px]">({item.url})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormLinks(prev => prev.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-rose-600 ml-2 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FASILITAS INPUT 2: SCREENSHOT (Ctrl+V PASTE & UPLOAD) */}
              <div className="bg-sky-50/40 p-4 rounded-2xl border border-sky-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-sky-600" /> Tangkapan Layar / Screenshot (SS)
                  </h4>
                  <span className="text-[10px] text-sky-700 font-bold">Bisa Paste (Ctrl + V)</span>
                </div>

                {/* Paste Area / Upload Area */}
                <div 
                  className="border-2 border-dashed border-sky-200 hover:border-sky-400 bg-white rounded-xl p-4 text-center cursor-pointer transition-all"
                  onClick={() => {
                    const input = document.getElementById('task-ss-file');
                    if (input) input.click();
                  }}
                >
                  <input
                    id="task-ss-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) uploadScreenshotFile(file);
                    }}
                  />
                  <ImageIcon size={20} className="text-sky-500 mx-auto mb-1" />
                  <p className="text-xs font-black text-sky-950">
                    Klik untuk upload gambar atau tekan <span className="bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-mono">Ctrl + V</span> di keyboard
                  </p>
                  <p className="text-[10px] text-sky-700 mt-0.5">Mendukung format PNG, JPG, JPEG, WEBP</p>
                </div>

                {/* Screenshot Thumbnails List */}
                {formScreenshots.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                    {formScreenshots.map((ss, idx) => (
                      <div key={idx} className="relative group/thumb border border-sky-200 rounded-xl overflow-hidden bg-white aspect-video">
                        <img src={ss.url} alt={ss.caption || 'SS'} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(ss.url)}
                            className="p-1 bg-white/80 hover:bg-white text-gray-800 rounded-md"
                            title="Zoom"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormScreenshots(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md"
                            title="Hapus"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* FASILITAS INPUT 3: FILE DOKUMEN (PDF, WORD, EXCEL, DLL) */}
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip size={14} className="text-emerald-600" /> Berkas / File Dokumen Pendukung
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-bold">{formDokumen.length} Dokumen</span>
                </div>

                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                    <Upload size={13} /> Pilih File Dokumen (PDF, Word, Excel, ZIP)
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const files = e.target.files;
                        if (files) {
                          Array.from(files).forEach(f => uploadDocFile(f));
                        }
                      }}
                    />
                  </label>
                  {uploadingFile && (
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      {uploadProgressText}
                    </span>
                  )}
                </div>

                {/* Document List */}
                {formDokumen.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {formDokumen.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-100 text-xs">
                        <div className="flex items-center gap-2 truncate flex-1">
                          <FileText size={14} className="text-emerald-600 shrink-0" />
                          <span className="font-bold text-gray-800 truncate">{doc.name}</span>
                          {doc.size && (
                            <span className="text-[10px] text-gray-400">({Math.round(doc.size / 1024)} KB)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Unduh file"
                          >
                            <Download size={13} />
                          </a>
                          <button
                            type="button"
                            onClick={() => setFormDokumen(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-gray-400 hover:text-rose-600"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 flex justify-between items-center border-t border-gray-100">
                <div>
                  {editingTask && (
                    <button
                      type="button"
                      onClick={() => {
                        handleDelete(editingTask.id);
                        setIsModalOpen(false);
                      }}
                      className="px-4 py-2.5 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
                    >
                      <Trash2 size={14} /> Hapus Tugas
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black transition-transform hover:scale-105 shadow-md flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
                  >
                    <Check size={15} /> {editingTask ? 'Simpan Perubahan' : 'Tambahkan Catatan Tugas'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX ZOOM SCREENSHOT MODAL */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-gray-900/80 text-white p-2 rounded-full hover:bg-gray-900 shadow-md transition-all z-10 cursor-pointer"
            >
              <X size={18} />
            </button>
            <img src={previewImage} alt="Zoom Preview" className="max-h-[85vh] w-auto object-contain rounded-xl mx-auto" />
          </div>
        </div>
      )}

    </div>
  );
}
