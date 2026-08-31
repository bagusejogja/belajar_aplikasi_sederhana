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

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');

// Helper to ensure data file exists
function readLocalLogs(): ActivityLogItem[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOGS_FILE)) {
      // Seed with initial sample activity logs so monitoring is lively right away
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
        },
        {
          id: 'log-seed-2',
          user_email: 'bagusejogja@gmail.com',
          user_role: 'Admin',
          action_type: 'PAGE_VIEW',
          action_title: 'Membuka menu Editor HTML Surat',
          module: 'PERSURATAN',
          path: '/surat/editor-html',
          details: { page_title: 'Editor HTML Surat' },
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString()
        },
        {
          id: 'log-seed-3',
          user_email: 'dokumenebagusejogja@gmail.com',
          user_role: 'Pemroses Anggaran',
          action_type: 'LOGIN',
          action_title: 'Berhasil login ke sistem',
          module: 'AUTH',
          path: '/login',
          details: { method: 'password', platform: 'Web' },
          ip_address: '192.168.100.15',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString()
        },
        {
          id: 'log-seed-4',
          user_email: 'dokumenebagusejogja@gmail.com',
          user_role: 'Pemroses Anggaran',
          action_type: 'PAGE_VIEW',
          action_title: 'Membuka menu Potret Mutasi Pagu',
          module: 'ANGGARAN',
          path: '/potret-mutasi-pagu',
          details: { page_title: 'Potret Mutasi Pagu' },
          ip_address: '192.168.100.15',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
        }
      ];
      fs.writeFileSync(LOGS_FILE, JSON.stringify(initialLogs, null, 2), 'utf8');
      return initialLogs;
    }

    const content = fs.readFileSync(LOGS_FILE, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading activity logs file:', err);
    return [];
  }
}

function writeLocalLogs(logs: ActivityLogItem[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Limit to max 10,000 logs to prevent file from growing indefinitely
    const trimmed = logs.slice(0, 10000);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving activity logs file:', err);
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
