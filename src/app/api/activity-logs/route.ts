import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export interface ActivityLogItem {
  id: string;
  user_id?: string;
  user_email: string;
  user_role: string;
  action_type: 'LOGIN' | 'LOGOUT' | 'PAGE_VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT' | 'VERIFY' | 'SECURITY' | 'OTHER';
  action_title: string;
  module: string;
  path?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

import os from 'os';

// Gunakan file di os.tmpdir() dan in-memory cache agar Next.js Webpack/Turbopack dev watcher TIDAK me-reload halaman
const LOGS_FILE = path.join(os.tmpdir(), 'verifikasi_activity_logs.json');

declare global {
  var __activityLogsCache: ActivityLogItem[] | undefined;
}

// Helper to ensure data file exists
function readLocalLogs(): ActivityLogItem[] {
  if (global.__activityLogsCache && Array.isArray(global.__activityLogsCache)) {
    return global.__activityLogsCache;
  }

  try {
    if (fs.existsSync(LOGS_FILE)) {
      const content = fs.readFileSync(LOGS_FILE, 'utf8');
      const parsed = JSON.parse(content || '[]');
      global.__activityLogsCache = parsed;
      return parsed;
    }

    // Cek apakah ada file legacy di data/activity_logs.json
    const legacyPath = path.join(process.cwd(), 'data', 'activity_logs.json');
    if (fs.existsSync(legacyPath)) {
      try {
        const content = fs.readFileSync(legacyPath, 'utf8');
        const parsed = JSON.parse(content || '[]');
        global.__activityLogsCache = parsed;
        fs.writeFileSync(LOGS_FILE, JSON.stringify(parsed), 'utf8');
        return parsed;
      } catch {}
    }

    // Initial default logs
    const initialLogs: ActivityLogItem[] = [
      {
        id: 'log-seed-1',
        user_email: 'bagusejogja@gmail.com',
        user_role: 'Admin',
        action_type: 'LOGIN',
        action_title: 'Berhasil login ke sistem',
        module: 'AUTH',
        path: '/login',
        details: { method: 'password', platform: 'Web' },
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ];

    global.__activityLogsCache = initialLogs;
    fs.writeFileSync(LOGS_FILE, JSON.stringify(initialLogs), 'utf8');
    return initialLogs;
  } catch (err) {
    console.error('Error reading activity logs:', err);
    return global.__activityLogsCache || [];
  }
}

function writeLocalLogs(logs: ActivityLogItem[]) {
  try {
    const trimmed = logs.slice(0, 10000);
    global.__activityLogsCache = trimmed;
    // Tulis ke os.tmpdir() secara non-blocking/aman
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving activity logs:', err);
  }
}

// GET: Fetch activity logs with rich filtering & stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    const userEmail = searchParams.get('userEmail') || '';
    const moduleFilter = searchParams.get('module') || '';
    const actionType = searchParams.get('actionType') || '';
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    // 1. Read local runtime logs
    const localLogs = readLocalLogs();

    // 2. Fetch database users & real user activities from Supabase
    let dbUsers: Array<{ id: string; email: string; role: string; created_at: string }> = [];
    const dbDerivedLogs: ActivityLogItem[] = [];

    if (isSupabaseConfigured) {
      try {
        // A. Fetch Registered Users from app_users
        const { data: usersData } = await supabaseAdmin
          .from('app_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersData && usersData.length > 0) {
          dbUsers = usersData;
        }

        // B. Fetch Form Submissions (RKAT & Pemohon)
        const { data: formData } = await supabaseAdmin
          .from('form_submissions')
          .select('id, email, unit, pic, created_at, status, tahun')
          .order('created_at', { ascending: false })
          .limit(100);

        if (formData && formData.length > 0) {
          formData.forEach((f) => {
            if (f.email) {
              dbDerivedLogs.push({
                id: `form-sub-${f.id}`,
                user_email: f.email.trim(),
                user_role: 'Unit Kerja / Pemohon',
                action_type: 'CREATE',
                action_title: `Submit Usulan RKAT ${f.tahun || ''} - ${f.unit || 'Unit Kerja'}`,
                module: 'ANGGARAN',
                path: '/input-form',
                details: {
                  unit: f.unit,
                  pic: f.pic,
                  status: f.status,
                  tipe: 'Form RKAT'
                },
                ip_address: 'UGM Network',
                user_agent: 'Web Client Portal Unit',
                created_at: f.created_at || new Date().toISOString()
              });
            }
          });
        }

        // C. Fetch MAK Submissions
        const { data: makData } = await supabaseAdmin
          .from('mak_submissions')
          .select('id, email, unit, pic, created_at, status, tahun, kategori')
          .order('created_at', { ascending: false })
          .limit(100);

        if (makData && makData.length > 0) {
          makData.forEach((m) => {
            if (m.email) {
              dbDerivedLogs.push({
                id: `mak-sub-${m.id}`,
                user_email: m.email.trim(),
                user_role: 'Unit Kerja / Pemohon',
                action_type: 'CREATE',
                action_title: `Submit Pengajuan MAK ${m.kategori || ''} - ${m.unit || 'Unit Kerja'}`,
                module: 'ANGGARAN',
                path: '/input-mak',
                details: {
                  unit: m.unit,
                  pic: m.pic,
                  status: m.status,
                  tipe: 'Pengajuan MAK'
                },
                ip_address: 'UGM Network',
                user_agent: 'Web Client Portal Unit',
                created_at: m.created_at || new Date().toISOString()
              });
            }
          });
        }

        // D. Fetch Tambah Pagu Activities
        const { data: tambahPaguData } = await supabaseAdmin
          .from('tambah_pagu')
          .select('id, no_surat_pengajuan, hal_surat_pengajuan, created_by, created_time, jenis_tambah_pagu')
          .order('created_time', { ascending: false })
          .limit(50);

        if (tambahPaguData && tambahPaguData.length > 0) {
          tambahPaguData.forEach((tp) => {
            if (tp.created_by) {
              // Match created_by to registered user if it is UUID or email
              const matchedUser = dbUsers.find(u => u.id === tp.created_by || u.email.toLowerCase() === tp.created_by.toLowerCase());
              const email = matchedUser ? matchedUser.email : (tp.created_by.includes('@') ? tp.created_by : 'admin@ugm.ac.id');
              const role = matchedUser ? matchedUser.role : 'Pemroses Anggaran';

              dbDerivedLogs.push({
                id: `tp-${tp.id}`,
                user_email: email,
                user_role: role,
                action_type: 'CREATE',
                action_title: `Input Tambah Pagu (${tp.jenis_tambah_pagu || 'Baru'}) - No: ${tp.no_surat_pengajuan || '-'}`,
                module: 'ANGGARAN',
                path: '/tambah-pagu',
                details: {
                  hal: tp.hal_surat_pengajuan,
                  no_surat: tp.no_surat_pengajuan
                },
                ip_address: '127.0.0.1',
                user_agent: 'Dashboard Web System',
                created_at: tp.created_time || new Date().toISOString()
              });
            }
          });
        }

        // E. Fetch Pengajuan Transfer Activities
        const { data: transferData } = await supabaseAdmin
          .from('pengajuan_transfer')
          .select('id, tanggal_pengajuan, kegiatan, nominal, status, barang, created_at, created_by')
          .order('created_at', { ascending: false })
          .limit(100);

        if (transferData && transferData.length > 0) {
          transferData.forEach((pt) => {
            const matchedUser = dbUsers.find(u => u.id === pt.created_by || u.email.toLowerCase() === (pt.barang || '').toLowerCase());
            const email = pt.barang?.includes('@') 
              ? pt.barang 
              : (matchedUser ? matchedUser.email : (pt.created_by?.includes('@') ? pt.created_by : 'takmir@ugm.ac.id'));
            const role = matchedUser ? matchedUser.role : 'Takmir Muda';

            dbDerivedLogs.push({
              id: `pt-${pt.id}`,
              user_email: email,
              user_role: role,
              action_type: 'CREATE',
              action_title: `Pengajuan Transfer: Rp ${Number(pt.nominal || 0).toLocaleString('id-ID')} (${pt.kegiatan || 'Transfer'})`,
              module: 'MASJID',
              path: '/input-transfer',
              details: {
                nominal: pt.nominal,
                status: pt.status,
                kegiatan: pt.kegiatan
              },
              ip_address: 'Portal Web',
              user_agent: 'Web Client',
              created_at: pt.created_at || (pt.tanggal_pengajuan ? `${pt.tanggal_pengajuan}T08:00:00.000Z` : new Date().toISOString())
            });
          });
        }

        // F. Fetch Kas Transaksi Activities
        const { data: trxData } = await supabaseAdmin
          .from('transactions')
          .select('id, tanggal, uraian, uang_masuk, uang_keluar, disetujui, created_at, created_by')
          .order('id', { ascending: false })
          .limit(100);

        if (trxData && trxData.length > 0) {
          trxData.forEach((tx) => {
            const matchedUser = dbUsers.find(u => u.id === tx.created_by);
            const email = matchedUser ? matchedUser.email : 'takmir@ugm.ac.id';
            const role = matchedUser ? matchedUser.role : 'Takmir Muda';
            const nominal = Number(tx.uang_keluar || tx.uang_masuk || 0);

            dbDerivedLogs.push({
              id: `trx-${tx.id}`,
              user_email: email,
              user_role: role,
              action_type: 'CREATE',
              action_title: `Input Kas: Rp ${nominal.toLocaleString('id-ID')} - ${tx.uraian || 'Transaksi'}`,
              module: 'MASJID',
              path: '/input',
              details: {
                uang_masuk: tx.uang_masuk,
                uang_keluar: tx.uang_keluar,
                uraian: tx.uraian
              },
              ip_address: 'Portal Web',
              user_agent: 'Web Client',
              created_at: tx.created_at || (tx.tanggal ? `${tx.tanggal}T08:00:00.000Z` : new Date().toISOString())
            });
          });
        }
      } catch (err: any) {
        console.error('Error querying Supabase tables for logs:', err?.message);
      }
    }

    // 3. Merge & Deduplicate All Logs
    const logMap = new Map<string, ActivityLogItem>();
    [...localLogs, ...dbDerivedLogs].forEach((l) => {
      if (!logMap.has(l.id)) {
        logMap.set(l.id, l);
      }
    });

    const allLogs = Array.from(logMap.values());

    // 4. Calculate Timestamps
    const now = Date.now();
    const fifteenMinAgo = now - 15 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const activeUserEmails = new Set<string>();
    const todayLogsCount = allLogs.filter(l => new Date(l.created_at) >= startOfToday).length;

    // 5. Build Comprehensive User Summaries (Including ALL db registered users + submission users)
    const userSummaryMap: Record<string, {
      email: string;
      role: string;
      registeredAt?: string;
      isRegistered: boolean;
      unit?: string;
      lastActive: string;
      lastLogin: string | null;
      lastAction: string;
      lastPath: string;
      totalActions: number;
      isOnline: boolean;
    }> = {};

    // First: Populate ALL registered users from database
    dbUsers.forEach((u) => {
      const emailLower = u.email.toLowerCase().trim();
      userSummaryMap[emailLower] = {
        email: u.email,
        role: u.role || 'Viewer',
        registeredAt: u.created_at,
        isRegistered: true,
        lastActive: u.created_at,
        lastLogin: null,
        lastAction: 'Akun Terdaftar di Sistem',
        lastPath: '/login',
        totalActions: 0,
        isOnline: false
      };
    });

    // Second: Aggregate logs for every user
    allLogs.forEach((log) => {
      if (!log.user_email) return;
      const emailLower = log.user_email.toLowerCase().trim();
      const logTime = new Date(log.created_at).getTime();

      if (logTime >= fifteenMinAgo) {
        activeUserEmails.add(emailLower);
      }

      if (!userSummaryMap[emailLower]) {
        userSummaryMap[emailLower] = {
          email: log.user_email,
          role: log.user_role || 'Unit Kerja / Pemohon',
          isRegistered: false,
          unit: log.details?.unit || undefined,
          lastActive: log.created_at,
          lastLogin: log.action_type === 'LOGIN' ? log.created_at : null,
          lastAction: log.action_title,
          lastPath: log.path || '/',
          totalActions: 1,
          isOnline: logTime >= fifteenMinAgo
        };
      } else {
        const u = userSummaryMap[emailLower];
        u.totalActions += 1;
        if (log.details?.unit && !u.unit) {
          u.unit = log.details.unit;
        }
        if (new Date(log.created_at) > new Date(u.lastActive)) {
          u.lastActive = log.created_at;
          u.lastAction = log.action_title;
          u.lastPath = log.path || u.lastPath;
          u.isOnline = logTime >= fifteenMinAgo;
        }
        if (log.action_type === 'LOGIN' && (!u.lastLogin || new Date(log.created_at) > new Date(u.lastLogin))) {
          u.lastLogin = log.created_at;
        }
        if (logTime >= fifteenMinAgo) {
          u.isOnline = true;
        }
      }
    });

    // 6. Filter logs for response
    let filtered = allLogs.filter(item => {
      if (userEmail && userEmail !== 'ALL' && item.user_email.toLowerCase() !== userEmail.toLowerCase()) {
        return false;
      }
      if (moduleFilter && moduleFilter !== 'ALL' && item.module.toUpperCase() !== moduleFilter.toUpperCase()) {
        return false;
      }
      if (actionType && actionType !== 'ALL' && item.action_type !== actionType) {
        return false;
      }
      if (startDate && new Date(item.created_at) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(item.created_at) > new Date(endDate + 'T23:59:59.999Z')) {
        return false;
      }
      if (search) {
        const titleMatch = item.action_title?.toLowerCase().includes(search);
        const emailMatch = item.user_email?.toLowerCase().includes(search);
        const roleMatch = item.user_role?.toLowerCase().includes(search);
        const pathMatch = item.path?.toLowerCase().includes(search);
        const moduleMatch = item.module?.toLowerCase().includes(search);
        const detailsMatch = JSON.stringify(item.details || {}).toLowerCase().includes(search);
        if (!titleMatch && !emailMatch && !roleMatch && !pathMatch && !moduleMatch && !detailsMatch) {
          return false;
        }
      }
      return true;
    });

    // Sort descending (most recent first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Top Modules breakdown
    const moduleCounts: Record<string, number> = {};
    allLogs.forEach(l => {
      const m = l.module || 'LAINNYA';
      moduleCounts[m] = (moduleCounts[m] || 0) + 1;
    });

    // Sort user summaries (online first, then active recent first)
    const userSummariesList = Object.values(userSummaryMap).sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalLogsCount: allLogs.length,
        todayLogsCount,
        activeUsersCount: activeUserEmails.size,
        registeredUsersCount: dbUsers.length,
        totalTrackedUsers: userSummariesList.length,
        moduleCounts
      },
      userSummaries: userSummariesList,
      logs: filtered.slice(0, limit),
      totalFiltered: filtered.length
    });
  } catch (error: any) {
    console.error('API Activity Logs Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add new activity log
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      user_email,
      user_role = 'Viewer',
      action_type = 'PAGE_VIEW',
      action_title,
      module = 'UMUM',
      path: reqPath = '',
      details = {}
    } = body;

    if (!user_email || !action_title) {
      return NextResponse.json({ success: false, error: 'user_email dan action_title wajib diisi' }, { status: 400 });
    }

    // Extract Client IP and User Agent from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip_address = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1');
    const user_agent = req.headers.get('user-agent') || 'Browser Web';

    const newLogItem: ActivityLogItem = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      user_id,
      user_email,
      user_role,
      action_type,
      action_title,
      module: module.toUpperCase(),
      path: reqPath,
      details,
      ip_address,
      user_agent,
      created_at: new Date().toISOString()
    };

    // Save to local file
    const currentLogs = readLocalLogs();
    currentLogs.unshift(newLogItem);
    writeLocalLogs(currentLogs);

    // Optional background sync to Supabase if table exists
    if (isSupabaseConfigured) {
      Promise.resolve(supabaseAdmin.from('user_activity_logs').insert([newLogItem])).catch(() => {});
    }

    return NextResponse.json({ success: true, log: newLogItem });
  } catch (error: any) {
    console.error('API Log Creation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Clear all or older logs
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keepDays = searchParams.get('keepDays');

    if (keepDays) {
      const days = parseInt(keepDays, 10);
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const currentLogs = readLocalLogs();
      const retained = currentLogs.filter(l => l.created_at >= cutoff);
      writeLocalLogs(retained);
      return NextResponse.json({ success: true, message: `Log lebih lama dari ${days} hari berhasil dibersihkan.`, remaining: retained.length });
    }

    // Clear all except recent 10 seed logs
    writeLocalLogs([]);
    return NextResponse.json({ success: true, message: 'Semua riwayat log aktivitas berhasil dibersihkan.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
