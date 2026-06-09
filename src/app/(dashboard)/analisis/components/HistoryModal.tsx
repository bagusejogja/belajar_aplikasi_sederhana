'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function HistoryModal({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: hData } = await supabase.from('app_pagu_historis').select('*').order('tahun', { ascending: true });
      if (hData) setData(hData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const chartData = {
    labels: data.map(d => d.tahun),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Pagu',
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        data: data.map(d => parseInt(d.total_pagu?.replace(/\D/g, '') || '0')),
      },
      {
        type: 'line' as const,
        label: 'Realisasi',
        borderColor: 'rgba(244, 63, 94, 1)',
        backgroundColor: 'rgba(244, 63, 94, 1)',
        borderWidth: 3,
        fill: false,
        data: data.map(d => parseInt(d.realisasi_historis?.replace(/\D/g, '') || '0')),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e2e8f0' }
      }
    },
    scales: {
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-800/50">
          <h2 className="text-xl font-black text-white flex items-center gap-2"><TrendingUp className="text-amber-400"/> Pagu Historis (Tren)</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
           {loading ? (
             <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
           ) : (
             <div className="h-[400px]">
                <Bar data={chartData as any} options={chartOptions as any} />
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
