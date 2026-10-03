'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, Check, RotateCcw, Sparkles } from 'lucide-react';

export interface MonthRange {
  startMonth: string; // Format: 'YYYY-MM', e.g. '2026-01'
  endMonth: string;   // Format: 'YYYY-MM', e.g. '2026-06'
  startDate?: string; // Format: 'YYYY-MM-01'
  endDate?: string;   // Format: 'YYYY-MM-DD' (last day of endMonth)
}

export interface MonthRangePickerProps {
  label?: string;
  value: MonthRange;
  onChange: (range: MonthRange) => void;
  className?: string;
  align?: 'left' | 'right';
  placeholder?: string;
}

const MONTH_NAMES = [
  { num: '01', short: 'Jan', full: 'Januari' },
  { num: '02', short: 'Feb', full: 'Februari' },
  { num: '03', short: 'Mar', full: 'Maret' },
  { num: '04', short: 'Apr', full: 'April' },
  { num: '05', short: 'Mei', full: 'Mei' },
  { num: '06', short: 'Jun', full: 'Juni' },
  { num: '07', short: 'Jul', full: 'Juli' },
  { num: '08', short: 'Agu', full: 'Agustus' },
  { num: '09', short: 'Sep', full: 'September' },
  { num: '10', short: 'Okt', full: 'Oktober' },
  { num: '11', short: 'Nov', full: 'November' },
  { num: '12', short: 'Des', full: 'Desember' },
];

/**
 * Helper menghitung tanggal terakhir dari suatu bulan 'YYYY-MM'
 */
function getLastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Helper format MonthRange lengkap dengan tanggal awal & akhir
 */
function buildFullMonthRange(startMonth: string, endMonth: string): MonthRange {
  let [sY, sM] = startMonth.split('-').map(Number);
  let [eY, eM] = endMonth.split('-').map(Number);

  // Jika terbalik, tukar
  if (sY > eY || (sY === eY && sM > eM)) {
    [sY, eY] = [eY, sY];
    [sM, eM] = [eM, sM];
    [startMonth, endMonth] = [endMonth, startMonth];
  }

  const lastDay = getLastDayOfMonth(eY, eM - 1);
  return {
    startMonth,
    endMonth,
    startDate: `${startMonth}-01`,
    endDate: `${endMonth}-${String(lastDay).padStart(2, '0')}`,
  };
}

