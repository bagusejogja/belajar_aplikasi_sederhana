'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical,
  Layers,
  Users
} from 'lucide-react';
import { mockUnits } from '@/lib/mock-db';

export default function UnitsPage() {
  const [units, setUnits] = useState(mockUnits);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <Building2 size={24} />
           </div>
           <div>
              <h2 className="text-xl font-bold text-gray-900">Unit Kerja</h2>
              <p className="text-gray-500 text-sm">Organisasi internal & pembagian tugas</p>
           </div>
        </div>
        
        <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 shadow-xl shadow-amber-50 transition-all font-bold">
           <Plus size={20} />
           Tambah Unit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {units.map((unit) => (
           <div key={unit.id} className="group bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                 <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600 rounded-2xl transition-colors">
                    <Layers size={24} />
                 </div>
                 <button className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                    <MoreVertical size={20} />
                 </button>
              </div>

              {/* Body */}
              <div>
                 <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors mb-2">{unit.name}</h3>
                 <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-1.5">
                       <Users size={14} />
                       <span>0 Anggota</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <div className="flex items-center gap-1.5 font-medium text-emerald-600">
                       Aktif
                    </div>
                 </div>
              </div>

              {/* Progress/Footer info */}
              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          +
                       </div>
                    ))}
                 </div>
                 <button className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl hover:bg-amber-100 transition-colors">
                    Lihat Detail
                 </button>
              </div>
              
              {/* Highlight bar */}
              <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-400 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
           </div>
         ))}
      </div>
    </div>
  );
}
