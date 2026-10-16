"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, X, Sliders, CheckCircle2 } from 'lucide-react';

export interface RkaRuleItem {
  id: number;
  priority?: number;
  unit?: string;
  akun: string;
  kata_kunci?: string;
  target_field?: string;
  nilai_klasifikasi: string;
  keterangan?: string;
  modul?: string;
}

interface AkunPembentukTooltipProps {
  label: string;
  rows?: any[];
  rules?: RkaRuleItem[];
  formatRp: (val: number) => string;
  type?: 'penerimaan' | 'belanja';
  className?: string;
}

export default function AkunPembentukTooltip({
  label,
  rows = [],
  rules = [],
  formatRp,
  type = 'penerimaan',
  className = ''
}: AkunPembentukTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Temukan Aturan / Rules yang memetakan ke pos ini
  const matchedRules = useMemo(() => {
    if (!rules || rules.length === 0) return [];
    const normLabel = label.toLowerCase().trim();

    // Himpun klasifikasi unik dari baris data pos ini
    const classificationsInRows = new Set<string>();
    classificationsInRows.add(normLabel);

    rows.forEach(r => {
      const cls = type === 'penerimaan'
        ? (r.format_proposal || r.kelompok_penerimaan)
        : ((r.tags && r.tags['proposal rkat']) || r.identifikasi_lain || r.kategori_belanja);
      if (cls) classificationsInRows.add(String(cls).toLowerCase().trim());
    });

    // Himpun kode MAK unik
    const makPrefixes = new Set<string>();
    rows.forEach(r => {
      const rawName = (type === 'penerimaan' ? r.nama_akun_penerimaan : r.akun_detail) || '';
      const m = rawName.match(/^([0-9]{3,6})/);
      if (m) makPrefixes.add(m[1]);
    });

    // Filter rules yang relevan
    const matched = rules.filter(r => {
      if (r.modul && r.modul !== type && r.modul !== 'semua') return false;

      const rKlas = (r.nilai_klasifikasi || '').toLowerCase().trim();
      if (classificationsInRows.has(rKlas)) return true;

      // Pencocokan substring label
      if (rKlas && (normLabel.includes(rKlas) || rKlas.includes(normLabel))) return true;

      // Pencocokan pola akun rule dengan data riil
      const rAkuns = (r.akun || '').split(',').map((s: string) => s.trim().replace(/\*/g, ''));
      const isAkunMatch = rAkuns.some((a: string) => a && Array.from(makPrefixes).some(p => p.startsWith(a) || a.startsWith(p)));
      if (isAkunMatch && (classificationsInRows.has(rKlas) || normLabel.includes('lainnya') || normLabel.includes('surplus'))) return true;

      return false;
    });

    return matched;
  }, [rules, label, rows, type]);

  // 2. Agregasi Akun Riil (Cukup ringkasan per Akun, tanpa detail transaksi panjang)
  const accountSummary = useMemo(() => {
    if (!rows || rows.length === 0) return [];

    const map: Record<string, { namaAkun: string; kodeMak: string; count: number; total: number }> = {};

    rows.forEach(r => {
      const rawName = (type === 'penerimaan'
        ? (r.nama_akun_penerimaan || r.akun || 'Akun Lainnya')
        : (r.akun_detail || r.nama_akun || r.akun || 'Akun Lainnya')).trim();

      const pagu = type === 'penerimaan'
        ? (Number(r.renterima_pagu) || 0)
        : (Number(r.anggaran) || 0);

      const makMatch = rawName.match(/^([0-9]{4,6}(?:\.[0-9]+)*)/);
      const kodeMak = makMatch ? makMatch[1] : '';

      if (!map[rawName]) {
        map[rawName] = {
          namaAkun: rawName,
          kodeMak,
          count: 0,
          total: 0
        };
      }
      map[rawName].count += 1;
      map[rawName].total += pagu;
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [rows, type]);

  const totalNominal = useMemo(() => {
    return accountSummary.reduce((acc, curr) => acc + curr.total, 0);
  }, [accountSummary]);

  // 3. Format pola akun untuk keterangan paling atas (sesuai request user)
  const akunSummaryText = useMemo(() => {
    if (matchedRules.length > 0) {
      const pats = matchedRules
        .map(r => (r.akun || '').trim())
        .filter(Boolean);
      const uniquePats = Array.from(new Set(pats.flatMap(p => p.split(',').map(s => s.trim())))).filter(Boolean);
      if (uniquePats.length > 0) {
        return uniquePats.join(', ');
      }
    }

    const makCodes = Array.from(new Set(accountSummary.map(a => a.kodeMak).filter(Boolean)));
    if (makCodes.length > 0) {
      return makCodes.map(c => `${c}*`).join(', ');
    }

    return '-';
  }, [matchedRules, accountSummary]);

  // 4. Cakupan Unit Kerja
  const unitScopeText = useMemo(() => {
    if (matchedRules.length > 0) {
      const specificUnits = matchedRules
        .map(r => r.unit?.trim())
        .filter(u => u && u !== '*' && u.toLowerCase() !== 'semua' && u.toLowerCase() !== 'all');
      if (specificUnits.length > 0) {
        return Array.from(new Set(specificUnits)).join('; ');
      }
    }

    const distinctUnits = new Set<string>();
    rows.forEach(r => {
      const u = type === 'penerimaan' ? r.unit_kerja : r.unit;
      if (u) distinctUnits.add(u.trim());
    });

    if (distinctUnits.size > 1) {
      return `Semua Unit Kerja (${distinctUnits.size} unit)`;
    } else if (distinctUnits.size === 1) {
      return Array.from(distinctUnits)[0];
    }

    return 'Semua Unit Kerja (*)';
  }, [matchedRules, rows, type]);

  const updateCoordinates = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 440; // px
    let left = rect.left;
    let top = rect.bottom + 6;

    // Geser jika menabrak tepi kanan layar
    if (left + tooltipWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - tooltipWidth - 16);
    }

    // Geser ke atas tombol jika menabrak tepi bawah layar
    const estimatedHeight = Math.min(460, (matchedRules.length * 70) + (accountSummary.length * 36) + 160);
    if (top + estimatedHeight > window.innerHeight - 16) {
      top = Math.max(16, rect.top - estimatedHeight - 6);
    }

    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    if (isPinned) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    updateCoordinates();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (isPinned) return;
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen && isPinned) {
      setIsPinned(false);
      setIsOpen(false);
    } else {
      updateCoordinates();
      setIsOpen(true);
      setIsPinned(true);
    }
  };

  useEffect(() => {
    if (!isOpen || !isPinned) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsPinned(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, isPinned]);

  if (accountSummary.length === 0 && matchedRules.length === 0) return null;

  const isPenerimaan = type === 'penerimaan';
  const themeBg = isPenerimaan ? 'bg-emerald-50' : 'bg-blue-50';
  const themeText = isPenerimaan ? 'text-emerald-800' : 'text-blue-800';
  const themeBorder = isPenerimaan ? 'border-emerald-200' : 'border-blue-200';
  const badgeColor = isPenerimaan ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`inline-flex items-center justify-center w-4 h-4 rounded-full transition-all cursor-pointer shrink-0 shadow-2xs ${
          isOpen
            ? `${badgeColor} ring-2 ring-offset-1 ring-emerald-400`
            : 'bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-700'
        }`}
        title={`Lihat ringkasan aturan (rules) pembentuk pos "${label}"`}
      >
        <Info size={11} strokeWidth={2.5} />
      </button>

      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={() => {
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 999999
          }}
          className="w-[360px] sm:w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${themeBg} ${themeText} border ${themeBorder}`}>
                  {isPenerimaan ? '💰 ATURAN PENERIMAAN' : '💼 ATURAN BELANJA'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {matchedRules.length > 0 ? `${matchedRules.length} Rule Terkait` : 'Klasifikasi Standar'} • {accountSummary.length} Akun
                </span>
              </div>
              <div className="text-xs font-black text-slate-900 truncate" title={label}>
                {label}
              </div>
            </div>

            {isPinned && (
              <button
                type="button"
                onClick={() => { setIsPinned(false); setIsOpen(false); }}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Tutup"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* BANNER UTAMA DI PALING ATAS (Keterangan Akun & Unit Sesuai Request) */}
          <div className="mb-3 p-2.5 rounded-xl bg-blue-50/90 border border-blue-200/90 shadow-2xs space-y-1">
            <div className="text-xs font-bold text-slate-900 leading-snug flex items-start gap-1.5">
              <span className="text-blue-600 font-bold shrink-0">📌</span>
              <div>
                Terdiri dari akun: <span className="font-mono font-black text-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-300 shadow-2xs inline-block">"{akunSummaryText}"</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap pl-5">
              <span className="font-medium text-slate-500">Cakupan Unit:</span>
              <span className="font-semibold text-slate-700 bg-white/80 px-1.5 py-0.2 rounded border border-slate-200 text-[10px]">
                {unitScopeText}
              </span>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 divide-y divide-slate-100">
            {/* Bagian 1: Ringkasan Rules & Keterangannya */}
            {matchedRules.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders size={12} className="text-blue-600" />
                  <span>Dasar Aturan Klasifikasi (Rules):</span>
                </div>

                <div className="space-y-1.5">
                  {matchedRules.map((rule) => (
                    <div 
                      key={rule.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded border border-blue-200">
                            Pola: {rule.akun}
                          </span>
                          {rule.kata_kunci && rule.kata_kunci !== '*' && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded border border-amber-200">
                              Keyword: {rule.kata_kunci}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">
                          ID #{rule.id}
                        </span>
                      </div>

                      {/* Keterangan Aturan (Human Readable) */}
                      <div className="text-xs font-semibold text-slate-900 flex items-start gap-1.5 leading-snug">
                        <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-800">
                            {rule.keterangan || rule.nilai_klasifikasi}
                          </span>
                          {rule.keterangan && rule.keterangan !== rule.nilai_klasifikasi && (
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                              Target Pos: <span className="font-medium text-slate-700">{rule.nilai_klasifikasi}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bagian 2: Ringkasan Akun Pembentuk & Total Nominal */}
            <div className="pt-2.5 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                <span>Akun & Total Realisasi:</span>
                <span className="font-mono text-[10px] text-slate-400">{rows.length.toLocaleString('id-ID')} transaksi</span>
              </div>

              <div className="space-y-1.5">
                {accountSummary.map((item, idx) => {
                  const pct = totalNominal > 0
                    ? ((item.total / totalNominal) * 100).toFixed(1)
                    : '0';

                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {item.kodeMak && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                            item.kodeMak === '42701'
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-black'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.kodeMak}
                          </span>
                        )}
                        <span className="text-xs font-medium text-slate-800 truncate" title={item.namaAkun}>
                          {item.namaAkun.replace(/^[0-9.]+\s*/, '') || item.namaAkun}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-xs text-slate-900 block">
                          Rp {formatRp(item.total)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {pct}% ({item.count} trx)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 bg-slate-50/70 -mx-4 -mb-4 p-2.5 rounded-b-2xl">
            <span className="text-slate-500">
              💡 <span>Aturan dapat dikonfigurasi di menu <b>/rka/rules</b></span>
            </span>
            <span className="font-mono font-black text-slate-900 text-xs">
              Total: Rp {formatRp(totalNominal)}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
