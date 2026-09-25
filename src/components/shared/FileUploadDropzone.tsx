'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';

export interface FileUploadDropzoneProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export default function FileUploadDropzone({
  label = 'Unggah Berkas Pendukung',
  accept = '.xlsx, .xls, .pdf, .docx, .png, .jpg',
  maxSizeMB = 10,
  onFileSelect,
  className = '',
}: FileUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran file melebihi batas maksimum ${maxSizeMB} MB`);
      return;
    }
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
          {label}
        </label>
      )}

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
              : 'border-gray-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud size={20} />
            </div>
            <div className="text-xs font-bold text-gray-700 mt-1">
              <span className="text-blue-600 hover:underline">Klik untuk memilih berkas</span> atau seret ke sini
            </div>
            <p className="text-[11px] text-gray-400 font-medium">
              Mendukung: Excel, PDF, Word, Gambar (Maks. {maxSizeMB} MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-gray-800 truncate">
                {selectedFile.name}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Berkas siap diproses
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <CheckCircle2 size={12} /> Valid
            </span>
            <button
              type="button"
              onClick={removeFile}
              className="p-1 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
              title="Hapus berkas"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-bold mt-1">
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
