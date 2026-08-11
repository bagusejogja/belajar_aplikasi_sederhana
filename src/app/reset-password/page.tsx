'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password minimal terdiri dari 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      setErrorMessage(error.message || 'Gagal memperbarui password. Silakan minta link reset password baru.');
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
               Buat Password Baru
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 font-medium max-w-xs">
               Masukkan kata sandi baru Anda untuk mengamankan akun.
            </p>
         </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-3xl sm:px-10 border border-gray-100">
          
          {success ? (
            <div className="space-y-6 text-center">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Password Berhasil Diperbarui!</h3>
                  <p className="text-xs text-gray-600 font-medium leading-relaxed">
                     Kata sandi baru Anda telah berhasil disimpan. Anda sekarang dapat masuk ke aplikasi menggunakan password baru tersebut.
                  </p>
               </div>
               <button 
                  type="button" 
                  onClick={() => router.push('/login')}
                  className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
               >
                  LANJUTKAN KE LOGIN <ArrowRight size={16} />
               </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleUpdatePassword}>
              
              {errorMessage && (
                 <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle size={18} className="shrink-0 text-rose-600" />
                    <span>{errorMessage}</span>
                 </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Password Baru</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                   </div>
                   <input 
                      type="password" 
                      required 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-sm text-gray-900 tracking-widest" 
                      placeholder="••••••••" 
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Konfirmasi Password Baru</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                   </div>
                   <input 
                      type="password" 
                      required 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-sm text-gray-900 tracking-widest" 
                      placeholder="••••••••" 
                   />
                </div>
              </div>

              <div className="pt-2">
                <button 
                   type="submit" 
                   disabled={loading} 
                   className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-indigo-100 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 gap-2"
                >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : <Lock size={18} />}
                   {loading ? 'Menyimpan...' : 'SIMPAN PASSWORD BARU'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
