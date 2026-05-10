'use client';

import React, { useState } from 'react';
import { startMigration, fixBrokenR2Links } from '@/app/actions/migrate-to-r2';
import { Database, ArrowRight, Cloud, Loader2, CheckCircle2, Wrench } from 'lucide-react';

export default function MigratePage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleMigrate = async () => {
    if (!confirm("Apakah Anda yakin ingin memindahkan semua foto lama ke Cloudflare R2? Proses ini tidak bisa dibatalkan.")) return;
    
    setStatus('running');
    setMessage('Sedang memproses... Harap tunggu dan jangan tutup halaman ini.');
    
    try {
      const result = await startMigration();
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Migrasi Berhasil!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Terjadi kesalahan saat migrasi.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  const handleFix = async () => {
    setStatus('running');
    setMessage('Sedang memperbaiki link yang rusak... Mohon tunggu.');
    
    try {
      const result = await fixBrokenR2Links();
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Perbaikan Selesai!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Terjadi kesalahan saat perbaikan.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-gray-100">
        <div className="flex justify-center items-center gap-4 text-indigo-600">
          <Database size={40} />
          <ArrowRight size={24} className="text-gray-300" />
          <Cloud size={40} />
        </div>
        
        <div>
          <h1 className="text-2xl font-black text-gray-900">Migrasi & Perbaikan R2</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            Gunakan tombol di bawah untuk memindahkan file atau memperbaiki link yang rusak.
          </p>
        </div>

        <div className={`p-4 rounded-2xl text-sm font-bold ${
          status === 'idle' ? 'bg-blue-50 text-blue-700' :
          status === 'running' ? 'bg-amber-50 text-amber-700' :
          status === 'success' ? 'bg-emerald-50 text-emerald-700' :
          'bg-red-50 text-red-700'
        }`}>
          {status === 'idle' && "Siap untuk memproses."}
          {status === 'running' && (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              {message}
            </div>
          )}
          {(status === 'success' || status === 'error') && message}
        </div>

        {status !== 'running' && status !== 'success' && (
          <div className="space-y-3">
            <button 
              onClick={handleMigrate}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              MULAI MIGRASI ULANG
            </button>
            <button 
              onClick={handleFix}
              className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
            >
              <Wrench size={18} /> PERBAIKI LINK RUSAK
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
             <div className="flex justify-center text-emerald-500">
                <CheckCircle2 size={60} />
             </div>
             <button 
               onClick={() => window.location.href = '/report-photo'}
               className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-black transition-all"
             >
               LIHAT HASILNYA
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
