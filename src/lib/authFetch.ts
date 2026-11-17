import { supabase } from '@/lib/supabase';

/** fetch yang otomatis menyertakan token login Supabase (untuk API yang dibatasi role). */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || {});
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers });
}