export default function MonthRangePicker({
  label,
  value,
  onChange,
  className = '',
  align = 'left',
  placeholder = 'Pilih rentang bulan...',
}: MonthRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse tahun dari value atau tahun saat ini
  const initialYear = useMemo(() => {
    if (value?.startMonth) {
      const y = parseInt(value.startMonth.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  }, [value?.startMonth]);

  const [activeYear, setActiveYear] = useState<number>(initialYear);

  // Selection draft state: null | { startMonth: string, endMonth: string | null }
  const [pickingStart, setPickingStart] = useState<string | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Sync activeYear saat value berubah dari luar
  useEffect(() => {
    if (value?.startMonth) {
      const y = parseInt(value.startMonth.split('-')[0], 10);
      if (!isNaN(y)) setActiveYear(y);
    }
  }, [value?.startMonth]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setPickingStart(null);
        setHoveredMonth(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format label tampilan tombol (Tanpa Tanggal)
  const displayLabel = useMemo(() => {
    if (!value?.startMonth || !value?.endMonth) return placeholder;

    const [sY, sM] = value.startMonth.split('-');
    const [eY, eM] = value.endMonth.split('-');

    const sName = MONTH_NAMES[parseInt(sM, 10) - 1]?.full || sM;
    const eName = MONTH_NAMES[parseInt(eM, 10) - 1]?.full || eM;

    // Hitung jumlah bulan terpilih
    const diffMonths = (parseInt(eY, 10) - parseInt(sY, 10)) * 12 + (parseInt(eM, 10) - parseInt(sM, 10)) + 1;
    const monthCountLabel = `${diffMonths} Bulan`;

    if (value.startMonth === value.endMonth) {
      return {
        text: `${sName} ${sY}`,
        count: '1 Bulan',
        isSame: true,
      };
    }

    if (sY === eY) {
      return {
        text: `${sName} — ${eName} ${sY}`,
        count: monthCountLabel,
        isSame: false,
      };
    }

    return {
      text: `${sName} ${sY} — ${eName} ${eY}`,
      count: monthCountLabel,
      isSame: false,
    };
  }, [value, placeholder]);

  // Handler klik bulan pada kalender bulan
  const handleMonthClick = (mNum: string) => {
    const clickedMonth = `${activeYear}-${mNum}`;

    if (!pickingStart) {
      // Step 1: User memilih bulan awal
      setPickingStart(clickedMonth);
    } else {
      // Step 2: User memilih bulan akhir -> Finalisasi Range
      const newRange = buildFullMonthRange(pickingStart, clickedMonth);
      onChange(newRange);
      setPickingStart(null);
      setHoveredMonth(null);
      setIsOpen(false);
    }
  };

  // Helper cek apakah bulan tertentu berada di dalam rentang
  const getMonthState = (mNum: string) => {
    const curMonth = `${activeYear}-${mNum}`;

    // Mode picking aktif (sedang memilih titik kedua)
    if (pickingStart) {
      const targetHover = hoveredMonth || pickingStart;
      let [minM, maxM] = [pickingStart, targetHover];
      if (minM > maxM) [minM, maxM] = [maxM, minM];

      const isStart = curMonth === pickingStart;
      const isHovered = curMonth === hoveredMonth;
      const isInRange = curMonth >= minM && curMonth <= maxM;

      return {
        isStart,
        isEnd: isHovered,
        isInRange,
        isSelecting: true,
      };
    }

    // Mode normal (berdasarkan value saat ini)
    if (!value?.startMonth || !value?.endMonth) {
      return { isStart: false, isEnd: false, isInRange: false, isSelecting: false };
    }

    const isStart = curMonth === value.startMonth;
    const isEnd = curMonth === value.endMonth;
    const isInRange = curMonth >= value.startMonth && curMonth <= value.endMonth;

    return { isStart, isEnd, isInRange, isSelecting: false };
  };

  // Preset 1x Klik Cepat
  const applyPreset = (preset: 'thisMonth' | 'q1' | 'q2' | 'q3' | 'q4' | 'sem1' | 'sem2' | 'fullYear' | 'last3Months' | 'last6Months') => {
    const y = activeYear;
    let sM = '01';
    let eM = '12';

    switch (preset) {
      case 'thisMonth': {
        const curM = String(new Date().getMonth() + 1).padStart(2, '0');
        const curY = new Date().getFullYear();
        setActiveYear(curY);
        onChange(buildFullMonthRange(`${curY}-${curM}`, `${curY}-${curM}`));
        setIsOpen(false);
        setPickingStart(null);
        return;
      }
      case 'q1':
        sM = '01';
        eM = '03';
        break;
      case 'q2':
        sM = '04';
        eM = '06';
        break;
      case 'q3':
        sM = '07';
        eM = '09';
        break;
      case 'q4':
        sM = '10';
        eM = '12';
        break;
      case 'sem1':
        sM = '01';
        eM = '06';
        break;
      case 'sem2':
        sM = '07';
        eM = '12';
        break;
      case 'fullYear':
        sM = '01';
        eM = '12';
        break;
      case 'last3Months': {
        const now = new Date();
        const endD = new Date(now.getFullYear(), now.getMonth(), 1);
        const startD = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const startStr = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}`;
        const endStr = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}`;
        onChange(buildFullMonthRange(startStr, endStr));
        setIsOpen(false);
        setPickingStart(null);
        return;
      }
      case 'last6Months': {
        const now = new Date();
        const endD = new Date(now.getFullYear(), now.getMonth(), 1);
        const startD = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const startStr = `${startD.getFullYear()}-${String(startD.getMonth() + 1).padStart(2, '0')}`;
        const endStr = `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, '0')}`;
        onChange(buildFullMonthRange(startStr, endStr));
        setIsOpen(false);
        setPickingStart(null);
        return;
      }
    }

    onChange(buildFullMonthRange(`${y}-${sM}`, `${y}-${eM}`));
    setIsOpen(false);
    setPickingStart(null);
    setHoveredMonth(null);
  };

  return (
    <div className={`relative ${className.includes('w-full') ? 'w-full' : 'inline-block'} text-left ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Calendar size={11} className="text-gray-400 shrink-0" />
          <span>{label}</span>
        </label>
      )}

      {/* TRIGGER BUTTON (Tanpa Tanggal - Format Bulan & Tahun Bersih) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setPickingStart(null);
          setHoveredMonth(null);
        }}
        className={`w-full h-10 px-3.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between gap-2.5 shadow-2xs cursor-pointer select-none bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-700 dark:text-indigo-400'
            : 'border-gray-200/90 dark:border-slate-700 text-gray-800 dark:text-gray-200 hover:border-gray-300'
        }`}
        title="Klik untuk membuka pemilih rentang bulan (Tanpa Tanggal)"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate">
            {typeof displayLabel === 'string' ? displayLabel : displayLabel.text}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {typeof displayLabel !== 'string' && displayLabel.count && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[10px] font-black border border-indigo-200/70 dark:border-indigo-800/60">
              {displayLabel.count}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}
          />
        </div>
      </button>

      {/* DROPDOWN POPOVER KALENDER BULAN */}
      {isOpen && (
        <div
          className={`absolute z-[999] mt-1.5 w-[380px] sm:w-[440px] p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 space-y-3.5 select-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header Popover: Petunjuk & Tahun Aktif */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Sparkles size={12} />
                {pickingStart ? 'Langkah 2: Pilih Bulan Akhir' : 'Langkah 1: Pilih Bulan Awal'}
              </span>
              <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                {pickingStart ? (
                  <span>
                    Bulan Awal: <strong className="text-indigo-700 font-mono">{pickingStart}</strong>
                  </span>
                ) : (
                  'Klik 1 bulan untuk awal, klik bulan kedua untuk akhir'
                )}
              </p>
            </div>

            {/* Selector Tahun (‹ 2026 ›) */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveYear(activeYear - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                title="Tahun Sebelumnya"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 font-mono font-black text-xs text-gray-900 dark:text-gray-100">
                {activeYear}
              </span>
              <button
                type="button"
                onClick={() => setActiveYear(activeYear + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                title="Tahun Selanjutnya"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Quick Presets (1x Klik Cepat) */}
          <div className="space-y-1.5">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block">
              Pilihan Cepat (1x Klik):
            </span>
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Bulan Ini', action: () => applyPreset('thisMonth') },
                { label: 'Triwulan 1 (Q1)', action: () => applyPreset('q1') },
                { label: 'Triwulan 2 (Q2)', action: () => applyPreset('q2') },
                { label: 'Triwulan 3 (Q3)', action: () => applyPreset('q3') },
                { label: 'Triwulan 4 (Q4)', action: () => applyPreset('q4') },
                { label: 'Semester 1', action: () => applyPreset('sem1') },
                { label: 'Semester 2', action: () => applyPreset('sem2') },
                { label: 'Tahun Penuh', action: () => applyPreset('fullYear') },
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={p.action}
                  className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 hover:text-indigo-700 dark:text-gray-300 dark:hover:text-indigo-300 border border-slate-200/80 dark:border-slate-700/80 rounded-lg text-[10px] font-bold transition-all text-center truncate cursor-pointer active:scale-95"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid 12 Bulan (3 Kolom x 4 Baris) - Murni Bulan Tanpa Angka Tanggal */}
          <div className="space-y-1.5">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 block">
              Pilih Rentang Bulan Tahun {activeYear}:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((m) => {
                const curMonth = `${activeYear}-${m.num}`;
                const state = getMonthState(m.num);

                // Styling state rentang bulan
                let btnStyle = 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-indigo-50 text-gray-700 dark:text-gray-300 border border-slate-200 dark:border-slate-700';

                if (state.isStart && state.isEnd) {
                  btnStyle = 'bg-indigo-600 text-white border-indigo-600 font-black shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-800';
                } else if (state.isStart) {
                  btnStyle = 'bg-indigo-600 text-white border-indigo-600 font-black shadow-sm';
                } else if (state.isEnd) {
                  btnStyle = 'bg-indigo-600 text-white border-indigo-600 font-black shadow-sm';
                } else if (state.isInRange) {
                  btnStyle = 'bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 border-indigo-200/80 dark:border-indigo-800 font-bold';
                }

                return (
                  <button
                    key={m.num}
                    type="button"
                    onClick={() => handleMonthClick(m.num)}
                    onMouseEnter={() => pickingStart && setHoveredMonth(curMonth)}
                    className={`p-2.5 rounded-xl text-left transition-all relative flex flex-col justify-between cursor-pointer active:scale-95 ${btnStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold opacity-60">
                        {m.num}
                      </span>
                      {(state.isStart || state.isEnd) && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white font-black uppercase">
                          {state.isStart && state.isEnd ? '1 Bln' : state.isStart ? 'Awal' : 'Akhir'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="text-xs font-black block leading-tight">
                        {m.full}
                      </span>
                      <span className="text-[9.5px] opacity-75 block font-mono mt-0.5">
                        {m.short} {activeYear}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Bar: Rincian Rentang Aktif & Tombol Reset / Selesai */}
          <div className="pt-2.5 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const curY = new Date().getFullYear();
                const curM = String(new Date().getMonth() + 1).padStart(2, '0');
                onChange(buildFullMonthRange(`${curY}-${curM}`, `${curY}-${curM}`));
                setPickingStart(null);
                setHoveredMonth(null);
              }}
              className="text-[11px] font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset Bulan Ini</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setPickingStart(null);
                setHoveredMonth(null);
              }}
              className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Check size={12} strokeWidth={3} />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
