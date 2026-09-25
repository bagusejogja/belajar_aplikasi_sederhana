import React from 'react';
import { 
  Check, 
  Clock, 
  AlertTriangle, 
  FileCheck2, 
  Building2, 
  UserCheck, 
  ScrollText 
} from 'lucide-react';

export interface StepItem {
  id: string | number;
  title: string;
  desc?: string;
  role?: string;
  date?: string;
  status: 'completed' | 'current' | 'pending' | 'revision';
}

export interface VerificationStepperProps {
  steps?: StepItem[];
  currentStepIndex?: number;
  onStepClick?: (step: StepItem, index: number) => void;
  className?: string;
}

export default function VerificationStepper({
  steps,
  currentStepIndex = 1,
  onStepClick,
  className = ''
}: VerificationStepperProps) {
  const defaultSteps: StepItem[] = [
    {
      id: 1,
      title: 'Pengajuan Unit Kerja',
      desc: 'Usulan RKA diunggah oleh Operator',
      role: 'Fakultas / Unit',
      date: '22 Sep 2026, 09:00',
      status: 'completed'
    },
    {
      id: 2,
      title: 'Verifikasi Administrasi',
      desc: 'Pemeriksaan kesesuaian SBU & volume',
      role: 'Staf Verifikator',
      date: '24 Sep 2026, 10:15',
      status: 'completed'
    },
    {
      id: 3,
      title: 'Review Dir. Keuangan',
      desc: 'Persetujuan pagu & alokasi anggaran',
      role: 'Direktur Keuangan',
      date: 'Sedang Berlangsung',
      status: 'current'
    },
    {
      id: 4,
      title: 'Penetapan SK Rektor',
      desc: 'Pengesahan dan penerbitan SK resmi',
      role: 'Rektor UGM',
      date: 'Menunggu',
      status: 'pending'
    }
  ];

  const activeSteps = steps || defaultSteps;

  return (
    <div className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-blue-600" />
            Alur Tahapan Verifikasi & Persetujuan (Workflow Stepper)
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Pelacakan posisi berkas secara real-time dari pengajuan awal hingga SK penetapan.
          </p>
        </div>
        <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/60 hidden sm:inline">
          Tahap 3 dari 4
        </span>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeSteps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isRevision = step.status === 'revision';
            const isPending = step.status === 'pending';

            return (
              <div
                key={step.id}
                onClick={() => onStepClick && onStepClick(step, index)}
                className={`relative flex flex-col p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20'
                    : isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 hover:bg-emerald-50/80'
                    : isRevision
                    ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50/60 dark:bg-slate-850/60 border-slate-200 dark:border-slate-800 text-slate-400 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Step Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Circle Indicator */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white animate-pulse'
                          : isRevision
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : index + 1}
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      Step {index + 1}
                    </span>
                  </div>

                  {/* Status Pill */}
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : isCurrent
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : isRevision
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? 'Selesai' : isCurrent ? 'Proses' : isRevision ? 'Revisi' : 'Menunggu'}
                  </span>
                </div>

                {/* Step Details */}
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {step.title}
                </h5>

                {step.desc && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                )}

                {/* Footer Metadata */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
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
      </div>
    </div>
  );
}
