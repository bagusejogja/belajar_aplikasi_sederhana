'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Loader2, UserPlus, LogIn, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Auth Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
     setErrorMessage('');

     try {
        if (mode === 'register') {
           // 1. Proses Daftar (Sign Up)
           const { error, data } = await supabase.auth.signUp({
              email, password,
              options: { emailRedirectTo: window.location.origin }
           });
           if (error) throw error;
           if (data.user?.identities?.length === 0) {
               alert("Email ini sudah terdaftar. Silakan login.");
               setMode('login');
           } else if (data.user) {
               // Masukkan ke app_users agar tampil di Manajemen Akses User
               await supabase.from('app_users').insert([{
                  id: data.user.id,
                  email: data.user.email,
                  role: 'Pending'
               }]);

               alert("Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi, atau jika sistem Auto-Confirm aktif, langsung klik Login.");
               setMode('login');
           }
        } else if (mode === 'login') {
           // 2. Proses Masuk (Sign In)
           const { error } = await supabase.auth.signInWithPassword({ email, password });
           if (error) throw error;
           
           router.push('/');
        } else if (mode === 'forgot') {
           // 3. Proses Reset Password (Lupa Password)
           const resetRedirectUrl = `${window.location.origin}/reset-password`;
           const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: resetRedirectUrl
           });
           if (error) throw error;

           setResetSent(true);
        }
     } catch (error: any) {
        setErrorMessage(error.message || 'Terjadi kesalahan sistem.');
     } finally {
        setLoading(false);
     }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-emerald-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ornamen Glassmorphism */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] rounded-full bg-indigo-400/20 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] rounded-full bg-emerald-400/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
         <div className="flex justify-center flex-col items-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-12 mb-6">
               <ShieldCheck size={40} className="text-white -rotate-12" />
            </div>
            <h2 className="text-center text-3xl font-black text-gray-900 tracking-tight">
               {mode === 'register' ? 'Buat Akun Baru' : mode === 'forgot' ? 'Reset Password' : 'Sistem Keuangan'}
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 font-medium max-w-xs">
               {mode === 'register' 
                  ? 'Daftarkan email Anda untuk mendapat akses.' 
                  : mode === 'forgot'
                     ? 'Masukkan email terdaftar untuk menerima link reset kata sandi.'
                     : 'Silakan masukkan Email dan Password akses Anda.'}
            </p>
         </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/60 backdrop-blur-2xl py-8 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:rounded-[2rem] sm:px-10 border border-white/80">
          
          {/* Pesan Sukses Reset Password */}
          {mode === 'forgot' && resetSent ? (
            <div className="space-y-6 text-center">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Email Reset Terkirim!</h3>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                     Sistem telah mengirimkan link reset password ke alamat email: <br/>
                     <strong className="text-indigo-600 font-bold">{email}</strong>
                  </p>
                  <p className="text-[11px] text-gray-400">
                     Silakan periksa folder <strong>Inbox</strong> atau <strong>Spam</strong> email Anda, lalu klik link yang diberikan untuk memasukkan password baru.
                  </p>
               </div>
               <button 
                  type="button" 
                  onClick={() => { setMode('login'); setResetSent(false); }}
                  className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2"
               >
                  <ArrowLeft size={16} /> Kembali ke Halaman Login
               </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleAuth}>
              
              {/* Alert Error Error Message */}
              {errorMessage && (
                 <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                 </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Alamat Email</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                   </div>
                   <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-xs text-gray-900 shadow-sm" 
                      placeholder="nama@email.com" 
                   />
                </div>
              </div>

              {/* Input Password (Hanya untuk Mode Login & Register) */}
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                     <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Password (Kata Sandi)</label>
                     {mode === 'login' && (
                        <button 
                           type="button"
                           onClick={() => { setMode('forgot'); setErrorMessage(''); }}
                           className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                           Lupa Password?
                        </button>
                     )}
                  </div>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400" />
                     </div>
                     <input 
                        type="password" 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        className="w-full pl-11 pr-4 py-3.5 bg-white/50 border border-white/80 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-sm text-gray-900 tracking-widest shadow-sm" 
                        placeholder="••••••••" 
                     />
                  </div>
                </div>
              )}

              <div className="pt-2">
                 <button 
                   type="submit" 
                   disabled={loading} 
                   className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-500/30 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 gap-2"
                >
                   {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                   ) : mode === 'register' ? (
                      <UserPlus size={18}/>
                   ) : mode === 'forgot' ? (
                      <KeyRound size={18}/>
                   ) : (
                      <LogIn size={18}/>
                   )}
                   {loading 
                      ? 'Memproses...' 
                      : mode === 'register' 
                         ? 'DAFTAR SEKARANG' 
                         : mode === 'forgot' 
                            ? 'KIRIM LINK RESET PASSWORD' 
                            : 'MASUK KE APLIKASI'}
                </button>
              </div>
              
              <div className="mt-6 text-center space-y-2">
                 {mode === 'forgot' ? (
                    <button 
                       type="button" 
                       onClick={() => { setMode('login'); setErrorMessage(''); }} 
                       className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-center gap-1 mx-auto"
                    >
                       <ArrowLeft size={14} /> Kembali ke Login
                    </button>
                 ) : (
                    <button 
                       type="button" 
                       onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setErrorMessage(''); }} 
                       className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                       {mode === 'register' ? "Sudah punya akun? Masuk di sini" : "Belum punya akses? Daftar Akun Baru"}
                    </button>
                 )}
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
