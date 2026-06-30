'use client';

import React from 'react';

export default function InputFormDeltaPage() {
  return (
    <div className="w-full h-screen bg-gray-50 overflow-hidden">
      <iframe 
        src="https://input-form-delta.vercel.app/" 
        className="w-full h-full border-0 block"
        title="Input Form Delta"
        allowFullScreen
      />
    </div>
  );
}
