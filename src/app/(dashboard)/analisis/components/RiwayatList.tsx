'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { History, FileText, ChevronRight } from 'lucide-react';

export default function RiwayatList({ onLoadAnalisis, setActiveTab }: { onLoadAnalisis: (id_analisis: string) => void, setActiveTab: (tab: string) => void }) {
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
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-2"><History className="text-indigo-600"/> Riwayat Analisis</h2>
          <p className="text-gray-500 text-sm">Pilih data analisis lama untuk dimuat ulang ke dalam form atau lihat hasilnya langsung.</p>
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col shadow-sm">
         {loading ? (
           <div className="flex-1 flex justify-center items-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : riwayat.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
              <FileText size={48} className="opacity-20" />
              <p className="font-medium text-sm">Belum ada riwayat analisis.</p>
           </div>
         ) : (
           <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-3">
             {riwayat.map((r, i) => (
               <div 
                 key={i} 
                 className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-200 rounded-2xl transition-all group shadow-sm hover:shadow-md"
               >
                 <div className="flex-1 mr-4 cursor-pointer" onClick={() => onLoadAnalisis(r.id_analisis)}>
                    <h3 className="text-sm font-black text-indigo-700 mb-1">{r.no_surat || 'Tanpa No Surat'}</h3>
                    <p className="text-xs text-gray-600 font-medium mb-2 truncate max-w-2xl">{r.perihal || 'Tanpa Perihal'}</p>
                    <p className="text-[10px] font-bold text-gray-400 bg-gray-200/50 w-max px-2 py-1 rounded-md">{new Date(r.created_at).toLocaleString('id-ID')}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                       onClick={() => {
                          onLoadAnalisis(r.id_analisis);
                          setTimeout(() => setActiveTab('pdf'), 300); // Wait for load to set form, then we override to pdf
                       }}
                       className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-indigo-100"
                    >
                       <FileText size={14}/> Lihat PDF
                    </button>
                    <button 
                       onClick={() => onLoadAnalisis(r.id_analisis)}
                       className="p-2 text-gray-400 hover:text-indigo-600 bg-white border border-gray-200 hover:border-indigo-200 rounded-xl transition-all"
                    >
                       <ChevronRight size={18} />
                    </button>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );
}
