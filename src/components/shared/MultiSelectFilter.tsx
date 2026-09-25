'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  badge?: string;
}

export interface MultiSelectFilterProps {
  label?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  maxDisplayTags?: number;
  className?: string;
}

export default function MultiSelectFilter({
  label,
  placeholder = 'Pilih beberapa opsi...',
  options = [],
  selectedValues = [],
  onChange,
  maxDisplayTags = 2,
  className = '',
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeTag = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== val));
  };

  const selectAll = () => {
    onChange(filteredOptions.map(o => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectedLabels = options
    .filter(o => selectedValues.includes(o.value))
    .map(o => o.label);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Main Filter Input Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[36px] px-2.5 py-1 text-xs bg-white border border-gray-200 rounded-xl hover:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs"
      >
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {selectedValues.length === 0 ? (
            <span className="text-gray-400 font-medium">{placeholder}</span>
          ) : (
            <>
              {selectedValues.slice(0, maxDisplayTags).map(val => {
                const opt = options.find(o => o.value === val);
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                  >
                    <span className="truncate max-w-[120px]">{opt?.label || val}</span>
                    <button
                      type="button"
                      onClick={(e) => removeTag(val, e)}
                      className="hover:bg-blue-200/60 rounded p-0.5 transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
              {selectedValues.length > maxDisplayTags && (
                <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                  +{selectedValues.length - maxDisplayTags} lainnya
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          {selectedValues.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              className="hover:text-gray-700 p-0.5 rounded transition-colors"
              title="Hapus semua pilihan"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200/90 rounded-2xl shadow-xl z-50 p-2 space-y-2 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari opsi..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all font-medium"
              autoFocus
            />
          </div>

          {/* Quick Select Actions */}
          <div className="flex items-center justify-between px-1 text-[11px] font-bold text-gray-500 border-b border-gray-100 pb-1.5">
            <span>{selectedValues.length} dipilih</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                Pilih Semua
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
              >
                Kosongkan
              </button>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 font-medium">
                Tidak ada opsi yang cocok
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 font-bold'
                        : 'text-gray-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0 font-normal">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
