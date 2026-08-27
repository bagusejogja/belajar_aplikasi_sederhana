'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';
import { 
  Calendar, Search, ChevronRight, ChevronDown, CheckCircle, Plus, LayoutGrid, Clock, Tag, X, Edit2, Download, User, FileText, AlertCircle, Maximize2, Trash2, Save 
} from 'lucide-react';

export default function TimelinePage() {
  const [data, setData] = useState<any[]>([]);
  const [picOptions, setPicOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterParentId, setFilterParentId] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'hari'|'pekan'>('hari');
  
  const [expandedParents, setExpandedParents] = useState<number[]>([]);
  const ganttScrollRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    judul_kegiatan: '',
    parent_id: null as number | null,
    tanggal_mulai: '',
    tanggal_selesai: '',
    tanggal_dikerjakan_mulai: '',
    tanggal_dikerjakan_selesai: '',
    link_hasil: '',
    pic: null as any,
    status: 'Belum Selesai',
    keterangan: '',
    warna: 'bg-indigo-500'
  });

  useEffect(() => {
    if (form.tanggal_dikerjakan_mulai && form.tanggal_dikerjakan_selesai) {
      setForm(prev => ({ ...prev, status: 'Selesai' }));
    }
  }, [form.tanggal_dikerjakan_mulai, form.tanggal_dikerjakan_selesai]);

  const warnaOptions = [
    { value: 'bg-indigo-500', label: 'Biru Indigo', hex: '#6366f1' },
    { value: 'bg-emerald-500', label: 'Hijau Emerald', hex: '#10b981' },
    { value: 'bg-rose-500', label: 'Merah Rose', hex: '#f43f5e' },
    { value: 'bg-amber-500', label: 'Kuning Amber', hex: '#f59e0b' },
    { value: 'bg-sky-500', label: 'Biru Langit', hex: '#0ea5e9' },
    { value: 'bg-purple-500', label: 'Ungu', hex: '#a855f7' },
    { value: 'bg-slate-700', label: 'Abu Gelap', hex: '#334155' },
  ];

  const getColorHex = (val: string) => {
    const opt = warnaOptions.find(w => w.value === val);
    return opt ? opt.hex : '#6366f1';
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: timelineData } = await supabase
      .from('app_timeline')
      .select('*')
      .order('tanggal_mulai', { ascending: true });
    
    let allPics: string[] = [];
    
    const { data: picData, error: picError } = await supabase.from('ref_pic').select('*');
    if (!picError && picData && picData.length > 0) {
      allPics = [...allPics, ...picData.map(u => u.pic || u.nama || u.nama_pic || u.name)];
    }
    
    const { data: unitData } = await supabase.from('gov_units').select('pic').not('pic', 'is', null);
    if (unitData) {
      allPics = [...allPics, ...unitData.map(u => u.pic)];
    }

    const uniquePics = Array.from(new Set(allPics.filter(p => p && p !== '-' && p.trim() !== '')));
    setPicOptions(uniquePics.map((p: any) => ({ value: p, label: p })));
    
    if (timelineData) {
      setData(timelineData);
      // setExpandedParents(parents); // Default collapsed
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalLink = form.link_hasil || '';
    if (finalLink && !finalLink.startsWith('http://') && !finalLink.startsWith('https://')) {
      finalLink = 'https://' + finalLink;
    }

    const payload = {
      ...form,
      pic: form.pic || null,
      tanggal_selesai: form.tanggal_selesai || null,
      tanggal_dikerjakan_mulai: form.tanggal_dikerjakan_mulai || null,
      tanggal_dikerjakan_selesai: form.tanggal_dikerjakan_selesai || null,
      link_hasil: finalLink || null
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('app_timeline').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('app_timeline').insert([payload]);
      error = err;
    }

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
      return;
    }

    setIsModalOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus timeline ini? (Sub-kegiatan di dalamnya juga akan terhapus)')) {
      await supabase.from('app_timeline').delete().eq('id', id);
      fetchData();
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Selesai' ? 'Belum Selesai' : 'Selesai';
    await supabase.from('app_timeline').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const toggleExpand = (id: number) => {
    setExpandedParents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ judul_kegiatan: '', parent_id: null, tanggal_mulai: '', tanggal_selesai: '', tanggal_dikerjakan_mulai: '', tanggal_dikerjakan_selesai: '', link_hasil: '', pic: null, status: 'Belum Selesai', keterangan: '', warna: 'bg-indigo-500' });
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      judul_kegiatan: item.judul_kegiatan,
      parent_id: item.parent_id,
      tanggal_mulai: item.tanggal_mulai,
      tanggal_selesai: item.tanggal_selesai || '',
      tanggal_dikerjakan_mulai: item.tanggal_dikerjakan_mulai || '',
      tanggal_dikerjakan_selesai: item.tanggal_dikerjakan_selesai || '',
      link_hasil: item.link_hasil || '',
      pic: item.pic || '',
      status: item.status,
      keterangan: item.keterangan || '',
      warna: item.warna || 'bg-indigo-500'
    });
    setIsModalOpen(true);
  };

  // Organize Data for Gantt Chart
  const availableYears = Array.from(new Set(data.flatMap(d => {
    if (!d.tanggal_mulai) return [];
    const sy = new Date(d.tanggal_mulai).getFullYear();
    const ey = d.tanggal_selesai ? new Date(d.tanggal_selesai).getFullYear() : sy;
    return [sy, ey];
  }))).sort((a,b) => b - a);

  const displayedData = filterYear === 'All' ? data : data.filter(d => {
    if (!d.tanggal_mulai) return false;
    const y = parseInt(filterYear);
    const sy = new Date(d.tanggal_mulai).getFullYear();
    const ey = d.tanggal_selesai ? new Date(d.tanggal_selesai).getFullYear() : sy;
    return y >= sy && y <= ey;
  });

  const parents = displayedData.filter(d => !d.parent_id);
  const filteredParents = parents.filter(p => {
    const matchSearch = p.judul_kegiatan.toLowerCase().includes(search.toLowerCase()) || 
      (p.pic && p.pic.toLowerCase().includes(search.toLowerCase())) ||
      displayedData.some(c => c.parent_id === p.id && c.judul_kegiatan.toLowerCase().includes(search.toLowerCase()));
    const matchParent = filterParentId === 'All' || p.id.toString() === filterParentId;
    
    return matchSearch && matchParent;
  });

  const rows: any[] = [];
  filteredParents.forEach(p => {
    const children = displayedData.filter(c => c.parent_id === p.id);
    const hasChildren = children.length > 0;
    
    let minT = new Date(p.tanggal_mulai).getTime();
    let maxT = new Date(p.tanggal_selesai || p.tanggal_mulai).getTime();
    
    if (hasChildren) {
       minT = Math.min(...children.map(c => new Date(c.tanggal_mulai).getTime()));
       maxT = Math.max(...children.map(c => new Date(c.tanggal_selesai || c.tanggal_mulai).getTime()));
    }
    
    const pMod = { 
       ...p, 
       tanggal_mulai: new Date(minT).toISOString().split('T')[0],
       tanggal_selesai: new Date(maxT).toISOString().split('T')[0],
       isChild: false, 
       parentColor: p.warna,
       hasChildren 
    };
    rows.push(pMod);
    
    if (expandedParents.includes(p.id)) {
      children.forEach(c => {
        rows.push({ ...c, isChild: true, parentColor: p.warna });
      });
    }
  });

  // Gantt Chart Calculations
  const DAY_WIDTH = viewMode === 'pekan' ? 5 : 24; // Pixel per day
  const getGanttExtents = () => {
    if (displayedData.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 0, months: [], allWeeks: [] };
    
    let minT = new Date(displayedData[0].tanggal_mulai).getTime();
    let maxT = new Date(displayedData[0].tanggal_selesai || displayedData[0].tanggal_mulai).getTime();
    displayedData.forEach(d => {
      const s = new Date(d.tanggal_mulai).getTime();
      const e = new Date(d.tanggal_selesai || d.tanggal_mulai).getTime();
      if (s < minT) minT = s;
      if (e > maxT) maxT = e;
    });

    const minDate = new Date(minT);
    
    const maxDate = new Date(maxT);
    maxDate.setDate(maxDate.getDate() + 7); // Tambah padding 7 hari ke kanan biar sedikit lega

    const totalDays = Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24)) + 1;

    const allWeeks: { label: string; days: number; startYear: number; startDate: Date; endDate: Date }[] = [];
    let currentGlobalWeek = -1;
    let currentGlobalWeekDays = 0;
    let currentGlobalYear = -1;
    let globalWeekStartDate: Date = new Date();

    const months = [];
    let curr = new Date(minDate);
    while (curr <= maxDate) {
      const y = curr.getFullYear();
      const m = curr.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      
      const daysArray = [];

      const startDay = (curr.getFullYear() === minDate.getFullYear() && curr.getMonth() === minDate.getMonth()) 
                         ? minDate.getDate() 
                         : 1;

      for(let d = startDay; d <= daysInMonth; d++) {
         const dateObj = new Date(y, m, d);
         if (dateObj > maxDate) break;
         const dayOfWeek = dateObj.getDay();
         const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
         
         const getWeek = (date: Date) => {
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
            return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
         }
         const w = getWeek(dateObj);
         const currentYear = dateObj.getFullYear();
         
         if (w !== currentGlobalWeek || currentYear !== currentGlobalYear) {
            if (currentGlobalWeek !== -1) {
               const lastDay = new Date(dateObj);
               lastDay.setDate(lastDay.getDate() - 1);
               allWeeks.push({ label: `${currentGlobalWeek}`, days: currentGlobalWeekDays, startYear: currentGlobalYear, startDate: globalWeekStartDate, endDate: lastDay });
            }
            currentGlobalWeek = w;
            currentGlobalYear = currentYear;
            currentGlobalWeekDays = 1;
            globalWeekStartDate = dateObj;
         } else {
            currentGlobalWeekDays++;
         }

         daysArray.push({ date: d, isWeekend, fullDate: dateObj });
      }

      months.push({
        label: curr.toLocaleString('id-ID', { month: 'long' }) + ' ' + y,
        days: daysArray.length,
        daysArray
      });
      curr.setMonth(m + 1);
    }

    if (currentGlobalWeekDays > 0) {
       allWeeks.push({ label: `${currentGlobalWeek}`, days: currentGlobalWeekDays, startYear: currentGlobalYear, startDate: globalWeekStartDate, endDate: maxDate });
    }

    return { minDate, maxDate, totalDays, months, allWeeks };
  };

  const { minDate, maxDate, totalDays, months, allWeeks } = getGanttExtents();
  const timelineWidth = totalDays * DAY_WIDTH;

  const getPosition = (dateStr: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr).getTime();
    const diff = Math.floor((d - minDate.getTime()) / (1000 * 3600 * 24));
    return diff * DAY_WIDTH;
  };

  const getWidth = (startStr: string, endStr: string) => {
    if (!startStr) return 0;
    const s = new Date(startStr).getTime();
    const e = endStr ? new Date(endStr).getTime() : s;
    const diff = Math.max(1, Math.ceil((e - s) / (1000 * 3600 * 24)) + 1);
    return diff * DAY_WIDTH;
  };

  useEffect(() => {
    if (ganttScrollRef.current && data.length > 0) {
      const timer = setTimeout(() => {
        if (ganttScrollRef.current) {
          ganttScrollRef.current.scrollLeft = 0;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [data, minDate]);

  const generateGanttHtmlTable = () => {
    const { months, allWeeks } = getGanttExtents();
    const isHari = viewMode === 'hari';
    
    let headerHtml = '';
    if (isHari) {
      let topHeader = '';
      let subHeader = '';
      months.forEach(m => {
         topHeader += `<th colspan="${m.days}" style="padding: 5px; background: #f3f4f6; text-align: center; border: 1px solid #ccc;">${m.label}</th>`;
         m.daysArray.forEach((d: any) => {
            subHeader += `<th style="padding: 2px; background: ${d.isWeekend ? '#ffe4e6' : '#ffffff'}; text-align: center; border: 1px solid #ccc; font-size: 8px; min-width: 20px;">${d.date}</th>`;
         });
      });
      headerHtml = `
        <tr>
          <th rowspan="2" style="padding: 5px; background: #f3f4f6; border: 1px solid #ccc; min-width: 250px; text-align: left;">Daftar Kegiatan</th>
          <th rowspan="2" style="padding: 5px; background: #f3f4f6; border: 1px solid #ccc; min-width: 140px; text-align: center;">Periode Rencana</th>
          <th rowspan="2" style="padding: 5px; background: #f3f4f6; border: 1px solid #ccc; min-width: 140px; text-align: center;">Periode Realisasi</th>
          ${topHeader}
        </tr>
        <tr>${subHeader}</tr>
      `;
    } else {
      let bulanHeader = '';
      let pekanHeader = '';
      
      let currentMonthStr = '';
      let currentMonthColspan = 0;
      const monthGroups: {label: string, colspan: number}[] = [];
      
      allWeeks.forEach((w: any) => {
         const mStr = w.startDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
         if (mStr !== currentMonthStr) {
            if (currentMonthColspan > 0) {
               monthGroups.push({ label: currentMonthStr, colspan: currentMonthColspan });
            }
            currentMonthStr = mStr;
            currentMonthColspan = 1;
         } else {
            currentMonthColspan++;
         }
      });
      if (currentMonthColspan > 0) {
         monthGroups.push({ label: currentMonthStr, colspan: currentMonthColspan });
      }

      monthGroups.forEach(mg => {
         bulanHeader += `<th colspan="${mg.colspan}" style="padding: 5px; background: #f3f4f6; text-align: center; border: 1px solid #ccc;">${mg.label.toUpperCase()}</th>`;
      });
      allWeeks.forEach((w: any) => {
         pekanHeader += `<th style="padding: 5px; background: #f9fafb; border: 1px solid #ccc; text-align: center;">${w.label}</th>`;
      });

      headerHtml = `
        <tr>
          <th rowspan="2" style="padding: 5px; background: #f3f4f6; border: 1px solid #ccc; min-width: 250px; text-align: left;">Daftar Kegiatan</th>
          <th rowspan="2" style="padding: 5px; background: #f3f4f6; border: 1px solid #ccc; min-width: 140px; text-align: center;">Periode Rencana</th>
          <th rowspan="2" style="padding: 5px; background: #f3f4f6; border: 1px solid #ccc; min-width: 140px; text-align: center;">Periode Realisasi</th>
          ${bulanHeader}
        </tr>
        <tr>${pekanHeader}</tr>
      `;
    }

    const formatDateStr = (dateStr: string) => {
       if (!dateStr) return '-';
       const d = new Date(dateStr);
       return `${d.getDate()} ${d.toLocaleString('id-ID', {month:'short'})} ${d.getFullYear()}`;
    };

    let bodyHtml = '';
    rows.forEach(r => {
      const renMulai = formatDateStr(r.tanggal_mulai);
      const renSelesai = formatDateStr(r.tanggal_selesai);
      const realMulai = formatDateStr(r.tanggal_dikerjakan_mulai);
      const realSelesai = formatDateStr(r.tanggal_dikerjakan_selesai);
      
      const renPeriod = renMulai !== '-' ? `${renMulai} - ${renSelesai !== '-' ? renSelesai : renMulai}` : '-';
      const realPeriod = realMulai !== '-' ? `${realMulai} - ${realSelesai !== '-' ? realSelesai : realMulai}` : '-';

      let rowHtml = `<tr>
        <td style="padding: 5px; border: 1px solid #ccc; ${!r.isChild ? 'font-weight: bold;' : 'padding-left: 20px;'}">${r.judul_kegiatan}</td>
        <td style="padding: 5px; border: 1px solid #ccc; text-align: center; font-size: 9px;">${renPeriod}</td>
        <td style="padding: 5px; border: 1px solid #ccc; text-align: center; font-size: 9px;">${realPeriod}</td>`;
      
      const rStart = new Date(r.tanggal_mulai).getTime();
      const rEnd = r.tanggal_selesai ? new Date(r.tanggal_selesai).getTime() : rStart;
      
      let rowColor = r.parentColor || r.warna || '#3b82f6';
      if (rowColor.startsWith('bg-')) {
         if (rowColor === 'bg-indigo-500') rowColor = '#6366f1';
         else if (rowColor === 'bg-rose-500') rowColor = '#f43f5e';
         else if (rowColor === 'bg-emerald-500') rowColor = '#10b981';
         else if (rowColor === 'bg-amber-500') rowColor = '#f59e0b';
         else if (rowColor === 'bg-sky-500') rowColor = '#0ea5e9';
         else rowColor = '#6366f1';
      }

      if (isHari) {
         months.forEach(m => {
            m.daysArray.forEach((d: any) => {
               const dayTime = new Date(d.fullDate).setHours(0,0,0,0);
               const startZero = new Date(r.tanggal_mulai).setHours(0,0,0,0);
               const endZero = r.tanggal_selesai ? new Date(r.tanggal_selesai).setHours(0,0,0,0) : startZero;
               
               const isOverlap = dayTime >= startZero && dayTime <= endZero;
               const cellColor = isOverlap ? rowColor : (d.isWeekend ? '#ffe4e6' : '#ffffff');
               
               rowHtml += `<td style="background-color: ${cellColor}; border: 1px solid #ccc;"></td>`;
            });
         });
      } else {
         allWeeks.forEach((w: any) => {
            const weekStart = w.startDate.getTime();
            const weekEnd = w.endDate.getTime();
            const isOverlap = rStart <= weekEnd && rEnd >= weekStart;
            const cellColor = isOverlap ? rowColor : '#ffffff';
            
            rowHtml += `<td style="background-color: ${cellColor}; border: 1px solid #ccc;"></td>`;
         });
      }
      
      rowHtml += `</tr>`;
      bodyHtml += rowHtml;
    });

    return `<table style="border-collapse: collapse; width: 100%; font-family: sans-serif; font-size: 10px;">
      <thead>${headerHtml}</thead>
      <tbody>${bodyHtml}</tbody>
    </table>`;
  };

  const handleExportExcel = () => {
    if (rows.length === 0) return alert('Tidak ada data untuk di-export');
    const tableHtml = generateGanttHtmlTable();
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Timeline</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <h2>Gantt Chart Kegiatan (${viewMode === 'hari' ? 'Harian' : 'Pekanan'})</h2>
        ${tableHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeline_${viewMode}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = () => {
    if (rows.length === 0) return alert('Tidak ada data untuk di-export');
    const tableHtml = generateGanttHtmlTable();
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Timeline Export</title>
        <style>
          @page { size: landscape; margin: 1cm; }
        </style>
      </head>
      <body>
        <h2 style="font-family: sans-serif;">Gantt Chart Kegiatan (${viewMode === 'hari' ? 'Harian' : 'Pekanan'})</h2>
        ${tableHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timeline_${viewMode}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-screen-2xl mx-auto flex flex-col h-[calc(100vh-100px)] min-h-[700px] space-y-3 pb-2 pt-1">
      {/* SLIM & UNIFIED TOP TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3.5 px-5 rounded-2xl shadow-xs border border-gray-200/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-sky-600 p-2 rounded-xl text-white shadow-xs">
            <Calendar size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-gray-900 tracking-tight leading-none">Gantt Chart Jadwal Kegiatan</h2>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                {data.length} Kegiatan ({data.filter(d => d.status === 'Selesai').length} Selesai)
              </span>
            </div>
            <p className="text-gray-500 font-medium text-[11px] mt-0.5">
              Pantau jadwal Induk & Sub-Kegiatan dalam bentuk Gantt Chart interaktif.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
           <button 
             onClick={handleExportWord}
             className="h-9 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
           >
             <Download size={13} />
             <span>Word</span>
           </button>

           <button 
             onClick={handleExportExcel}
             className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
           >
             <FileText size={13} />
             <span>Excel</span>
           </button>

           <button 
             onClick={() => { resetForm(); setIsModalOpen(true); }}
             className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
           >
             <Plus size={15} />
             <span>Tambah Kegiatan</span>
           </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-3 px-4 rounded-2xl shadow-xs border border-gray-200/80 flex flex-wrap items-center gap-3 relative z-[70] shrink-0">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder="Cari kegiatan atau PIC..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-8 pr-4 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white text-xs font-semibold text-gray-700 transition-all"
          />
        </div>
        
        {/* Mode Harian / Pekanan */}
        <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
           <button 
             onClick={() => setViewMode('hari')} 
             className={`h-7 px-3 rounded-lg text-xs font-bold transition-all ${viewMode === 'hari' ? 'bg-white shadow-2xs text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Harian
           </button>
           <button 
             onClick={() => setViewMode('pekan')} 
             className={`h-7 px-3 rounded-lg text-xs font-bold transition-all ${viewMode === 'pekan' ? 'bg-white shadow-2xs text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
           >
             Pekanan
           </button>
        </div>

        {/* Filter Tahun */}
        <div className="relative w-44 shrink-0 z-[60]">
          <Select 
             options={[{value: 'All', label: 'Semua Tahun'}, ...availableYears.map(y => ({value: y.toString(), label: `Tahun ${y}`}))]}
             value={{value: filterYear, label: filterYear === 'All' ? 'Semua Tahun' : `Tahun ${filterYear}`}}
             onChange={(v: any) => setFilterYear(v.value)}
             className="text-xs font-bold"
             styles={{
                control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', color: '#374151' }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
             }}
          />
        </div>

        {/* Filter Kegiatan */}
        <div className="relative w-56 shrink-0 z-[60]">
          <Select 
             options={[{value: 'All', label: 'Semua Kegiatan'}, ...parents.map((p: any) => ({value: p.id.toString(), label: p.judul_kegiatan}))]}
             value={{value: filterParentId, label: filterParentId === 'All' ? 'Semua Kegiatan' : parents.find((p: any) => p.id.toString() === filterParentId)?.judul_kegiatan || 'Pilih Kegiatan'}}
             onChange={(v: any) => setFilterParentId(v.value)}
             className="text-xs font-bold"
             placeholder="Filter Kegiatan"
             styles={{
                control: (base) => ({ ...base, minHeight: '36px', height: '36px', borderRadius: '0.75rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', color: '#374151' }),
                menu: (base) => ({ ...base, zIndex: 9999 }),
             }}
          />
        </div>
      </div>

      {/* GANTT CHART VIEW CARD */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden flex-1 min-h-0 flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center h-40 flex-1">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredParents.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold italic flex-1 flex items-center justify-center">
            Belum ada timeline kegiatan yang ditambahkan.
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar bg-white rounded-b-3xl relative" onScroll={(e) => {
             // Optional: if we want to sync anything, but native sticky is enough
          }}>
             <div style={{ width: `${timelineWidth + 384}px` }} className="min-w-fit">
                
                {/* Headers Row (Sticky Top) */}
                <div className="sticky top-0 z-50 flex bg-white shadow-sm border-b-2 border-gray-100 h-[72px]">
                   {/* Left Header (Sticky Left) */}
                   <div className="w-80 md:w-96 shrink-0 bg-gray-50 flex items-center px-4 font-black text-gray-800 text-sm sticky left-0 z-50 border-r border-gray-200">
                      Daftar Kegiatan
                   </div>
                   
                   {/* Right Headers */}
                   <div className="flex-1 flex flex-col bg-white">
                      {/* Header Bulan */}
                      <div className="h-[24px] border-b border-gray-200 bg-gray-50 flex shrink-0">
                         {months.map(m => (
                            <div key={m.label} style={{ width: `${m.days * DAY_WIDTH}px` }} className="border-r border-gray-300 flex justify-center items-center shrink-0 bg-gray-100">
                               <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{m.label}</span>
                            </div>
                         ))}
                      </div>
                      
                      {/* Header Teks Pekan (Hanya tampil di mode Pekan) */}
                      {viewMode === 'pekan' && (
                        <div className="h-[24px] border-b border-gray-200 bg-white flex shrink-0">
                           {months.map(m => (
                              <div key={"text-pekan-"+m.label} style={{ width: `${m.days * DAY_WIDTH}px` }} className="border-r border-gray-300 flex justify-center items-center shrink-0 bg-sky-50/20">
                                 <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">PEKAN</span>
                              </div>
                           ))}
                        </div>
                      )}
                      
                      {/* Header Pekan */}
                      <div className={`h-[24px] border-b border-gray-200 bg-gray-50 flex shrink-0`}>
                         {allWeeks.map((w: any, i: number) => (
                            <div key={'w-'+i} style={{ width: `${w.days * DAY_WIDTH}px` }} className="border-r border-gray-300 flex justify-center items-center shrink-0 bg-white">
                               <span className="text-[10px] font-black text-sky-700 tracking-widest">
                                  {viewMode === 'hari' ? `PEKAN ${w.label.replace('PEKAN ', '')}` : w.label.replace('PEKAN ', '')}
                               </span>
                            </div>
                         ))}
                      </div>
   
                      {/* Header Tanggal (Hanya tampil di mode Harian) */}
                      {viewMode === 'hari' && (
                        <div className="h-[24px] border-gray-200 bg-white flex shrink-0">
                           {months.map(m => (
                              m.daysArray.map((d: any, i: number) => (
                                 <div key={m.label+i} style={{ width: `${DAY_WIDTH}px` }} className={`border-r border-gray-100 flex justify-center items-center shrink-0 ${d.isWeekend ? 'bg-rose-50/80' : ''}`}>
                                    <span className={`text-[10px] font-bold ${d.isWeekend ? 'text-rose-500' : 'text-gray-500'}`}>{d.date}</span>
                                 </div>
                              ))
                           ))}
                        </div>
                      )}
                   </div>
                </div>

                {/* Data Container */}
                <div className="flex relative">
                   {/* Left Panel (Daftar Kegiatan Data) */}
                   <div className="w-80 md:w-96 shrink-0 bg-white sticky left-0 z-40 border-r border-gray-200 shadow-[2px_0_10px_rgba(0,0,0,0.03)] pb-32">
                      <div className="flex flex-col">
                         {rows.map((r, idx) => {
                            const hasChildren = data.some(d => d.parent_id === r.id);
                            return (
                               <div key={r.id} className={`h-[52px] px-4 flex justify-between items-center border-b border-gray-100 hover:bg-gray-50 transition-colors group ${r.isChild ? 'bg-white' : 'bg-gray-50/30'}`}>
                                  <div className={`flex items-center gap-2 min-w-0 flex-1 ${r.isChild ? 'pl-8' : ''}`}>
                                     {!r.isChild && (
                                        <button onClick={() => toggleExpand(r.id)} className={`p-1 rounded hover:bg-gray-200 text-gray-500 ${!hasChildren ? 'invisible' : ''} shrink-0`}>
                                           {expandedParents.includes(r.id) ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                        </button>
                                     )}
                                     {r.isChild && <div className="text-gray-300 ml-1 font-mono text-sm shrink-0">└─ </div>}
                                     <span className={`line-clamp-2 pr-2 ${r.isChild ? 'text-[11px] text-gray-600 font-bold leading-tight' : 'text-xs font-black text-gray-800 leading-tight'}`} title={r.judul_kegiatan}>
                                        {r.judul_kegiatan}
                                     </span>
                                  </div>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={14}/></button>
                                     <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={14}/></button>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   </div>
                   
                   {/* Right Panel (Gantt Chart Data) */}
                   <div className="flex-1 relative">
                      {/* Garis Vertikal Grid */}
                      <div className={`absolute top-0 bottom-0 left-0 right-0 flex pointer-events-none z-0`}>
                         {viewMode === 'hari' ? (
                            months.map(m => (
                               m.daysArray.map((d: any, i: number) => (
                                  <div key={'grid'+m.label+i} style={{ width: `${DAY_WIDTH}px` }} className={`border-r border-gray-100 border-dashed h-full shrink-0 ${d.isWeekend ? 'bg-rose-50/40' : ''}`}></div>
                               ))
                            ))
                         ) : (
                            allWeeks.map((w: any, i: number) => (
                               <div key={'grid-week-'+i} style={{ width: `${w.days * DAY_WIDTH}px` }} className={`border-r border-gray-300 border-solid h-full shrink-0 bg-gray-50/10`}></div>
                            ))
                         )}
                      </div>
                      
                      {/* Garis Hari Ini */}
                      <div className="absolute top-0 bottom-0 w-[2px] bg-rose-500/80 pointer-events-none z-40" style={{ left: `${getPosition(new Date().toISOString()) + (DAY_WIDTH/2)}px` }}>
                      </div>
   
                      {/* Container Bar Gantt */}
                      <div className={`absolute left-0 right-0 z-10 pointer-events-none top-0`}>
                      {rows.map((r, idx) => {
                         const left = getPosition(r.tanggal_mulai);
                         const width = getWidth(r.tanggal_mulai, r.tanggal_selesai);
                         const top = idx * 52; // Sama dengan h-[52px] row di panel kiri
                         
                         const formatDate = (dateStr: string) => {
                           if (!dateStr) return '';
                           const d = new Date(dateStr);
                           return `${d.getDate()} ${d.toLocaleString('id-ID', {month:'short'})}`;
                         };
                         
                         const isPast = new Date(r.tanggal_selesai || r.tanggal_mulai) < new Date(new Date().setHours(0,0,0,0));
                         const isOverdue = isPast && r.status !== 'Selesai';
                         const bgStyle = isOverdue ? { backgroundImage: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 10px, transparent 10px, transparent 20px)' } : {};

                         const realisasiLeft = r.tanggal_dikerjakan_mulai ? getPosition(r.tanggal_dikerjakan_mulai) : 0;
                         const realisasiWidth = (r.tanggal_dikerjakan_mulai && r.tanggal_dikerjakan_selesai) ? getWidth(r.tanggal_dikerjakan_mulai, r.tanggal_dikerjakan_selesai) : getWidth(r.tanggal_dikerjakan_mulai, r.tanggal_dikerjakan_mulai);

                         return (
                            <div key={'bar'+r.id} className="absolute h-[52px] flex items-center w-full pointer-events-none" style={{ top: `${top}px` }}>
                               {r.tanggal_dikerjakan_mulai && (
                                  <div 
                                     style={{ 
                                        left: `${realisasiLeft}px`, 
                                        width: `${realisasiWidth}px`,
                                        top: '34px',
                                        backgroundColor: '#34d399'
                                     }} 
                                     className="absolute h-2 border border-white/50 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.3)] z-30 pointer-events-none"
                                     title={`Realisasi: ${r.tanggal_dikerjakan_mulai} s/d ${r.tanggal_dikerjakan_selesai || '-'}`}
                                  ></div>
                               )}
                               <div 
                                  onClick={() => openEdit(r)}
                                  style={{ left: `${left}px`, width: `${width}px`, backgroundColor: getColorHex(r.parentColor || r.warna || 'bg-indigo-500'), ...bgStyle }} 
                                  className={`absolute h-8 rounded-md shadow-sm border border-black/10 flex items-center justify-between px-3 cursor-pointer hover:brightness-110 hover:shadow-md transition-all pointer-events-auto group hover:z-50 ${r.isChild ? 'opacity-90 h-6 rounded-sm' : ''} ${isOverdue ? 'ring-2 ring-rose-500 ring-offset-1' : ''}`}
                               >
                                  <span className="truncate text-[10px] font-bold text-white/95 mr-3 whitespace-nowrap drop-shadow-md flex items-center gap-1">
                                    {r.status === 'Selesai' && <CheckCircle size={10} className="text-emerald-300 shrink-0" />}
                                  </span>
                                  <span className="text-[9px] font-black text-white/90 whitespace-nowrap shrink-0 drop-shadow-md">{formatDate(r.tanggal_mulai)} {r.tanggal_selesai && r.tanggal_selesai !== r.tanggal_mulai ? `- ${formatDate(r.tanggal_selesai)}` : ''}</span>
                                  
                                  {/* Tooltip Hover */}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal break-words">
                                    <p className="font-bold text-[13px] mb-1">{r.judul_kegiatan}</p>
                                    <div className="grid grid-cols-[80px_1fr] gap-x-2 gap-y-1 my-2 border-y border-gray-700 py-2">
                                       <span className="text-gray-400">Rencana</span><span className="text-gray-200">: {r.tanggal_mulai} s/d {r.tanggal_selesai || '-'}</span>
                                       <span className="text-gray-400">Dikerjakan</span><span className="text-gray-200">: {r.tanggal_dikerjakan_mulai ? `${r.tanggal_dikerjakan_mulai} s/d ${r.tanggal_dikerjakan_selesai || '-'}` : 'Belum dikerjakan'}</span>
                                       <span className="text-gray-400">PIC</span><span className="text-gray-200">: {r.pic || '-'}</span>
                                       <span className="text-gray-400">Status</span><span className={`font-bold ${r.status === 'Selesai' ? 'text-emerald-400' : 'text-amber-400'}`}>: {r.status}</span>
                                    </div>
                                    {isOverdue && <p className="text-rose-400 font-bold mt-1">⚠️ Terlewat (Overdue)</p>}
                                    {r.link_hasil && (
                                       <div className="mt-1 mb-2">
                                          <span className="text-gray-400 block mb-0.5">Link Hasil:</span>
                                          <div className="text-sky-400 text-[10px] break-all max-h-16 overflow-hidden">
                                             {r.link_hasil.split('\n').map((l: string, i: number) => <div key={i} className="truncate">{l}</div>)}
                                          </div>
                                       </div>
                                    )}
                                    {r.keterangan && <p className="text-gray-400 mt-2 italic border-t border-gray-700 pt-1">{r.keterangan}</p>}
                                    <p className="text-sky-300 text-[10px] mt-2 italic font-bold">Klik balok ini untuk mengedit</p>
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black text-gray-800">{editingId ? 'Edit Timeline' : 'Tambah Timeline Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 bg-white p-2 rounded-full shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tipe Kegiatan</label>
                <select 
                  value={form.parent_id || ''} 
                  onChange={e => setForm({...form, parent_id: e.target.value ? Number(e.target.value) : null})} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-700 cursor-pointer"
                >
                  <option value="">🌟 Kegiatan Besar (Induk)</option>
                  <optgroup label="Jadikan Sub-Kegiatan dari:">
                    {parents.filter(p => p.id !== editingId).map(p => (
                      <option key={p.id} value={p.id}>↳ {p.judul_kegiatan}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Judul Kegiatan *</label>
                <input required type="text" value={form.judul_kegiatan} onChange={e => setForm({...form, judul_kegiatan: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-black text-gray-800" placeholder="Misal: Rapat Anggaran..." />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Warna Bar Kegiatan</label>
                  <div className="flex flex-wrap gap-3">
                    {warnaOptions.map(w => (
                      <button type="button" key={w.value} onClick={() => setForm({...form, warna: w.value})} className={`cursor-pointer px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 font-bold text-sm outline-none ${form.warna === w.value ? 'border-gray-800 shadow-md ring-2 ring-gray-200 bg-gray-50' : 'border-transparent hover:bg-gray-100'}`}>
                        <div style={{ backgroundColor: w.hex }} className={`w-4 h-4 rounded-full border border-black/10`}></div>
                        <span className={form.warna === w.value ? 'text-gray-900' : 'text-gray-500'}>{w.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Mulai * {(!form.parent_id && data.some(d => d.parent_id === editingId)) ? <span className="text-rose-500 normal-case">(Otomatis dari anak)</span> : ''}</label>
                  <input required type="date" value={form.tanggal_mulai} onChange={e => setForm({...form, tanggal_mulai: e.target.value})} disabled={!form.parent_id && data.some(d => d.parent_id === editingId)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tanggal Selesai {(!form.parent_id && data.some(d => d.parent_id === editingId)) ? <span className="text-rose-500 normal-case">(Otomatis dari anak)</span> : ''}</label>
                  <input type="date" value={form.tanggal_selesai || ''} onChange={e => setForm({...form, tanggal_selesai: e.target.value})} disabled={!form.parent_id && data.some(d => d.parent_id === editingId)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700 disabled:opacity-50" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <div className="col-span-full">
                   <h4 className="text-sm font-black text-indigo-900 flex items-center gap-2 mb-2"><CheckCircle size={16}/> Laporan Realisasi (Pekerjaan)</h4>
                   <p className="text-xs text-indigo-700 mb-4">Isi tanggal realisasi di bawah ini jika tugas sudah mulai dikerjakan. Status akan otomatis berubah menjadi "Selesai" jika rentang waktu terisi penuh.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Tgl Dikerjakan (Mulai)</label>
                  <input type="date" value={form.tanggal_dikerjakan_mulai || ''} onChange={e => setForm({...form, tanggal_dikerjakan_mulai: e.target.value})} className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-indigo-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Tgl Dikerjakan (Selesai)</label>
                  <input type="date" value={form.tanggal_dikerjakan_selesai || ''} onChange={e => setForm({...form, tanggal_dikerjakan_selesai: e.target.value})} className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-indigo-900" />
                </div>
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Multi-Link Hasil / Bukti Pekerjaan</label>
                  <textarea rows={2} value={form.link_hasil} onChange={e => setForm({...form, link_hasil: e.target.value})} className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-indigo-900 text-sm" placeholder="Paste link hasil di sini (pisahkan dengan enter bila lebih dari 1)..."></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Penanggung Jawab (PIC)</label>
                  <Select 
                    options={picOptions} 
                    value={picOptions.find(p => p.value === form.pic) || null}
                    onChange={(val: any) => setForm({...form, pic: val ? val.value : ''})}
                    placeholder="Pilih PIC..."
                    isClearable
                    styles={{
                      control: (base) => ({ ...base, borderRadius: '0.75rem', padding: '0.25rem', borderColor: '#e5e7eb', backgroundColor: '#f9fafb', fontWeight: 500, color: '#374151' }),
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Status Penyelesaian</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-gray-700 cursor-pointer">
                    <option value="Belum Selesai">⏳ Belum Selesai</option>
                    <option value="Selesai">✅ Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Keterangan / Catatan Tambahan</label>
                <textarea rows={3} value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-medium text-gray-700" placeholder="Tuliskan catatan opsional jika ada..."></textarea>
              </div>

              <div className="pt-4 flex justify-between items-center border-t border-gray-100">
                <div>
                  {editingId && (
                     <button type="button" onClick={() => handleDelete(editingId)} className="px-6 py-3 rounded-xl font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2">
                        <Trash2 size={18} /> Hapus Kegiatan
                     </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">Batal</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black transition-transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2">
                    <Save size={18} /> {editingId ? 'SIMPAN PERUBAHAN' : 'TAMBAHKAN TIMELINE'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
