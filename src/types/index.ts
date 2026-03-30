export type Role = 'ADMIN' | 'MANAGER' | 'STAFF' | 'GUEST';

export interface Unit {
  id: string | number;
  kode_unit: string;
  name: string;
  group: string;
  pic?: string;
  is_active: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  unitId: string | number;
}

export interface MenuItem {
  title: string;
  path: string;
  icon: string;
  roles: Role[];
  group?: string;
}

export interface RefAkun {
  id: string | number;
  nomor_akun: string;
  nama_akun: string;
  status: string;
}

export interface RefPersonel {
  id: string | number;
  nama_orang: string;
  unit_id: string | number;
  status: string;
}

export interface RefJenisBelanja {
  id: string | number;
  nama_belanja: string;
  akun_id: string | number;
  status: string;
}

export interface WebTransaction {
  id: string;
  tanggal: string;
  akun_id: string;
  personel_id: string;
  toko?: string;
  uraian: string;
  uang_masuk: number;
  uang_keluar: number;
  foto_nota?: string;
  foto_kegiatan?: string;
  foto_barang?: string;
  foto_bukti_transfer?: string;
  disetujui: string;
  catatan?: string;
  tanggal_disetujui?: string;
}
