import { TreeNodeItem } from '@/components/shared/TreeView';

/**
 * Helper untuk menentukan apakah suatu akun COA (ref_akun) adalah akun daun (leaf / ujung)
 * yaitu akun yang TIDAK MEMILIKI TURUNAN (bukan akun induk/header).
 */

export interface AccountItem {
  id: string | number;
  nomor_akun: string;
  nama_akun: string;
  status?: string;
  [key: string]: any;
}

/**
 * Memeriksa apakah suatu nomor akun memiliki turunan (anak) di dalam daftar seluruh akun.
 */
export function hasAccountChildren(code: string, allCodes: string[]): boolean {
  const cleanCode = String(code || '').trim();
  if (!cleanCode) return false;

  return allCodes.some((other) => {
    const cleanOther = String(other || '').trim();
    if (cleanOther === cleanCode) return false;

    // 1. Sub-akun dengan tanda titik/strip (misal: '11110.01' adalah turunan dari '11110')
    if (cleanOther.startsWith(cleanCode + '.') || cleanOther.startsWith(cleanCode + '-')) {
      return true;
    }

    // 2. Hirarki digit baku COA 5 digit:
    // Level 1 Header: misal '10000', '40000', '50000' (akhiran '0000') -> turunan berawalan angka yang sama
    if (cleanCode.length === 5 && cleanCode.endsWith('0000') && cleanOther.startsWith(cleanCode[0])) {
      return true;
    }
    // Level 2 Header: misal '51000' (akhiran '000') -> turunan berawalan 2 digit yang sama
    if (cleanCode.length === 5 && cleanCode.endsWith('000') && cleanOther.startsWith(cleanCode.slice(0, 2))) {
      return true;
    }
    // Level 3 Header: misal '51100' (akhiran '00') -> turunan berawalan 3 digit yang sama
    if (cleanCode.length === 5 && cleanCode.endsWith('00') && cleanOther.startsWith(cleanCode.slice(0, 3))) {
      return true;
    }
    // Level 4 Header: misal '51010' (akhiran '0') -> turunan berawalan 4 digit yang sama
    if (cleanCode.length === 5 && cleanCode.endsWith('0') && cleanOther.startsWith(cleanCode.slice(0, 4))) {
      return true;
    }

    // 3. Prefix umum jika kode induk lebih pendek dari kode anak
    if (cleanCode.length < cleanOther.length && cleanOther.startsWith(cleanCode)) {
      return true;
    }

    return false;
  });
}

/**
 * Filter daftar akun sehingga HANYA menghasilkan akun ujung (leaf / tidak punya turunan).
 */
export function getLeafAccounts<T extends { nomor_akun: string }>(accounts: T[]): T[] {
  if (!accounts || accounts.length === 0) return [];
  const allCodes = accounts.map((a) => String(a.nomor_akun || '').trim());
  return accounts.filter((acc) => !hasAccountChildren(acc.nomor_akun, allCodes));
}

/**
 * Bangun struktur pohon TreeNodeItem[] dari daftar ref_akun untuk ditampilkan
 * pada komponen TreeView hierarkis standar Design System.
 */
export function buildAccountTree(accounts: AccountItem[]): TreeNodeItem[] {
  if (!accounts || accounts.length === 0) return [];

  const allCodes = accounts.map((a) => String(a.nomor_akun || '').trim());
  const sorted = [...accounts].sort((a, b) =>
    String(a.nomor_akun).localeCompare(String(b.nomor_akun), undefined, { numeric: true })
  );

  const nodeMap = new Map<string, TreeNodeItem & { rawItem: AccountItem; isParent: boolean }>();

  sorted.forEach((a) => {
    const code = String(a.nomor_akun || '').trim();
    const isParent = hasAccountChildren(code, allCodes);

    let badge = 'Akun Ujung (Leaf)';
    let badgeVariant: 'emerald' | 'blue' | 'slate' | 'amber' = 'emerald';
    let type: TreeNodeItem['type'] = 'account_item';

    if (code.endsWith('0000') && !code.includes('.')) {
      badge = 'Akun Utama';
      badgeVariant = 'blue';
      type = 'account_group';
    } else if (isParent) {
      badge = 'Kelompok / Induk';
      badgeVariant = 'slate';
      type = 'account_subgroup';
    }

    nodeMap.set(code, {
      id: String(a.id),
      label: a.nama_akun,
      code: code,
      type: type,
      badge: badge,
      badgeVariant: badgeVariant,
      children: [],
      rawItem: a,
      isParent: isParent
    });
  });

  const rootNodes: TreeNodeItem[] = [];

  sorted.forEach((a) => {
    const code = String(a.nomor_akun || '').trim();
    const node = nodeMap.get(code);
    if (!node) return;

    let parentCode: string | null = null;

    if (code.includes('.')) {
      const dotBase = code.substring(0, code.lastIndexOf('.'));
      if (nodeMap.has(dotBase)) {
        parentCode = dotBase;
      }
    } else if (/^\d{5}$/.test(code)) {
      if (code.endsWith('0000')) {
        parentCode = null;
      } else if (code.endsWith('000')) {
        const top = code.slice(0, 1) + '0000';
        if (nodeMap.has(top)) parentCode = top;
      } else if (code.endsWith('00')) {
        const p2 = code.slice(0, 2) + '000';
        const p1 = code.slice(0, 1) + '0000';
        if (nodeMap.has(p2)) parentCode = p2;
        else if (nodeMap.has(p1)) parentCode = p1;
      } else if (code.endsWith('0')) {
        const p3 = code.slice(0, 3) + '00';
        const p2 = code.slice(0, 2) + '000';
        const p1 = code.slice(0, 1) + '0000';
        if (nodeMap.has(p3)) parentCode = p3;
        else if (nodeMap.has(p2)) parentCode = p2;
        else if (nodeMap.has(p1)) parentCode = p1;
      } else {
        const p4 = code.slice(0, 4) + '0';
        const p3 = code.slice(0, 3) + '00';
        const p2 = code.slice(0, 2) + '000';
        const p1 = code.slice(0, 1) + '0000';
        if (nodeMap.has(p4)) parentCode = p4;
        else if (nodeMap.has(p3)) parentCode = p3;
        else if (nodeMap.has(p2)) parentCode = p2;
        else if (nodeMap.has(p1)) parentCode = p1;
      }
    }

    if (parentCode && nodeMap.has(parentCode) && parentCode !== code) {
      const parentNode = nodeMap.get(parentCode)!;
      if (!parentNode.children) parentNode.children = [];
      parentNode.children.push(node);
      parentNode.count = (parentNode.count || 0) + 1;
    } else {
      rootNodes.push(node);
    }
  });

  return rootNodes;
}
