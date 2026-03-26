import { User, Unit, Role, MenuItem } from '../types';

export const mockUnits: Unit[] = [
  { id: '1', name: 'Keuangan' },
  { id: '2', name: 'Logistik' },
  { id: '3', name: 'Kepegawaian' },
  { id: '4', name: 'Umum' },
];

export const mockUsers: User[] = [
  { id: 'u1', name: 'Admin Utama', email: 'admin@masjid.id', role: 'ADMIN', unitId: '1' },
  { id: 'u2', name: 'Fulan', email: 'fulan@masjid.id', role: 'MANAGER', unitId: '2' },
  { id: 'u3', name: 'Ahmad', email: 'ahmad@masjid.id', role: 'STAFF', unitId: '3' },
];

export const menuList: MenuItem[] = [
  { title: 'Verifikasi', path: '/', icon: 'CheckCircle', roles: ['ADMIN', 'MANAGER'] },
  { title: 'Unit Kerja', path: '/units', icon: 'Building2', roles: ['ADMIN'] },
  { title: 'Manajemen User', path: '/users', icon: 'Users', roles: ['ADMIN'] },
  { title: 'Menu Akses', path: '/menus', icon: 'Menu', roles: ['ADMIN'] },
];
