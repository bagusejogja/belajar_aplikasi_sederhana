'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserRoleInfo {
  role: string;
  email: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  isPemroses: boolean;
  loading: boolean;
}

export function useUserRole(): UserRoleInfo {
  const [role, setRole] = useState<string>('ADMIN');
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && isMounted) {
          setEmail(user.email || null);
          const { data } = await supabase
            .from('app_users')
            .select('role')
            .eq('id', user.id)
            .single();
          if (data && data.role && isMounted) {
            setRole(data.role);
          }
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRole();
    return () => { isMounted = false; };
  }, []);

  const rLower = (role || '').toLowerCase();
  const isAdmin = rLower === 'admin' || rLower === 'administrator';
  const isManager = rLower === 'manager';
  const isStaff = rLower === 'staff' || rLower === 'unit kerja';
  const isPemroses = rLower.includes('pemroses');

  return {
    role,
    email,
    isAdmin,
    isManager,
    isStaff,
    isPemroses,
    loading
  };
}
