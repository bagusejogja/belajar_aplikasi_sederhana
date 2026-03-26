'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Loader2, UserPlus, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Mode Daftar vs Login
  const router = useRouter();

  useEffect(() => {
     // Cek apakah sudah login, langsung lempar ke beranda
     const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.push('/');
     };
     checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     try {
        if (isRegistering) {
           // Proses Daftar (Sign Up)
           const { error, data } = await supabase.auth.signUp({
              email, password,
              options: { emailRedirectTo: window.location.origin }
           });
           if (error) throw error;
           if (data.user?.identities?.length === 0) {
               alert("Email ini sudah terdaftar. Silakan login.");
               setIsRegistering(false);
           } else {
               alert("Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi, atau jika sistem Auto-Confirm aktif, langsung klik Login.");
               setIsRegistering(false);
           }
        } else {
           // Proses Masuk (Sign In)
           const { error } = await supabase.auth.signInWithPassword({ email, password });
           if (error) throw error;
           
           // Jika berhasil
           router.push('/');
        }
     } catch (error: any) {
        alert("Gagal: " + error.message);
     } finally {
        setLoading(false);
     }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ornamen */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
         <div className="flex justify-center flex-col items-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-12 mb-6">
               <ShieldCheck size={40} className="text-white -rotate-12" />
            </div>
            <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">
               {isRegistering ? 'Buat Akun Baru' : 'Sistem Keuangan'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 font-medium">
               {isRegistering ? 'Daftarkan email Anda untuk mendapat akses.' : 'Silakan masukkan Email dan Password akses Anda.'}
            </p>
         </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleAuth}>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Alamat Email</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                 </div>
                 <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium" placeholder="nama@email.com" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Password (Kata Sandi)</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                 </div>
                 <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-lg tracking-widest" placeholder="••••••••" />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-indigo-100 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50 gap-2">
                 {loading ? <Loader2 size={20} className="animate-spin" /> : isRegistering ? <UserPlus size={20}/> : <LogIn size={20}/>}
                 {loading ? 'Memproses...' : isRegistering ? 'DAFTAR SEKARANG' : 'MASUK KE APLIKASI'}
              </button>
            </div>
            
            <div className="mt-6 text-center">
               <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                  {isRegistering ? "Sudah punya akun? Masuk di sini" : "Belum punya akses? Daftar Akun Baru"}
               </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
