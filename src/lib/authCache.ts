import { supabase } from '@/lib/supabase';
import { menuList } from '@/lib/mock-db';

export interface CachedAuthUser {
  userId: string;
  email: string;
  role: string;
  allowedPaths: string[];
}

let memoryAuthCache: CachedAuthUser | null = null;
let pendingAuthPromise: Promise<CachedAuthUser | null> | null = null;

export function getCachedAuthUser(): CachedAuthUser | null {
  return memoryAuthCache;
}

export function clearAuthCache(): void {
  memoryAuthCache = null;
  pendingAuthPromise = null;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('user_role');
  }
}

export async function fetchAuthUser(forceRefresh = false): Promise<CachedAuthUser | null> {
  if (!forceRefresh && memoryAuthCache) {
    return memoryAuthCache;
  }

  if (pendingAuthPromise) {
    return pendingAuthPromise;
  }

  pendingAuthPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        clearAuthCache();
        return null;
      }

      // Fetch user role
      const { data: roleData } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      const role = roleData?.role || 'Viewer';

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user_role', role);
      }

      // Fetch allowed paths from db
      const { data: menuData } = await supabase
        .from('app_role_menus')
        .select('path')
        .eq('role', role);
      const dbPaths = (menuData || []).map((m: any) => m.path);

      const roleLower = role.toLowerCase();
      const presetPaths = (roleLower === 'admin' || roleLower === 'administrator')
        ? menuList.map(m => m.path)
        : menuList
            .filter(item => {
              const rolesLower = (item.roles || []).map(r => r.toLowerCase());
              return rolesLower.includes(roleLower) || rolesLower.includes('all');
            })
            .map(item => item.path);

      const finalAllowed = Array.from(new Set([...dbPaths, ...presetPaths]));

      memoryAuthCache = {
        userId: session.user.id,
        email: session.user.email || '',
        role,
        allowedPaths: finalAllowed
      };

      return memoryAuthCache;
    } catch (err) {
      console.error('Error fetching auth user:', err);
      return null;
    } finally {
      pendingAuthPromise = null;
    }
  })();

  return pendingAuthPromise;
}
