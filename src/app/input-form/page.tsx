'use client';

import React, { useState, useEffect } from 'react';
import PublicNavHeader from '@/components/PublicNavHeader';

export default function InputFormDeltaPage() {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isFrame = window.self !== window.top;
      const urlParams = new URLSearchParams(window.location.search);
      if (isFrame || urlParams.get('embedded') === '1') {
        setIsEmbedded(true);
        // Kirim ukuran ke parent container agar tepat di atas dan tidak ada ruang kosong berlebih
        const postH = () => {
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'PORTAL_EMBED_RESIZE', height: 860 }, '*');
            }
          } catch (e) {}
        };
        setTimeout(postH, 100);
        setTimeout(postH, 500);
      }
    }
  }, []);

  return (
    <div className={`w-full ${isEmbedded ? 'h-auto min-h-0 bg-transparent' : 'h-screen bg-gray-50'} overflow-hidden flex flex-col`}>
      <PublicNavHeader currentPath="/input-form" title="Form Revisi Terjadwal" />
      <div className="w-full flex-1 flex justify-center overflow-hidden">
        <iframe 
          src="https://input-form-delta.vercel.app/" 
          className="w-full border-0 block"
          style={{
            height: isEmbedded ? '850px' : 'calc(100vh - 58px)',
            marginTop: isEmbedded ? '-30px' : '0px'
          }}
          title="Input Form Delta"
          allowFullScreen
        />
      </div>
    </div>
  );
}
