import { supabase } from './supabase';

export interface UserFavoriteState {
  userKey: string;
  favorites: string[];
}

/**
 * Get unique identifier string for the current user
 */
export function getFavoriteUserKey(user: { id?: string; email?: string } | null): string {
  if (!user) return 'guest_user';
  return user.id || user.email || 'guest_user';
}

/**
 * Read favorites synchronously from localStorage for fast initial render
 */
export function getLocalFavorites(userKey: string): string[] {
  if (typeof window === 'undefined' || !userKey) return [];
  try {
    const raw = localStorage.getItem(`app_user_favorites_${userKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading local favorites:', err);
  }
  return [];
}

/**
 * Write favorites to localStorage and broadcast change event across components
 */
export function setLocalFavorites(userKey: string, paths: string[]): void {
  if (typeof window === 'undefined' || !userKey) return;
  try {
    const unique = Array.from(new Set(paths));
    localStorage.setItem(`app_user_favorites_${userKey}`, JSON.stringify(unique));
    
    // Broadcast event so Sidebar and Dashboard sync instantly
    window.dispatchEvent(
      new CustomEvent('app_favorites_updated', {
        detail: { userKey, favorites: unique }
      })
    );
  } catch (err) {
    console.error('Error saving local favorites:', err);
  }
}

/**
 * Fetch favorites with remote Supabase sync fallback
 */
export async function loadUserFavorites(userKey: string): Promise<string[]> {
  const local = getLocalFavorites(userKey);

  // If userKey is guest, skip DB sync
  if (!userKey || userKey === 'guest_user') return local;

  try {
    const { data, error } = await supabase
      .from('app_user_favorites')
      .select('path')
      .eq('user_id', userKey);

    if (!error && data) {
      const remotePaths = data.map((d: any) => d.path);
      // Merge remote and local to never lose locally set items
      const merged = Array.from(new Set([...local, ...remotePaths]));
      setLocalFavorites(userKey, merged);
      return merged;
    }
  } catch {
    // If table doesn't exist yet, local storage will seamlessly handle it
  }

  return local;
}

/**
 * Save user favorites both locally and to Supabase (if available)
 */
export async function saveUserFavorites(userKey: string, paths: string[]): Promise<void> {
  const unique = Array.from(new Set(paths));
  setLocalFavorites(userKey, unique);

  if (!userKey || userKey === 'guest_user') return;

  try {
    // Delete existing remote records for this user
    await supabase.from('app_user_favorites').delete().eq('user_id', userKey);

    // Insert new records if any
    if (unique.length > 0) {
      const rows = unique.map(path => ({
        user_id: userKey,
        path: path
      }));
      await supabase.from('app_user_favorites').insert(rows);
    }
  } catch (err) {
    // Background sync error is ignored as localStorage is already updated
    console.debug('Supabase sync skipped or table not created yet:', err);
  }
}

/**
 * Toggle a single favorite path for the user
 */
export async function toggleUserFavorite(userKey: string, path: string): Promise<{ isFavorited: boolean; newFavorites: string[] }> {
  const current = getLocalFavorites(userKey);
  const exists = current.includes(path);
  const updated = exists ? current.filter(p => p !== path) : [...current, path];

  await saveUserFavorites(userKey, updated);
  return { isFavorited: !exists, newFavorites: updated };
}
