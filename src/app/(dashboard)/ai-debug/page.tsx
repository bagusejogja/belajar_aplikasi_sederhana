'use client';

import React, { useState } from 'react';
import { listAvailableModels } from '@/app/actions/ai-scan';

export default function AIDebugPage() {
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkModels = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listAvailableModels();
      if (result.success) {
        setModels(result.models);
      } else {
        setError(result.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Debugging - List Models</h1>
      <button 
        onClick={checkModels}
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Mengecek...' : 'Cek Model Tersedia'}
      </button>

      {error && <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

      <div className="mt-8 space-y-2">
        <h2 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Model yang bisa dipakai oleh API Key Anda:</h2>
        {models.length > 0 ? (
          <ul className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            {models.map(m => (
              <li key={m} className="text-sm font-mono py-1 border-b border-gray-100 last:border-0">{m}</li>
            ))}
          </ul>
        ) : !loading && <p className="text-gray-400 italic">Belum ada data. Klik tombol di atas.</p>}
      </div>
    </div>
  );
}
