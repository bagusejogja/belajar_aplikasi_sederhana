'use client';

import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  AlertTriangle, 
  ScrollText, 
  ChevronRight, 
  UserCheck, 
  FileCheck2, 
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';

export interface StepItem {
  id: string | number;
  title: string;
  desc?: string;
  role?: string;
  date?: string;
  status: 'completed' | 'current' | 'pending' | 'revision';
}

export type StepperVariant = 'cards' | 'chevron' | 'timeline' | 'compact';

export interface VerificationStepperProps {
  steps?: StepItem[];
  currentStepIndex?: number;
  onStepClick?: (step: StepItem, index: number) => void;
  className?: string;
  variant?: StepperVariant;
  showVariantSwitcher?: boolean;
}

export default function VerificationStepper({
  steps,
  currentStepIndex = 2,
  onStepClick,
  className = '',
  variant: initialVariant = 'cards',
  showVariantSwitcher = true,
}: VerificationStepperProps) {
  const [selectedVariant, setSelectedVariant] = useState<StepperVariant>(initialVariant);

  const defaultSteps: StepItem[] = [
    {
      id: 1,
      title: 'Pengajuan Unit Kerja',
      desc: 'Usulan RKA diunggah oleh Operator Unit',
      role: 'Operator Fakultas / Unit',
      date: '22 Sep 2026, 09:00 WIB',
      status: 'completed'
    },
    {
      id: 2,
      title: 'Verifikasi Administrasi',
      desc: 'Pemeriksaan kesesuaian standar biaya (SBU) & volume',
      role: 'Staf Verifikator Keuangan',
      date: '24 Sep 2026, 10:15 WIB',
      status: 'completed'
    },
    {
      id: 3,
      title: 'Review Dir. Keuangan',
      desc: 'Persetujuan pagu definitif & alokasi kas',
      role: 'Direktur Keuangan UGM',
      date: 'Sedang Berlangsung',
      status: 'current'
    },
    {
      id: 4,
      title: 'Penetapan SK Rektor',
      desc: 'Pengesahan surat keputusan penetapan pagu resmi',
      role: 'Rektor Universitas Gadjah Mada',
      date: 'Menunggu Persetujuan',
      status: 'pending'
    }
  ];

  const activeSteps = steps || defaultSteps;

  return (
    <div className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4 ${className}`}>
      {/* Stepper Header with Model Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-blue-600" />
            Alur Tahapan Verifikasi & Persetujuan (Workflow Stepper)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Pelacakan posisi berkas secara real-time dari usulan awal hingga penerbitan SK.
          </p>
        </div>

        {/* Model Switcher Buttons */}
        {showVariantSwitcher && (
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 shrink-0 self-start sm:self-center">
            {[
              { id: 'cards', label: '1. Card Box' },
              { id: 'chevron', label: '2. Chevron Pipeline' },
              { id: 'timeline', label: '3. Timeline Vertikal' },
              { id: 'compact', label: '4. Kapsul Ramping' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedVariant(m.id as StepperVariant)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  selectedVariant === m.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODEL 1: CARD BOX GRID (MODEL BAKU CARD)                                  */}
      {/* ========================================================================= */}
      {selectedVariant === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 animate-in fade-in-50 duration-200">
          {activeSteps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isRevision = step.status === 'revision';

            return (
              <div
                key={step.id}
                onClick={() => onStepClick && onStepClick(step, index)}
                className={`relative flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-50/70 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                    : isCompleted
                    ? 'bg-emerald-50/40 border-emerald-300 hover:bg-emerald-50/80'
                    : isRevision
                    ? 'bg-amber-50/50 border-amber-300'
                    : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white animate-pulse'
                          : isRevision
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : index + 1}
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Tahap {index + 1}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCurrent
                        ? 'bg-blue-100 text-blue-800'
                        : isRevision
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isCompleted ? 'Selesai' : isCurrent ? 'Proses' : isRevision ? 'Revisi' : 'Menunggu'}
                  </span>
                </div>

                <h5 className="text-xs font-bold text-slate-800 leading-tight">
                  {step.title}
                </h5>

                {step.desc && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                )}

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 font-semibold truncate max-w-[120px]">
                    {step.role}
                  </span>
                  <span className="font-mono text-slate-400">
                    {step.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODEL 2: CHEVRON ARROW PIPELINE (GAYA ENTERPRISE ERP / SAP WORKFLOW)       */}
      {/* ========================================================================= */}
      {selectedVariant === 'chevron' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {activeSteps.map((step, index) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';
              const isRevision = step.status === 'revision';

              return (
                <div
                  key={step.id}
                  onClick={() => onStepClick && onStepClick(step, index)}
                  className={`relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 overflow-hidden ${
                    isCurrent
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100/70'
                      : isRevision
                      ? 'bg-amber-50 text-amber-950 border-amber-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-white text-blue-700 font-black shadow-xs'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? <Check size={14} className="stroke-[3]" /> : index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold uppercase ${
                          isCurrent ? 'text-blue-100' : 'text-slate-400'
                        }`}>
                          Langkah {index + 1}
                        </span>
                      </div>
                      <h6 className={`text-xs font-bold truncate leading-tight ${
                        isCurrent ? 'text-white' : 'text-slate-800'
                      }`}>
                        {step.title}
                      </h6>
                      <span className={`text-[10px] block truncate ${
                        isCurrent ? 'text-blue-100' : 'text-slate-400'
                      }`}>
                        {step.role}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} className={`shrink-0 ${
                    isCurrent ? 'text-white/80' : 'text-slate-300'
                  }`} />
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Model <strong>Chevron Pipeline</strong> sangat ideal untuk formulir persetujuan multi-level dan pengadaan barang/jasa.</span>
            <span className="font-mono font-bold text-blue-700 hidden sm:inline">Enterprise Workflow Pipeline</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODEL 3: VERTICAL MILESTONE TIMELINE (GAYA AUDIT TRAIL / JEJAK BERKAS)     */}
      {/* ========================================================================= */}
      {selectedVariant === 'timeline' && (
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-4 animate-in fade-in-50 duration-200">
          <div className="relative pl-6 space-y-4 border-l-2 border-blue-200 ml-3">
            {activeSteps.map((step, index) => {
              const isCompleted = step.status === 'completed';
              const isCurrent = step.status === 'current';
              const isRevision = step.status === 'revision';

              return (
                <div
                  key={step.id}
                  onClick={() => onStepClick && onStepClick(step, index)}
                  className="relative group cursor-pointer"
                >
                  {/* Bullet node on the vertical line */}
                  <div
                    className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full ring-4 ring-white flex items-center justify-center text-[9px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-blue-100 animate-pulse'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isCompleted && <Check size={10} strokeWidth={3} />}
                  </div>

                  <div className={`p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-white border-blue-300 shadow-sm ring-1 ring-blue-100'
                      : isCompleted
                      ? 'bg-white border-emerald-200'
                      : 'bg-white/60 border-slate-200 opacity-75'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Tahap {index + 1}: {step.title}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCurrent
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {step.date}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      {step.desc}
                    </p>

                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Penanggung Jawab: <strong className="text-slate-700">{step.role}</strong></span>
                      <span className="text-blue-600 group-hover:underline">Lihat Rincian &raquo;</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODEL 4: COMPACT SEGMENTED PROGRESS CAPSULE (HEMAT RUANG UNTUK HEADER FORM)*/}
      {/* ========================================================================= */}
      {selectedVariant === 'compact' && (
        <div className="space-y-3 animate-in fade-in-50 duration-200">
          <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
            {/* Progress Track */}
            <div className="relative flex items-center justify-between">
              {/* Horizontal Connecting Line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: '66%' }}
                />
              </div>

              {activeSteps.map((step, index) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';

                return (
                  <div
                    key={step.id}
                    onClick={() => onStepClick && onStepClick(step, index)}
                    className="relative z-10 flex flex-col items-center cursor-pointer group"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : isCurrent
                          ? 'bg-blue-600 text-white border-white ring-4 ring-blue-100 animate-pulse shadow-xs'
                          : 'bg-white text-slate-400 border-slate-300 group-hover:border-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check size={14} strokeWidth={3} /> : index + 1}
                    </div>

                    <div className="text-center mt-2 max-w-[120px]">
                      <span className={`block text-[11px] font-bold leading-tight ${
                        isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </span>
                      <span className="block text-[9.5px] text-slate-400 font-mono mt-0.5">
                        {step.role?.split(' ')[0] || ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Model <strong>Kapsul Ramping</strong> sangat hemat ruang, cocok diletakkan di header lembar telaah atau dokumen verifikasi.</span>
            <span className="font-mono text-emerald-700 font-bold">Progress: 75% Selesai</span>
          </div>
        </div>
      )}
    </div>
  );
}
