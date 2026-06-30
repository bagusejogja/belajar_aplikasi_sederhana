'use client';

import React from 'react';

export default function InputFormDeltaPage() {
  return (
    <div className="w-full h-[calc(100vh-120px)] bg-gray-50 rounded-[3rem] overflow-hidden shadow-sm border border-gray-100 relative">
      <iframe 
        src="https://input-form-delta.vercel.app/" 
        className="w-full h-full border-0 absolute inset-0"
        title="Input Form Delta"
        allowFullScreen
      />
    </div>
  );
}
