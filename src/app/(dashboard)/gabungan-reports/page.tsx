'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function GabunganReportsPage() {
  const router = useRouter();

  useEffect(() => {
    // Menu Laporan Gabungan telah dilebur sepenuhnya ke /reports (Mutasi Kas & Bank)
    router.replace('/reports');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500 space-y-3 font-sans">
      <Loader2 size={36} className="animate-spin text-indigo-600" />
      <p className="text-sm font-bold text-gray-700">Mengalihkan ke Laporan Kas &amp; Bank (/reports)...</p>
      <p className="text-xs text-gray-400">Laporan gabungan kas dan bank kini telah disatukan pada menu Mutasi Kas &amp; Bank.</p>
    </div>
  );
}
