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
  const containerRef = useRef<HTMLDivElement>(null);

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
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Unified Trigger Box with Date and Time */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 text-xs bg-white border border-gray-200 rounded-xl hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs select-none"
      >
        <div className="flex items-center gap-2 text-gray-700 min-w-0">
          <Calendar size={14} className="text-blue-600 shrink-0" />
          <span className="font-semibold text-xs truncate">
            {formatDateIndo(value.startDate)}
            {showTime && value.startTime && (
              <span className="font-mono text-gray-500 font-normal"> ({value.startTime})</span>
            )}{' '}
            <span className="text-gray-400">s/d</span>{' '}
            {formatDateIndo(value.endDate)}
            {showTime && value.endTime && (
              <span className="font-mono text-gray-500 font-normal"> ({value.endTime})</span>
            )}
          </span>
        </div>

        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
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
              Preset Tanggal:
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
            </div>
          </div>

          {/* Date Range Inputs */}
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
