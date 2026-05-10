'use client';

import React, { useState } from 'react';
import { migratePaguFiles } from '@/app/actions/migrate-pagu';
import { Database, ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MigratePaguPage() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handleMigrate = async () => {
    if (!confirm("Proses ini akan mengupload file dari PC lokal ke R2 dan mengupdate database. Lanjutkan?")) return;
    
    setStatus('running');
    try {
      const res = await migratePaguFiles();
      setResult(res);
      setStatus('done');
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 text-white rounded-[2rem] shadow-xl shadow-emerald-100">
            <Database size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Migrasi File Tambah Pagu</h1>
            <p className="text-gray-500 font-medium">Memindahkan file lokal OneDrive ke Cloud R2.</p>
          </div>
        </div>
        <button 
          onClick={() => router.back()}
          className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={18} className="inline mr-2" /> KEMBALI
        </button>
      </div>

      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sumber Folder A</h3>
            <p className="text-sm font-bold text-gray-700">...\Desktop\tambah_pagu</p>
            <p className="text-[10px] text-gray-400 mt-1 italic">Untuk kolom file_surat_tanggapan</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Sumber Folder B</h3>
            <p className="text-sm font-bold text-gray-700">...\Desktop\365</p>
            <p className="text-[10px] text-gray-400 mt-1 italic">Untuk kolom link_surat_tanggapan</p>
          </div>
        </div>

        {status === 'idle' && (
          <div className="text-center">
            <button 
              onClick={handleMigrate}
              className="px-12 py-6 bg-gray-900 text-white rounded-[2.5rem] font-black shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3 mx-auto"
            >
              <RefreshCw size={24} /> MULAI MIGRASI SEKARANG
            </button>
            <p className="text-xs text-gray-400 mt-6 italic">Pastikan folder sumber tersedia di drive D: PC ini.</p>
          </div>
        )}

        {status === 'running' && (
          <div className="py-20 text-center space-y-6">
            <Loader2 size={64} className="animate-spin text-emerald-600 mx-auto" />
            <h2 className="text-2xl font-black text-gray-800">Sedang Memproses...</h2>
            <p className="text-gray-500">Membaca database dan mengupload file ke R2. Harap tunggu.</p>
          </div>
        )}

        {status === 'done' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex items-center gap-6">
              <CheckCircle size={48} className="text-emerald-600" />
              <div>
                <h2 className="text-xl font-black text-emerald-900">Migrasi Berhasil!</h2>
                <p className="text-emerald-700 font-medium">{result?.message}</p>
              </div>
            </div>

            {result?.details?.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-4 flex items-center gap-2">
                  <AlertTriangle size={14} /> Log Peringatan
                </h3>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 max-h-[300px] overflow-y-auto font-mono text-[10px] space-y-1">
                  {result.details.map((d: string, i: number) => (
                    <div key={i} className="text-gray-500">• {d}</div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => router.push('/tambah-pagu')}
              className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black hover:bg-black transition-all"
            >
              KEMBALI KE DASHBOARD
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
