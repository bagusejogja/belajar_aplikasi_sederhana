'use client';

import React, { useEffect, useState } from 'react';
import { debugSuratData } from '@/app/actions/debug-surat';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    debugSuratData().then(setData);
  }, []);

  return (
    <div className="p-10 font-mono text-[10px]">
      <h1 className="text-xl font-bold mb-4">Debug Data Surat</h1>
      <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
