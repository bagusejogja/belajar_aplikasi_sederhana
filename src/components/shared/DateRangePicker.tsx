'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, X, Clock } from 'lucide-react';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface DateRangePickerProps {
  label?: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export default function DateRangePicker({
  label,
  value,
  onChange,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(value.startDate);
  const [tempEnd, setTempEnd] = useState(value.endDate);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempStart(value.startDate);
    setTempEnd(value.endDate);
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
    onChange({ startDate: startStr, endDate: endStr });
    setIsOpen(false);
  };

  const applyMonthPreset = (year: number, month: number) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

    setTempStart(startStr);
    setTempEnd(endStr);
    onChange({ startDate: startStr, endDate: endStr });
    setIsOpen(false);
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange({ startDate: tempStart, endDate: tempEnd });
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Unified Trigger Box (Single Click) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 text-xs bg-white border border-gray-200 rounded-xl hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs select-none"
      >
        <div className="flex items-center gap-2 text-gray-700 min-w-0">
          <Calendar size={14} className="text-blue-600 shrink-0" />
          <span className="font-semibold text-xs truncate">
            {formatDateIndo(value.startDate)} <span className="text-gray-400">s/d</span> {formatDateIndo(value.endDate)}
          </span>
        </div>

        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Unified Popover Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4 w-[330px] sm:w-[420px] animate-in fade-in-50 zoom-in-95 duration-100 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600" />
              Pilih Rentang Tanggal
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Pilihan Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="px-2.5 py-1 text-[11px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-gray-200 transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="px-2.5 py-1 text-[11px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-gray-200 transition-colors cursor-pointer"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-2.5 py-1 text-[11px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-gray-200 transition-colors cursor-pointer"
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyMonthPreset(2026, 9)}
                className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                Bulan Ini (Sep 2026)
              </button>
              <button
                type="button"
                onClick={() => applyMonthPreset(2026, 8)}
                className="px-2.5 py-1 text-[11px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-gray-200 transition-colors cursor-pointer"
              >
                Bulan Lalu (Agu 2026)
              </button>
            </div>
          </div>

          {/* Unified Custom Range Input in One Screen */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
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

          {/* Actions */}
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
              Terapkan Rentang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
