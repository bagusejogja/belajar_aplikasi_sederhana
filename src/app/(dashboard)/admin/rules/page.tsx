"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function RulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [unitList, setUnitList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [unit, setUnit] = useState('*');
  const [akun, setAkun] = useState('*');
  const [keyword, setKeyword] = useState('');
  const [priority, setPriority] = useState('99');
  const [customStatus, setCustomStatus] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const fetchRulesAndUnits = async () => {
    setLoading(true);
    try {
      const { data: rulesData, error: rulesError } = await supabase.from('rules').select('*').order('priority', { ascending: true });
      if (rulesError) throw rulesError;
      if (rulesData) setRules(rulesData);
      
      const { data: unitsData, error: unitsError } = await supabase.from('budgets').select('unitkerja_nama');
      if (unitsError) throw unitsError;
      if (unitsData) {
        const units = Array.from(new Set(unitsData.map((b: any) => b.unitkerja_nama))).filter(Boolean) as string[];
        setUnitList(units);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndUnits();
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword && akun === '*' && unit === '*') {
      alert('Harap isi setidaknya Keyword atau Akun spesifik.');
      return;
    }

    setIsAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ unitkerja_nama: unit, akun, kata_kunci_deskripsi: keyword, priority, custom_status: customStatus })
      });
      const json = await res.json();
      if (json.success) {
        setUnit('*');
        setAkun('*');
        setKeyword('');
        setPriority('99');
        setCustomStatus('');
        fetchRulesAndUnits();
      } else {
        alert(json.error);
      }
    } catch (error) {
      alert('Gagal menambah aturan');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus aturan ini?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch(`/api/rules?id=${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        fetchRulesAndUnits();
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan.');
    }
  };

  const handleApplyRules = async () => {
    setIsApplying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/budgets/re-evaluate-rules', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        alert(`Berhasil! ${json.count} data usulan telah diperbarui sesuai aturan saat ini.`);
      } else {
        alert('Gagal: ' + json.error);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan sistem.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" className="text-slate-400 hover:text-white">&larr; Kembali</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Master Aturan (Rule Engine)</h1>
            <p className="text-sm text-slate-400">Atur kondisi eksak penguncian otomatis.</p>
          </div>
        </header>

          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800 mb-8">
            <h2 className="text-xl font-semibold mb-1 text-white">Tambah Aturan Baru</h2>
            <p className="text-sm text-slate-400 mb-6">Gunakan tanda bintang (*) untuk berlaku pada semua (wildcard).</p>
            <form onSubmit={handleAddRule} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-sm text-slate-400">Unit Kerja</label>
                <select 
                  value={unit} 
                  onChange={e => setUnit(e.target.value)} 
                  className="w-full h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="*">* (Semua Unit Kerja)</option>
                  {unitList.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm text-slate-400">Kode Akun</label>
                <Input value={akun} onChange={e => setAkun(e.target.value)} className="bg-slate-950 border-slate-800 text-slate-200" placeholder="Contoh: 521111" />
              </div>
              <div className="space-y-2 flex-[2]">
                <label className="text-sm text-slate-400">Kata Kunci (Deskripsi)</label>
                <Input value={keyword} onChange={e => setKeyword(e.target.value)} className="bg-slate-950 border-slate-800 text-slate-200" placeholder="Contoh: sewa, langganan" />
              </div>
              <div className="space-y-2 flex-[1]">
                <label className="text-sm text-slate-400">Label (Status)</label>
                <Input value={customStatus} onChange={e => setCustomStatus(e.target.value)} className="bg-slate-950 border-slate-800 text-slate-200" placeholder="Wajib" />
              </div>
              <div className="space-y-2 w-24 flex-shrink-0">
                <label className="text-sm text-slate-400">Level</label>
                <Input type="number" value={priority} onChange={e => setPriority(e.target.value)} className="bg-slate-950 border-slate-800 text-slate-200" placeholder="99" min="1" max="999" />
              </div>
              <Button type="submit" disabled={isAdding} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                {isAdding ? 'Menambah...' : '+ Tambah'}
              </Button>
            </form>
          </div>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <CardTitle className="text-lg text-white">Daftar Aturan Aktif</CardTitle>
              <CardDescription className="text-slate-400">Aturan dieksekusi dari Level terkecil (1) ke terbesar (999).</CardDescription>
            </div>
            <Button 
              onClick={handleApplyRules} 
              disabled={isApplying}
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            >
              {isApplying ? 'Menerapkan...' : '🔄 Terapkan ke Semua Data'}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-900/80 border-b border-slate-800">
                <TableRow>
                  <TableHead className="text-slate-400">Unit Kerja</TableHead>
                  <TableHead className="text-slate-400">Akun</TableHead>
                  <TableHead className="text-slate-400">Kata Kunci</TableHead>
                  <TableHead className="text-slate-400 text-center">Level</TableHead>
                  <TableHead className="text-slate-400 text-center">Status</TableHead>
                  <TableHead className="text-slate-400 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={5} className="text-center py-8">Memuat...</TableCell></TableRow>
                ) : rules.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">Belum ada aturan.</TableCell></TableRow>
                ) : rules.map(rule => (
                  <TableRow key={rule.id} className="border-b border-slate-800">
                    <TableCell className="font-mono text-sm text-white">{rule.unitkerja_nama || '*'}</TableCell>
                    <TableCell className="font-mono text-sm text-white">{rule.akun || '*'}</TableCell>
                    <TableCell className="font-medium text-amber-400">{rule.kata_kunci_deskripsi}</TableCell>
                    <TableCell className="text-center font-mono text-white">{rule.priority || 99}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-500/10 text-emerald-500">
                        {rule.custom_status || 'Wajib'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDelete(rule.id)}>
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
