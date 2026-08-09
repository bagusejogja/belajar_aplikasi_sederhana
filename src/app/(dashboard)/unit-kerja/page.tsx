"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function UnitKerjaDashboard() {
  const [pasteData, setPasteData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = async () => {
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

  const handleImport = async () => {
    if (!pasteData.trim()) return;
    
    setIsImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch('/api/budgets/bulk-import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rawText: pasteData }),
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Berhasil mengimpor ${result.count} data. AI sedang memproses di latar belakang!`);
        setDialogOpen(false);
        setPasteData('');
        // Refresh data
        fetchBudgets();
      } else {
        alert('Gagal mengimpor data: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const response = await fetch('/api/budgets/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData),
      });
      const result = await response.json();
      if (result.success) {
        alert('Perubahan berhasil disimpan! AI akan mereview ulang data ini.');
        setEditData(null);
        fetchBudgets();
      } else {
        alert('Gagal menyimpan: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan sistem saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (kunci: string, kunci_by: string, custom_status?: string) => {
    if (kunci === 'Y') {
      if (kunci_by === 'RULE') {
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{custom_status || 'Wajib'} (RULE)</Badge>;
      } else if (kunci_by === 'AI') {
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">{custom_status || 'Wajib'} (AI)</Badge>;
      }
      return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">{custom_status || 'Terkunci'}</Badge>;
    }
    return <Badge variant="outline" className="border-slate-700 text-slate-400">Bebas</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 z-10 relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Link href="/">
              <Button variant="ghost" className="text-slate-400 hover:text-white px-0">&larr; Kembali ke Beranda</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Unit Kerja</h1>
              <p className="text-slate-400">Pantau usulan anggaran Anda dan status pengunciannya.</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
              onClick={() => setDialogOpen(true)}
            >
              + Import Data (Paste Zone)
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="bg-slate-900 text-slate-50 border-slate-800 sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import Data Anggaran dari Excel</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Silakan copy baris dari Excel (beserta header-nya) dan paste ke dalam kotak di bawah ini.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea 
                    placeholder="Paste data TSV dari Excel di sini..." 
                    className="h-64 bg-slate-950 border-slate-800 text-slate-300 font-mono text-sm max-w-full break-all whitespace-pre-wrap"
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-3 shrink-0">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isImporting}>Batal</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleImport} disabled={isImporting}>
                    {isImporting ? 'Memproses...' : 'Import Data Sekarang'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle className="text-xl text-white">Daftar Usulan Terkini</CardTitle>
                <CardDescription className="text-slate-400">
                  Data yang terkunci tidak dapat diedit. Klik Refresh untuk melihat pembaruan AI.
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="outline" size="sm" onClick={fetchBudgets} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  🔄 Refresh
                </Button>
                <Input 
                  placeholder="Cari deskripsi atau akun..." 
                  className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-slate-400">Kode Akun</TableHead>
                  <TableHead className="text-slate-400">Deskripsi Usulan</TableHead>
                  <TableHead className="text-slate-400 text-right">Total (Rp)</TableHead>
                  <TableHead className="text-slate-400 text-center">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">Memuat data...</TableCell>
                  </TableRow>
                ) : budgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">Belum ada data usulan.</TableCell>
                  </TableRow>
                ) : (
                  budgets.map((b) => (
                    <TableRow key={b.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-mono text-sm text-slate-300">{b.akun}</TableCell>
                      <TableCell className="font-medium text-slate-200 max-w-[300px] truncate" title={b.deskripsi}>
                        {b.deskripsi}
                      </TableCell>
                      <TableCell className="text-right text-slate-300">
                        {new Intl.NumberFormat('id-ID').format(b.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(b.kunci, b.kunci_by, b.custom_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          onClick={() => setEditData(b)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editData} onOpenChange={(open) => !open && setEditData(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-50 sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Usulan Anggaran</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ubah rincian anggaran. Setelah disimpan, sistem AI akan meninjau ulang kelayakannya.
            </DialogDescription>
          </DialogHeader>
          {editData && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Kode Akun</label>
                  <Input 
                    value={editData.akun} 
                    onChange={e => setEditData({...editData, akun: e.target.value})} 
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Total (Rp)</label>
                  <Input 
                    type="number"
                    value={editData.total} 
                    onChange={e => setEditData({...editData, total: e.target.value})} 
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Nama Komponen</label>
                <Input 
                  value={editData.komponen_nama} 
                  onChange={e => setEditData({...editData, komponen_nama: e.target.value})} 
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Deskripsi Usulan</label>
                <Textarea 
                  value={editData.deskripsi} 
                  onChange={e => setEditData({...editData, deskripsi: e.target.value})} 
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Lingkup</label>
                  <Input 
                    value={editData.lingkup} 
                    onChange={e => setEditData({...editData, lingkup: e.target.value})} 
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Maksud Tujuan</label>
                  <Input 
                    value={editData.maksud_tujuan} 
                    onChange={e => setEditData({...editData, maksud_tujuan: e.target.value})} 
                    className="bg-slate-950 border-slate-800"
                  />
                </div>
              </div>
              <Button 
                onClick={handleSaveEdit} 
                disabled={isSaving} 
                className="bg-blue-600 hover:bg-blue-700 w-full mt-4"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan & Re-evaluasi'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
