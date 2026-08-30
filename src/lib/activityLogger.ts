import { supabase } from './supabase';

export interface LogActivityParams {
  action_type: 'LOGIN' | 'LOGOUT' | 'PAGE_VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'VERIFY' | 'SECURITY' | 'OTHER';
  action_title: string;
  module?: string;
  path?: string;
  details?: Record<string, any>;
  user_email?: string;
  user_role?: string;
  user_id?: string;
}

// Module auto-detector based on URL path
export function detectModuleFromPath(pathname: string): string {
  if (!pathname || pathname === '/' || pathname === '/dashboard') return 'DASHBOARD';
  if (pathname.startsWith('/surat')) return 'PERSURATAN';
  if (pathname.startsWith('/tambah-pagu') || pathname.startsWith('/potret-mutasi-pagu') || pathname.startsWith('/analisis') || pathname.startsWith('/anggaran')) return 'ANGGARAN';
  if (pathname.startsWith('/gov')) return 'DANA PEMERINTAH';
  if (pathname.startsWith('/penerimaan')) return 'PENERIMAAN';
  if (pathname.startsWith('/review') || pathname.startsWith('/admin/rules')) return 'REVIEW ANGGARAN';
  if (pathname.startsWith('/users') || pathname.startsWith('/menus') || pathname.startsWith('/units') || pathname.startsWith('/backup')) return 'MASTER';
  if (pathname.startsWith('/verifikasi') || pathname.startsWith('/input') || pathname.startsWith('/buku-besar') || pathname.startsWith('/bank') || pathname.startsWith('/reports')) return 'MASJID';
  if (pathname.startsWith('/login') || pathname.startsWith('/reset-password')) return 'AUTH';
  if (pathname.startsWith('/timeline') || pathname.startsWith('/arsip-kegiatan')) return 'KEGIATAN';
  return 'UMUM';
}

/**
 * Log user activity asynchronously without blocking UI interactions.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    let email = params.user_email;
    let role = params.user_role;
    let userId = params.user_id;

    // If not supplied, attempt to read from Supabase session
    if (!email) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          email = session.user.email;
          userId = session.user.id;
          
          // Check cached role in sessionStorage or query
          const cachedRole = typeof window !== 'undefined' ? sessionStorage.getItem('user_role') : null;
          if (cachedRole) {
            role = cachedRole;
          }
        }
      } catch (e) {
        // Ignore session read errors
      }
    }

    if (!email) {
      // If still no email (e.g. unauthenticated guest), don't log or mark as Guest
      return;
    }

    const currentPath = params.path || (typeof window !== 'undefined' ? window.location.pathname : '');
    const moduleName = params.module || detectModuleFromPath(currentPath);

    // Send payload to backend API
    fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        user_email: email,
        user_role: role || 'Viewer',
        action_type: params.action_type,
        action_title: params.action_title,
        module: moduleName,
        path: currentPath,
        details: params.details || {}
      })
    }).catch(err => {
      // Non-blocking catch
      console.debug('Activity logging background notice:', err?.message);
    });
  } catch (err) {
    // Fail silently in background
    console.debug('Activity logger error:', err);
  }
}
