import React from 'react';
import { Filter, Check, Sparkles } from 'lucide-react';

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export interface QuickFilterChipsProps {
  chips: FilterChip[];
  selectedChipId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export default function QuickFilterChips({
  chips,
  selectedChipId,
  onSelect,
  className = ''
}: QuickFilterChipsProps) {
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500 pr-1">
        <Filter className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold uppercase tracking-wider hidden sm:inline">Filter Cepat:</span>
      </div>

      {chips.map((chip) => {
        const isSelected = selectedChipId === chip.id;

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer shrink-0 border ${
              isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20 scale-[1.02]'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            {chip.icon}
            <span>{chip.label}</span>
            {chip.count !== undefined && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {chip.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
