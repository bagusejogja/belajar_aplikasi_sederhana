import { User, Unit, Role, MenuItem } from '../types';

export const mockUnits: Unit[] = [
  { id: 1, kode_unit: '010101', name: 'Majelis Wali Amanat', group: 'KPTU', pic: 'Bagus Sri Widodo', is_active: 1 },
  { id: 2, kode_unit: '010201', name: 'Dewan Guru Besar', group: 'KPTU', pic: 'Bambang Indarto', is_active: 1 },
  { id: 25, kode_unit: '010801', name: 'Direktorat Perencanaan', group: 'KPTU', pic: 'Bambang Indarto', is_active: 1 },
  { id: 26, kode_unit: '010802', name: 'Direktorat Keuangan', group: 'KPTU', pic: 'Muslifah Iswandari', is_active: 1 },
  { id: 43, kode_unit: '02000010', name: 'Fakultas Biologi', group: 'Fakultas', pic: 'Bagus Sri Widodo', is_active: 1 },
  { id: 44, kode_unit: '03000010', name: 'Fakultas Ekonomika dan Bisnis', group: 'Fakultas', pic: 'Bambang Indarto', is_active: 1 },
  { id: 85, kode_unit: '--', name: 'Masjid Kampus', group: 'Tempat Ibadah', pic: '-', is_active: 1 },
];

export const mockGovAkun = [
  { id: 1, nomor_akun: '511111', nama_akun: 'Belanja Gaji Pokok PNS', is_active: 1 },
  { id: 2, nomor_akun: '511119', nama_akun: 'Belanja Pembulatan Gaji PNS', is_active: 1 },
  { id: 9, nomor_akun: '511129', nama_akun: 'Belanja Uang Makan PNS', is_active: 1 },
  { id: 14, nomor_akun: '511611', nama_akun: 'Belanja Gaji Pokok PPPK', is_active: 1 },
];

export const mockUsers: User[] = [
  { id: 'u1', name: 'Admin Utama', email: 'admin@masjid.id', role: 'ADMIN', unitId: '1' },
  { id: 'u2', name: 'Fulan', email: 'fulan@masjid.id', role: 'MANAGER', unitId: '2' },
  { id: 'u3', name: 'Ahmad', email: 'ahmad@masjid.id', role: 'STAFF', unitId: '3' },
];

