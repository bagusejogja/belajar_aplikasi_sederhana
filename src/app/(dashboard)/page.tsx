'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Eye, 
  ArrowRight,
  ExternalLink,
  Loader2,
  Filter
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Sheets Interface
interface ExtendedTransaction {
  ID?: string;
  Tanggal?: string;
  Akun?: string;
  'Dibelanjakan oleh'?: string;
  'Toko/Penerimaa Uang'?: string;
  Uraian?: string;
  'Uang Masuk'?: number | string;
  'Uang Keluar'?: number | string;
  Link_Foto_Nota?: string;
  Link_Foto_Barang?: string;
  Link_Foto_Kegiatan?: string;
  link_bukti_transfer?: string;
  Disetujui?: string;
  Catatan?: string;
}

export default function Home() {
  const [data, setData] = useState<ExtendedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<ExtendedTransaction | null>(null);
  const [formData, setFormData] = useState<ExtendedTransaction>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_NEW_SHEETS_URL;
        if (!apiUrl) {
           console.warn("Harap set NEXT_PUBLIC_NEW_SHEETS_URL di .env!");
           setLoading(false);
           return;
        }
        const res = await fetch(`${apiUrl}?action=getTransaksi`, { cache: 'no-store' });
        const json = await res.json();
        
        if (json.status === 'success' && Array.isArray(json.data)) {
            const unapproved = json.data.filter((row: ExtendedTransaction) => {
               const strDisetujui = String(row.Disetujui || '').trim();
               return strDisetujui === '' || strDisetujui === 'Perbaiki' || strDisetujui === 'undefined';
            });
            setData(unapproved);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditClick = (row: ExtendedTransaction) => {
    setEditingRow(row);
    setFormData({ ...row });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/sheets-update', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formData)
      });
      const result = await res.json();
      if(result.status === 'success') {
         alert('Data berhasil disimpan ke Google Sheets!');
         setData(prev => prev.filter(r => r.ID !== formData.ID));
         setEditingRow(null);
      } else {
         alert('Gagal menyimpan data.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  const renderPhotos = (linkString?: string) => {
    if (!linkString) return null;
    const links = linkString.split(',').map(s => s.trim()).filter(Boolean);
    if (links.length === 0) return null;
    return (
      <div className="flex gap-3 flex-wrap">
        {links.map((link, idx) => {
          const previewLink = link.replace('/view', '/preview');
          return (
            <a key={idx} href={link} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-2xl border-4 border-white shadow-md hover:shadow-xl transition-all aspect-square w-32">
               <img src={previewLink} alt="Bukti" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ExternalLink size={20} className="text-white" />
               </div>
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100 flex justify-between items-center overflow-hidden relative">
            <div className="z-10">
               <p className="text-indigo-100 text-sm font-medium">Pending Verifikasi</p>
               <h3 className="text-4xl font-black mt-1 leading-none">{data.length}</h3>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl z-10">
               <AlertCircle size={32} />
            </div>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full" />
         </div>

         <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
            <div>
               <p className="text-gray-500 text-sm font-medium">Total Anggaran</p>
               <h3 className="text-2xl font-bold mt-1 text-gray-900 group-hover:text-indigo-600 transition-colors">Rp 0</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
               <CheckCircle size={32} />
            </div>
         </div>
         
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
            <div>
               <p className="text-gray-500 text-sm font-medium">Laporan Aktif</p>
               <h3 className="text-2xl font-bold mt-1 text-gray-900">0</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl text-gray-400">
               <Eye size={32} />
            </div>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <h2 className="font-bold text-gray-900 text-lg">Daftar Transaksi Baru</h2>
              <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-full font-bold">LIVE</span>
           </div>
           <button className="text-gray-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-xl">
              <Filter size={20} />
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identitas / Tgl</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uraian Transaksi</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nominal</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                   <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                         <Loader2 className="animate-spin text-indigo-500" size={32} />
                         <span className="font-medium">Sinkronisasi dengan Google Sheets...</span>
                      </div>
                   </td>
                </tr>
              )}
              {!loading && data.length === 0 && (
                <tr><td colSpan={4} className="text-center py-20 text-gray-500">Semua data sudah terverifikasi. Sempurna! ✨</td></tr>
              )}
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="font-bold text-gray-900 tracking-tight leading-none mb-1">{row.ID || '-'}</div>
                    <div className="text-gray-400 text-xs font-medium">{row.Tanggal || '-'}</div>
                  </td>
                  <td className="px-6 py-6">
                     <p className="text-gray-600 text-sm max-w-md line-clamp-2 leading-relaxed">{row.Uraian}</p>
                     <div className="flex gap-2 mt-2">
                        {row.Akun && <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase">{row.Akun}</span>}
                     </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    {Number(row['Uang Masuk'] || 0) > 0 && <span className="text-emerald-600 font-black text-sm">+{Number(row['Uang Masuk']).toLocaleString('id-ID')}</span>}
                    {Number(row['Uang Keluar'] || 0) > 0 && <span className="text-red-600 font-black text-sm">-{Number(row['Uang Keluar']).toLocaleString('id-ID')}</span>}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <button 
                      onClick={() => handleEditClick(row)}
                      className="bg-white border border-gray-200 text-gray-900 px-5 py-2.5 rounded-2xl hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all font-bold text-sm inline-flex items-center gap-2 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-indigo-100 group-hover:shadow-lg"
                    >
                      Buka Review
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Modal */}
      {editingRow && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in transition-opacity duration-300">
           <div className="bg-white rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="p-8 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                 <div>
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-2">
                       <CheckCircle size={14} />
                       Verifikasi Transaksi
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">ID Transaksi: {editingRow.ID}</h2>
                 </div>
                 <button onClick={() => setEditingRow(null)} className="p-2 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200">
                    <AlertCircle size={24} className="rotate-45" />
                 </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-10">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left: Metadata */}
                    <div className="space-y-6">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">Informasi Utama</label>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-xs text-gray-400 mb-1">Tanggal</p>
                                <input type="text" name="Tanggal" value={formData.Tanggal || ''} onChange={handleFormChange} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all" />
                             </div>
                             <div>
                                <p className="text-xs text-gray-400 mb-1">Kategori Akun</p>
                                <input type="text" name="Akun" value={formData.Akun || ''} onChange={handleFormChange} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all" />
                             </div>
                          </div>
                          <div>
                             <p className="text-xs text-gray-400 mb-1">Uraian / Deskripsi Lengkap</p>
                             <textarea name="Uraian" value={formData.Uraian || ''} onChange={handleFormChange} rows={3} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all resize-none" />
                          </div>
                       </div>

                       <div className="space-y-4 pt-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-emerald-500 pl-3">Nominal Transaksi</label>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-emerald-50 rounded-3xl p-4">
                                <p className="text-[10px] text-emerald-600 font-bold mb-1 uppercase">Pemasukan (+)</p>
                                <input type="number" name="Uang Masuk" value={formData['Uang Masuk'] || ''} onChange={handleFormChange} className="w-full bg-transparent border-none p-0 text-xl font-black text-emerald-700 placeholder-emerald-200 focus:ring-0" placeholder="0" />
                             </div>
                             <div className="bg-red-50 rounded-3xl p-4">
                                <p className="text-[10px] text-red-600 font-bold mb-1 uppercase">Pengeluaran (-)</p>
                                <input type="number" name="Uang Keluar" value={formData['Uang Keluar'] || ''} onChange={handleFormChange} className="w-full bg-transparent border-none p-0 text-xl font-black text-red-700 placeholder-red-200 focus:ring-0" placeholder="0" />
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Right: Pictures & Decision */}
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-amber-500 pl-3">Bukti Fisik & Nota</label>
                          <div className="bg-gray-50 rounded-3xl p-6 min-h-[160px] flex items-center justify-center">
                             {(formData.Link_Foto_Nota || formData.Link_Foto_Barang || formData.Link_Foto_Kegiatan || formData.link_bukti_transfer) ? (
                               <div className="flex flex-wrap gap-4 justify-center">
                                  {renderPhotos(formData.Link_Foto_Nota)}
                                  {renderPhotos(formData.Link_Foto_Barang)}
                                  {renderPhotos(formData.Link_Foto_Kegiatan)}
                                  {renderPhotos(formData.link_bukti_transfer)}
                               </div>
                             ) : (
                               <div className="text-center">
                                  <Eye size={32} className="mx-auto text-gray-300 mb-2" />
                                  <p className="text-xs text-gray-400 italic">Tidak ada lampiran gambar.</p>
                               </div>
                             )}
                          </div>
                       </div>

                       <div className="space-y-4 pt-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-2 border-indigo-600 pl-3">Keputusan Akhir</label>
                          <div className="space-y-3">
                             <select name="Disetujui" value={formData.Disetujui || ''} onChange={handleFormChange} className="w-full bg-indigo-600 text-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer">
                                <option value="">⏳ BELUM DIPUTUSKAN</option>
                                <option value="ok">✅ SETUJU / TERVERIFIKASI</option>
                                <option value="Perbaiki">❌ TOLAK / PERBAIKI</option>
                             </select>
                             <input type="text" name="Catatan" value={formData.Catatan || ''} onChange={handleFormChange} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Tambahkan catatan jika perlu..." />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 bg-gray-50 flex justify-end gap-4 border-t border-gray-100">
                 <button onClick={() => setEditingRow(null)} className="px-8 py-4 rounded-2xl text-gray-500 font-bold hover:bg-white transition-all">Batal</button>
                 <button onClick={handleSave} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all">SIMPAN KEPUTUSAN</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
