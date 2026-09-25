import React from 'react';
import { AlignJustify, ListFilter, Rows } from 'lucide-react';

export type TableDensity = 'compact' | 'comfortable';

export interface TableDensityToggleProps {
  density: TableDensity;
  onChange: (density: TableDensity) => void;
  className?: string;
}

export default function TableDensityToggle({
  density,
  onChange,
  className = ''
}: TableDensityToggleProps) {
  return (
    <div className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs ${className}`}>
      <button
        type="button"
        onClick={() => onChange('comfortable')}
        title="Tampilan Luwes (Comfortable)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
          density === 'comfortable'
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <Rows className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Luwes</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('compact')}
        title="Tampilan Rapat (Compact)"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
          density === 'compact'
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <AlignJustify className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Rapat</span>
      </button>
    </div>
  );
}