export const menuList: MenuItem[] = [
  // --- UTAMA ---
  { title: 'Dashboard Utama', path: '/', icon: 'LayoutDashboard', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Utama' },

  // --- MASJID ---
  { title: 'Dashboard Masjid', path: '/dashboard', icon: 'PieChart', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Masjid' },
  { title: 'Verifikasi Kas', path: '/verifikasi', icon: 'CheckCircle', roles: ['ADMIN', 'MANAGER'], group: 'Masjid' },
  { title: 'Input Kas Masjid', path: '/input', icon: 'FileEdit', roles: ['ADMIN', 'STAFF'], group: 'Masjid' },
  { title: 'Perbaikan Input', path: '/revisi', icon: 'ShieldAlert', roles: ['STAFF'], group: 'Masjid' },
  { title: 'Laporan Detail', path: '/reports', icon: 'PieChart', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Masjid' },
  { title: 'Laporan Ringkasan', path: '/summary', icon: 'Layers', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Masjid' },
  { title: 'Pengajuan Kas Kecil', path: '/report-photo', icon: 'FileText', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Masjid' },
  { title: 'Impor Trx Bank', path: '/bank', icon: 'FileSpreadsheet', roles: ['ADMIN', 'STAFF'], group: 'Masjid' },
  { title: 'Buku Besar', path: '/buku-besar', icon: 'BookOpen', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Masjid' },
  { title: 'Laporan Gabungan', path: '/gabungan-reports', icon: 'Database', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Masjid' },
  { title: 'Analisis Pivot', path: '/pivot', icon: 'LayoutGrid', roles: ['ADMIN', 'MANAGER'], group: 'Masjid' },
  
  // --- DANA PEMERINTAH ---
  { title: 'Dashboard Govt', path: '/gov-dashboard', icon: 'LayoutDashboard', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Perbandingan Anggaran', path: '/usulan-anggaran', icon: 'Scale', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Anggaran Uang Makan', path: '/anggaran-uang-makan', icon: 'FileText', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Tunjangan Guru Besar', path: '/tunjangan-guru-besar', icon: 'FileSpreadsheet', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Tunjangan Serdos', path: '/tunjangan-serdos', icon: 'CheckCircle', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Tunjangan Fungsional', path: '/tunjangan-fungsional', icon: 'FileText', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Gaji PNS', path: '/gaji-pns', icon: 'Database', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Input Belanja Gaji', path: '/gov-input', icon: 'Layers', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Pagu & Realisasi', path: '/gov-reports', icon: 'PieChart', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Laporan Komparasi', path: '/komparasi-laporan', icon: 'Layers', roles: ['ADMIN'], group: 'Dana Pemerintah' },

  // --- PENERIMAAN ---
  { title: 'Dashboard Penerimaan', path: '/penerimaan', icon: 'LayoutDashboard', roles: ['ADMIN', 'MANAGER'], group: 'Penerimaan' },
  { title: 'Input Penerimaan', path: '/penerimaan/input', icon: 'FileEdit', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Penerimaan' },
  { title: 'Master Penerimaan', path: '/penerimaan/master', icon: 'Settings', roles: ['ADMIN', 'MANAGER'], group: 'Penerimaan' },

  // --- PERSURATAN ---
  { title: 'Daftar Arsip Surat', path: '/surat', icon: 'FileText', roles: ['ADMIN', 'STAFF'], group: 'Persuratan' },
  { title: 'Tambah Pagu', path: '/tambah-pagu', icon: 'Layout', roles: ['ADMIN', 'STAFF', 'Pemroses Anggaran'], group: 'Persuratan' },
  
  // --- MASTER & PENGATURAN ---
  { title: 'Narrative Generator', path: '/gov-narrative', icon: 'MessageSquare', roles: ['ADMIN'], group: 'Master' },
  { title: 'Pemetaan PIC -> Unit', path: '/gov-mapping', icon: 'Link', roles: ['ADMIN'], group: 'Master' },
  { title: 'Data Referensi', path: '/references', icon: 'Database', roles: ['ADMIN'], group: 'Master' },
  { title: 'Unit Kerja (DB)', path: '/units', icon: 'Building2', roles: ['ADMIN'], group: 'Master' },
  { title: 'Unit', path: '/gov-units', icon: 'Landmark', roles: ['ADMIN'], group: 'Master' },
  { title: 'Manajemen User', path: '/users', icon: 'Users', roles: ['ADMIN'], group: 'Master' },
  { title: 'Menu Akses', path: '/menus', icon: 'Menu', roles: ['ADMIN'], group: 'Master' },
  { title: 'Pengaturan Form', path: '/admin/pengaturan-form', icon: 'Settings', roles: ['ADMIN'], group: 'Master' },

  // --- ANGGARAN ---
  { title: 'Analisis Pagu', path: '/analisis', icon: 'FileSpreadsheet', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Anggaran' },
  { title: 'Revisi Terjadwal', path: '/anggaran/usulan', icon: 'FileText', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Anggaran' },
  { title: 'Tolakan Verif', path: '/anggaran/mak', icon: 'FileText', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Anggaran' },
  { title: 'Pengajuan Form MAK', path: '/input-mak', icon: 'FileEdit', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Anggaran' },

  // --- MANAJEMEN KEGIATAN ---
  { title: 'Timeline Kegiatan', path: '/timeline', icon: 'Calendar', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Manajemen Kegiatan' },
  { title: 'Arsip Berjenjang', path: '/arsip-kegiatan', icon: 'FolderTree', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Manajemen Kegiatan' },
  { title: 'Komparasi Laporan', path: '/komparasi-laporan', icon: 'BarChart4', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Manajemen Kegiatan' },
];
