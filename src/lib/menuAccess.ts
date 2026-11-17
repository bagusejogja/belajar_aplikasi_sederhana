import { menuList } from '@/lib/mock-db';

/**
 * Sumber kebenaran hak akses menu:
 * - ADMIN / Administrator: semua menu.
 * - Role yang SUDAH diatur di halaman /menus (punya baris di app_role_menus): hanya menu di database.
 *   (Menu yang dinonaktifkan di /menus benar-benar tidak muncul & tidak bisa diakses.)
 * - Role yang BELUM pernah diatur: fallback ke preset `roles` pada menuList.
 */
export function computeAllowedPaths(role: string, dbPaths: string[]): string[] {
  const roleLower = (role || '').toLowerCase();
  if (roleLower === 'admin' || roleLower === 'administrator') {
    return menuList.map(m => m.path);
  }
  if (dbPaths.length > 0) {
    return Array.from(new Set(dbPaths));
  }
  return menuList
    .filter(item => {
      const rolesLower = (item.roles || []).map(r => r.toLowerCase());
      return rolesLower.includes(roleLower) || rolesLower.includes('all');
    })
    .map(item => item.path);
}

export function isPathAllowed(allowedPaths: string[], pathname: string): boolean {
  return allowedPaths.some(p => !!p && (pathname === p || pathname.startsWith(p + '/')));
}
