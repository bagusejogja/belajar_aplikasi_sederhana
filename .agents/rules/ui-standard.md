# UI Design System & Golden Standard (Verifikasi Online)

Aturan standar tampilan UI untuk setiap halaman baru atau modifikasi halaman di project ini. Semua komponen dan halaman wajib mengikuti pedoman berikut agar selalu konsisten, rapi, dan profesional.

---

## 1. Container & Layout Halaman
- **Wrapper Utama**:
  `max-w-7xl mx-auto pb-24 space-y-4 font-sans text-gray-900`

---

## 2. Slim Header Toolbar (Header Atas)
Setiap halaman wajib memiliki Toolbar atas yang ramping dan terpadu:
```tsx
<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl border border-gray-200/80 shadow-xs">
  <div className="flex items-center gap-3">
    <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
      <Icon size={20} />
    </div>
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">Judul Halaman</h1>
        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
          Badge Status / Kategori
        </span>
      </div>
      <p className="text-gray-500 font-medium text-[11px] mt-0.5">Deskripsi singkat fungsi halaman.</p>
    </div>
  </div>

  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
    {/* Filter, Input Search, dan Tombol Aksi berada di sini */}
  </div>
</div>
```

---

## 3. Ukuran Tombol, Input & Kontrol
- **Tinggi Elemen (Height)**: Wajib seragam `h-9` (`36px`).
- **Border Radius**: `rounded-xl` (`12px`).
- **Teks**: `text-xs font-semibold`.
- **Search Input**:
  ```tsx
  <div className="relative w-full sm:w-60">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
    <input 
      type="text" 
      placeholder="Cari..." 
      className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
    />
  </div>
  ```
- **Tombol Aksi Utama**:
  - Tombol Primer: `h-9 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs`
  - Tombol Export Excel: `h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs`
  - Tombol Sekunder / Refresh: `h-9 px-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs`

---

## 4. KPI Summary Cards (Kartu Ringkasan)
- **Grid Layout**: `grid grid-cols-1 md:grid-cols-3 gap-3` (atau `grid-cols-2`/`grid-cols-4` sesuai kebutuhan data).
- **Struktur Kartu**:
  ```tsx
  <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Judul Metrik</p>
      <h3 className="text-base font-black text-gray-900 mt-0.5 font-mono truncate">
        Rp 123.456.789
      </h3>
      <span className="text-[10px] font-semibold text-indigo-600">Sub Keterangan</span>
    </div>
    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
      <Icon size={20} />
    </div>
  </div>
  ```

---

## 5. Standar Tabel & Paginasi
- **Container Tabel**:
  `bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden`
- **Tabel Header (thead)**:
  `bg-gray-50/80 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider py-3 px-4`
- **Baris Data (tr / tbody)**:
  `hover:bg-indigo-50/20 transition-colors py-2.5 px-4 text-xs`
- **Footer Paginasi**:
  ```tsx
  <div className="p-3 px-5 bg-gray-50/80 border-t border-gray-200 flex justify-between items-center">
    <span className="text-[11px] font-semibold text-gray-500">
      Halaman {currentPage} dari {totalPages}
    </span>
    <div className="flex items-center gap-1.5">
      <button 
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
        disabled={currentPage === 1} 
        className="h-8 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1 shadow-2xs"
      >
        <ChevronLeft size={14} /> Sebelumnya
      </button>
      <button 
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
        disabled={currentPage === totalPages} 
        className="h-8 px-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center gap-1 shadow-2xs"
      >
        Selanjutnya <ChevronRight size={14} />
      </button>
    </div>
  </div>
  ```

---

## 6. Angka & Mata Uang
- Format Rupiah wajib konsisten menggunakan standar Indonesia: `Rp 12.345.678` atau `Number(val).toLocaleString('id-ID')` dengan font `font-mono font-bold`.
