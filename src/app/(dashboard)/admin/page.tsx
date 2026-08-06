"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pivot State
  const [activeTab, setActiveTab] = useState<'data'|'pivot'>('data');
  const [groupBy, setGroupBy] = useState<string[]>(['custom_status']);

  const pivotFields = [
    { id: 'unitkerja_nama', label: 'Unit Kerja' },
    { id: 'kunci', label: 'Status Kunci (Y/N)' },
    { id: 'custom_status', label: 'Label Status' },
    { id: 'kunci_by', label: 'Sumber Kunci (AI/RULE)' },
    { id: 'akun', label: 'Kode Akun' }
  ];

  const toggleGroupBy = (field: string) => {
    if (groupBy.includes(field)) {
      setGroupBy(groupBy.filter(f => f !== field));
    } else {
      setGroupBy([...groupBy, field]);
    }
  };

  const groupedData = useMemo(() => {
    if (groupBy.length === 0) return { "Total Keseluruhan": { count: budgets.length, sum: budgets.reduce((acc, b) => acc + (b.total || 0), 0) } };
    
    const result: any = {};
    budgets.forEach(budget => {
      const keyParts = groupBy.map(f => {
        let val = budget[f];
        if (f === 'kunci' && val === 'Y') val = 'Terkunci (Y)';
        if (f === 'kunci' && val === 'N') val = 'Bebas (N)';
        return val || '(Kosong)';
      });
      const key = keyParts.join(' ➔ ');
      
      if (!result[key]) result[key] = { count: 0, sum: 0, keyParts };
      result[key].count += 1;
      result[key].sum += (budget.total || 0);
    });
    
    // Convert object to sorted array by sum descending
    return Object.entries(result).sort((a: any, b: any) => b[1].sum - a[1].sum);
  }, [budgets, groupBy]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('budgets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Failed to fetch budgets', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleBulkApprove = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/budgets/bulk-approve', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        alert('Berhasil menyetujui semua saran AI.');
        fetchBudgets();
      } else {
        alert('Gagal: ' + json.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan.');
    }
  };

  const totalUsulan = budgets.length;
  const terkunciRule = budgets.filter(b => b.kunci === 'Y' && b.kunci_by === 'RULE').length;
  const saranAi = budgets.filter(b => b.kunci === 'Y' && b.kunci_by === 'AI').length;

  const getStatusBadge = (kunci: string, kunci_by: string, custom_status?: string) => {
    if (kunci === 'Y') {
      if (kunci_by === 'RULE') {
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{custom_status || 'Wajib'} (RULE)</Badge>;
      } else if (kunci_by === 'AI') {
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">{custom_status || 'Saran'} (AI)</Badge>;
      }
      return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{custom_status || 'Terkunci'}</Badge>;
    }
    return <Badge variant="outline" className="border-slate-700 text-slate-400">Tidak (N)</Badge>;
  };

  const getSourceBadge = (kunci_by: string, confidence: number | null) => {
    if (kunci_by === 'RULE') {
      return <Badge variant="outline" className="border-blue-500/30 text-blue-400">RULE</Badge>;
    } else if (kunci_by === 'AI') {
      const pct = confidence ? Math.round(confidence * 100) + '%' : '';
      return <Badge variant="outline" className="border-purple-500/30 text-purple-400">AI {pct}</Badge>;
    }
    return <Badge variant="outline" className="border-slate-700 text-slate-500">MANUAL</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-slate-400 hover:text-white px-0 w-fit">&larr; Kembali ke Beranda</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Admin</h1>
              <p className="text-slate-400">Kelola aturan penguncian dan tinjau rekomendasi AI.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => window.location.href='/admin/rules'}>
              Kelola Master Aturan
            </Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
              onClick={handleBulkApprove}
            >
              Bulk Approve AI
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Usulan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{loading ? '...' : totalUsulan}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-emerald-900/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-400">Terkunci Otomatis (Rule)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{loading ? '...' : terkunciRule}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-900/50 border-amber-900/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-400">Saran AI (Perlu Validasi)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{loading ? '...' : saranAi}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg w-max mb-6 border border-slate-800">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'data' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            onClick={() => setActiveTab('data')}
          >
            📋 Tabel Data
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'pivot' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            onClick={() => setActiveTab('pivot')}
          >
            📊 Analisis Pivot
          </button>
        </div>

        {activeTab === 'data' && (
          <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-white">Usulan Anggaran Terbaru</CardTitle>
                <CardDescription className="text-slate-400">
                  Berikut adalah usulan anggaran yang masuk dari berbagai Unit Kerja.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchBudgets} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                🔄 Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-slate-400">Unit Kerja</TableHead>
                  <TableHead className="text-slate-400">Akun</TableHead>
                  <TableHead className="text-slate-400">Deskripsi</TableHead>
                  <TableHead className="text-slate-400 text-right">Total (Rp)</TableHead>
                  <TableHead className="text-slate-400 text-center">Status Kunci</TableHead>
                  <TableHead className="text-slate-400 text-center">Ditentukan Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Memuat data...</TableCell>
                  </TableRow>
                ) : budgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">Belum ada data usulan.</TableCell>
                  </TableRow>
                ) : (
                  budgets.map((b) => (
                    <TableRow key={b.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-medium text-slate-300">{b.unitkerja_nama}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-300">{b.akun}</TableCell>
                      <TableCell className="max-w-[250px] truncate text-slate-200" title={b.deskripsi}>
                        {b.deskripsi}
                      </TableCell>
                      <TableCell className="text-right text-slate-300">
                        {new Intl.NumberFormat('id-ID').format(b.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(b.kunci, b.kunci_by, b.custom_status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getSourceBadge(b.kunci_by, b.ai_confidence)}
                        {b.ai_reason && (
                          <div className="text-[10px] text-slate-500 mt-1 max-w-[120px] truncate mx-auto" title={b.ai_reason}>
                            {b.ai_reason}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        )}

        {activeTab === 'pivot' && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Analisis Pengelompokan Data (Pivot)</CardTitle>
              <CardDescription className="text-slate-400">
                Pilih kolom di bawah ini untuk mengelompokkan data dan melihat total anggarannya.
              </CardDescription>
              <div className="flex flex-wrap gap-2 mt-4">
                {pivotFields.map(field => {
                  const isActive = groupBy.includes(field.id);
                  return (
                    <Badge 
                      key={field.id}
                      onClick={() => toggleGroupBy(field.id)}
                      className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${isActive ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'}`}
                    >
                      {field.label} {isActive && '✕'}
                    </Badge>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                    <TableRow>
                      <TableHead className="text-slate-400">Grup: {groupBy.map(g => pivotFields.find(p=>p.id===g)?.label).join(' ➔ ') || 'Semua Data'}</TableHead>
                      <TableHead className="text-slate-400 text-center">Jumlah Usulan</TableHead>
                      <TableHead className="text-slate-400 text-right">Total Anggaran (Rp)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupBy.length === 0 ? (
                      <TableRow className="border-b border-slate-800">
                        <TableCell className="font-medium text-slate-200">Total Keseluruhan</TableCell>
                        <TableCell className="text-center text-slate-300">{(groupedData as any)["Total Keseluruhan"].count}</TableCell>
                        <TableCell className="text-right text-indigo-400 font-bold">
                          {new Intl.NumberFormat('id-ID').format((groupedData as any)["Total Keseluruhan"].sum)}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (groupedData as any[]).map(([key, data]) => (
                        <TableRow key={key} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-200">{key}</TableCell>
                          <TableCell className="text-center text-slate-300">{data.count} item</TableCell>
                          <TableCell className="text-right text-indigo-400 font-bold">
                            {new Intl.NumberFormat('id-ID').format(data.sum)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
