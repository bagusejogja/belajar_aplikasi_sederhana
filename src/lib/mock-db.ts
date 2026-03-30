import { User, Unit, Role, MenuItem } from '../types';

export const mockUnits: Unit[] = [
  { id: '1', kode_unit: '010101', name: 'Majelis Wali Amanat', group: 'KPTU', pic: 'Bagus Sri Widodo', is_active: 1 },
  { id: '2', kode_unit: '010201', name: 'Dewan Guru Besar', group: 'KPTU', pic: 'Bambang Indarto', is_active: 1 },
  { id: '25', kode_unit: '010801', name: 'Direktorat Perencanaan', group: 'KPTU', pic: 'Bambang Indarto', is_active: 1 },
  { id: '26', kode_unit: '010802', name: 'Direktorat Keuangan', group: 'KPTU', pic: 'Muslifah Iswandari', is_active: 1 },
  { id: '43', kode_unit: '02000010', name: 'Fakultas Biologi', group: 'Fakultas', pic: 'Bagus Sri Widodo', is_active: 1 },
  { id: '44', kode_unit: '03000010', name: 'Fakultas Ekonomika dan Bisnis', group: 'Fakultas', pic: 'Bambang Indarto', is_active: 1 },
  { id: '85', kode_unit: '--', name: 'Masjid Kampus', group: 'Tempat Ibadah', pic: '-', is_active: 1 },
];

export const mockGovAkun = [
  { id: '1', nomor_akun: '511111', nama_akun: 'Belanja Gaji Pokok PNS', is_active: 1 },
  { id: '2', nomor_akun: '511119', nama_akun: 'Belanja Pembulatan Gaji PNS', is_active: 1 },
  { id: '9', nomor_akun: '511129', nama_akun: 'Belanja Uang Makan PNS', is_active: 1 },
  { id: '14', nomor_akun: '511611', nama_akun: 'Belanja Gaji Pokok PPPK', is_active: 1 },
];

export const mockUsers: User[] = [
  { id: 'u1', name: 'Admin Utama', email: 'admin@masjid.id', role: 'ADMIN', unitId: '1' },
  { id: 'u2', name: 'Fulan', email: 'fulan@masjid.id', role: 'MANAGER', unitId: '2' },
  { id: 'u3', name: 'Ahmad', email: 'ahmad@masjid.id', role: 'STAFF', unitId: '3' },
];

export const menuList: MenuItem[] = [
  // --- MASJID ---
  { title: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Masjid' },
  { title: 'Input Kas Masjid', path: '/input', icon: 'FileEdit', roles: ['ADMIN', 'STAFF'], group: 'Masjid' },
  { title: 'Laporan Masjid', path: '/reports', icon: 'PieChart', roles: ['ADMIN', 'MANAGER', 'STAFF'], group: 'Masjid' },
  { title: 'Impor Trx Bank', path: '/bank', icon: 'FileSpreadsheet', roles: ['ADMIN', 'STAFF'], group: 'Masjid' },
  
  // --- DANA PEMERINTAH ---
  { title: 'Dashboard Govt', path: '/gov-dashboard', icon: 'LayoutDashboard', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Input Belanja Gaji', path: '/gov-input', icon: 'Layers', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  { title: 'Pagu & Realisasi', path: '/gov-reports', icon: 'PieChart', roles: ['ADMIN'], group: 'Dana Pemerintah' },
  
  // --- MASTER & PENGATURAN ---
  { title: 'Data Referensi', path: '/references', icon: 'Database', roles: ['ADMIN'], group: 'Master' },
  { title: 'Unit Kerja (DB)', path: '/units', icon: 'Building2', roles: ['ADMIN'], group: 'Master' },
  { title: 'Manajemen User', path: '/users', icon: 'Users', roles: ['ADMIN'], group: 'Master' },
  { title: 'Menu Akses', path: '/menus', icon: 'Menu', roles: ['ADMIN'], group: 'Master' },
];
