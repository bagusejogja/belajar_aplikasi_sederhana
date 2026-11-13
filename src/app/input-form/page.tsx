'use client';

import React from 'react';
import PublicNavHeader from '@/components/PublicNavHeader';

export default function InputFormDeltaPage() {
  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden flex flex-col">
      <PublicNavHeader currentPath="/input-form" title="Form Revisi Terjadwal" />
      <iframe 
        src="https://input-form-delta.vercel.app/" 
        className="w-full flex-1 border-0 block"
        title="Input Form Delta"
        allowFullScreen
      />
    </div>
  );
}
