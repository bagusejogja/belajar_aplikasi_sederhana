'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { History, FileText, ChevronRight } from 'lucide-react';

export default function RiwayatList({ onLoadAnalisis }: { onLoadAnalisis: (id_analisis: string) => void }) {
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiwayat = async () => {
      const { data } = await supabase
        .from('app_analisis_utama')
        .select('id_analisis, no_surat, tanggal_surat, perihal, created_at')
        .order('created_at', { ascending: false });
      
      if (data) setRiwayat(data);
      setLoading(false);
    };
    fetchRiwayat();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2"><History className="text-sky-400"/> Riwayat Analisis</h2>
          <p className="text-gray-400 text-sm">Pilih data analisis lama untuk dimuat ulang ke dalam form utama.</p>
        </div>
      </div>

      <div className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-inner flex flex-col">
         {loading ? (
           <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : riwayat.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
              <FileText size={48} className="opacity-20" />
              <p>Belum ada riwayat analisis.</p>
           </div>
         ) : (
           <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-2">
             {riwayat.map((r, i) => (
               <button 
                 key={i} 
                 onClick={() => onLoadAnalisis(r.id_analisis)}
                 className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 border border-transparent hover:border-sky-500/50 rounded-xl transition-all group text-left"
               >
                 <div>
                    <h3 className="text-sm font-bold text-sky-400 mb-1">{r.no_surat || 'Tanpa No Surat'}</h3>
                    <p className="text-xs text-gray-300 font-medium mb-1 truncate max-w-2xl">{r.perihal || 'Tanpa Perihal'}</p>
                    <p className="text-[10px] text-gray-500">{new Date(r.created_at).toLocaleString('id-ID')}</p>
                 </div>
                 <ChevronRight size={18} className="text-gray-600 group-hover:text-sky-400 transition-colors shrink-0" />
               </button>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
