'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  badge?: string;
  subtext?: string;
}

export interface AutocompleteComboboxProps {
  label?: string;
  placeholder?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function AutocompleteCombobox({
  label,
  placeholder = 'Ketik untuk mencari...',
  options = [],
  value,
  onChange,
  className = '',
  disabled = false,
}: AutocompleteComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Sync display search query when value changes
  useEffect(() => {
    if (selectedOption) {
      setSearchQuery(selectedOption.label);
    } else {
      setSearchQuery('');
    }
  }, [value, selectedOption]);

  // Filter options based on typed query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (opt.subtext && opt.subtext.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query back to selected label if closed without selecting
        if (selectedOption) {
          setSearchQuery(selectedOption.label);
        } else {
          setSearchQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const itemElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (itemElement) {
        itemElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Keyboard Navigation: ArrowDown, ArrowUp, Enter, Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        selectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      if (selectedOption) setSearchQuery(selectedOption.label);
    }
  };

  const selectOption = (opt: ComboboxOption) => {
    onChange(opt.value);
    setSearchQuery(opt.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Input Box Trigger */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          disabled={disabled}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-9 pl-3 pr-16 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-gray-800 transition-all shadow-2xs placeholder:text-gray-400"
        />

        {/* Clear & Dropdown Icon */}
        <div className="absolute right-2 top-2 flex items-center gap-1 text-gray-400">
          {value && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-0.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              title="Hapus pilihan"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-0.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu List with Keyboard Navigation */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 animate-in fade-in-50 zoom-in-95 duration-100 space-y-1">
          {/* Quick Helper Text */}
          <div className="flex items-center justify-between px-2 py-1 text-[10px] text-gray-400 font-semibold border-b border-gray-100 select-none">
            <span>Gunakan panah ↑ / ↓ dan Enter</span>
            <span className="font-mono">{filteredOptions.length} hasil</span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1" ref={listRef}>
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400 font-medium">
                Tidak ada data yang cocok dengan "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => selectOption(opt)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isHighlighted
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : isSelected
                        ? 'bg-slate-100 text-gray-900 font-bold'
                        : 'text-gray-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check size={12} className="text-blue-600 shrink-0 font-black" />}
                      </div>
                      {opt.subtext && (
                        <span className="block text-[10px] text-gray-400 font-normal truncate">
                          {opt.subtext}
                        </span>
                      )}
                    </div>

                    {opt.badge && (
                      <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-extrabold uppercase shrink-0 ${
                        isHighlighted
                          ? 'bg-blue-200/70 text-blue-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
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
