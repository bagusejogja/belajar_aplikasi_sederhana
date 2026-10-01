'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Clock, X, Check } from 'lucide-react';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime?: string; // HH:mm (default '00:00')
  endTime?: string;   // HH:mm (default '23:59')
}

export interface DateRangePickerProps {
  label?: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
  showTime?: boolean;
  className?: string;
}

export default function DateRangePicker({
  label,
  value,
  onChange,
  showTime = true,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(value.startDate);
  const [tempEnd, setTempEnd] = useState(value.endDate);
  const [tempStartTime, setTempStartTime] = useState(value.startTime || '08:00');
  const [tempEndTime, setTempEndTime] = useState(value.endTime || '17:00');
  
  // State Filter Per Bulan
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState<number>(currentDate.getMonth()); // 0-11
  const [filterYear, setFilterYear] = useState<number>(currentDate.getFullYear());
  const containerRef = useRef<HTMLDivElement>(null);

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
    if (value.startTime) setTempStartTime(value.startTime);
    if (value.endTime) setTempEndTime(value.endTime);
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const applyPreset = (daysAgo: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - daysAgo);

    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];

    setTempStart(startStr);
    setTempEnd(endStr);
    onChange({ 
      startDate: startStr, 
      endDate: endStr, 
      startTime: tempStartTime, 
      endTime: tempEndTime 
    });
    setIsOpen(false);
  };

  // Helper untuk filter per bulan (1x Klik)
  const applyMonthRange = (mIdx: number, y: number, autoClose = false) => {
    const lastDay = new Date(y, mIdx + 1, 0).getDate();
    const startStr = `${y}-${String(mIdx + 1).padStart(2, '0')}-01`;
    const endStr = `${y}-${String(mIdx + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    setTempStart(startStr);
    setTempEnd(endStr);

    if (autoClose) {
      onChange({
        startDate: startStr,
        endDate: endStr,
        startTime: tempStartTime,
        endTime: tempEndTime
      });
      setIsOpen(false);
    }
  };

  const applyTimePreset = (startT: string, endT: string) => {
    setTempStartTime(startT);
    setTempEndTime(endT);
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange({ 
        startDate: tempStart, 
        endDate: tempEnd, 
        startTime: tempStartTime, 
        endTime: tempEndTime 
      });
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Calendar size={11} className="text-gray-400 shrink-0" />
          <span>{label}</span>
        </label>
      )}

      {/* Unified Trigger Box with Date and Time & Vertical Separator Line */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-3.5 text-xs bg-white border border-gray-200 rounded-2xl hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs select-none"
      >
        <div className="flex items-center gap-2 text-gray-700 min-w-0">
          <Calendar size={14} className="text-blue-600 shrink-0" />
          <span className="font-semibold text-xs truncate">
            {formatDateIndo(value.startDate)}
            {showTime && value.startTime && (
              <span className="font-mono text-gray-500 font-normal"> ({value.startTime})</span>
            )}{' '}
            <span className="text-gray-400 font-normal">s/d</span>{' '}
            {formatDateIndo(value.endDate)}
            {showTime && value.endTime && (
              <span className="font-mono text-gray-500 font-normal"> ({value.endTime})</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          {/* Garis Pemisah Vertikal | Sesuai Standar Autocomplete & MultiSelect */}
          <div className="h-5 w-px bg-gray-200/90 mx-0.5 shrink-0" />
          <div className="p-1 rounded-md text-gray-400">
            <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </div>

      {/* Unified Popover Panel with Date & Time */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4 w-[340px] sm:w-[440px] animate-in fade-in-50 zoom-in-95 duration-100 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600" />
              Pilih Rentang Tanggal & Waktu
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Date Presets */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Preset Tanggal Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-gray-200 transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-gray-200 transition-colors cursor-pointer"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-2 py-0.5 text-[10px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-gray-200 transition-colors cursor-pointer"
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setFilterMonth(now.getMonth());
                  setFilterYear(now.getFullYear());
                  applyMonthRange(now.getMonth(), now.getFullYear(), true);
                }}
                className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 transition-colors cursor-pointer"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => {
                  const prev = new Date();
                  prev.setMonth(prev.getMonth() - 1);
                  setFilterMonth(prev.getMonth());
                  setFilterYear(prev.getFullYear());
                  applyMonthRange(prev.getMonth(), prev.getFullYear(), true);
                }}
                className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 transition-colors cursor-pointer"
              >
                Bulan Lalu
              </button>
            </div>
          </div>

          {/* Filter Per Bulan & Tahun (1x Klik) */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-emerald-600" />
                Filter Per Bulan (Pilihan Bulan & Tahun):
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                1x Klik Auto Range
              </span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 items-center">
              <div className="col-span-6">
                <select
                  value={filterMonth}
                  onChange={(e) => {
                    const m = parseInt(e.target.value);
                    setFilterMonth(m);
                    applyMonthRange(m, filterYear, false);
                  }}
                  className="w-full h-8 text-xs bg-white border border-gray-200 rounded-lg px-2 font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={idx} value={idx}>{mName}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <select
                  value={filterYear}
                  onChange={(e) => {
                    const y = parseInt(e.target.value);
                    setFilterYear(y);
                    applyMonthRange(filterMonth, y, false);
                  }}
                  className="w-full h-8 text-xs bg-white border border-gray-200 rounded-lg px-2 font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {[2023, 2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <button
                  type="button"
                  onClick={() => applyMonthRange(filterMonth, filterYear, true)}
                  className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                  title="Terapkan rentang bulan ini langsung"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>

          {/* Date Range Inputs Manual */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Tanggal Mulai:</span>
              <input
                type="date"
                value={tempStart}
                onChange={(e) => setTempStart(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Tanggal Selesai:</span>
              <input
                type="date"
                value={tempEnd}
                onChange={(e) => setTempEnd(e.target.value)}
                className="w-full h-8 px-2 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-800"
              />
            </div>
          </div>

          {/* Time Selector (Jam Mulai & Jam Selesai) */}
          {showTime && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <Clock size={12} className="text-indigo-600" />
                  Rentang Jam (Waktu):
                </span>
                {/* Time Presets */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyTimePreset('08:00', '16:00')}
                    className="text-[9.5px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-bold cursor-pointer"
                  >
                    Jam Kerja (08-16)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTimePreset('00:00', '23:59')}
                    className="text-[9.5px] px-1.5 py-0.2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-bold cursor-pointer"
                  >
                    24 Jam Penuh
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-mono">Dari:</span>
                  <input
                    type="time"
                    value={tempStartTime}
                    onChange={(e) => setTempStartTime(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-gray-800"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 font-mono">Sampai:</span>
                  <input
                    type="time"
                    value={tempEndTime}
                    onChange={(e) => setTempEndTime(e.target.value)}
                    className="w-full h-8 px-2 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-gray-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Terapkan Rentang & Jam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
