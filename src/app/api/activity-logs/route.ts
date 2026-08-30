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
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const userEmail = searchParams.get('userEmail') || '';
    const moduleFilter = searchParams.get('module') || '';
    const actionType = searchParams.get('actionType') || '';
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const allLogs = readLocalLogs();

    // Filter logs
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

    // Calculate Statistics
    const now = Date.now();
    const fifteenMinAgo = now - 15 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const activeUserEmails = new Set<string>();
    const todayLogsCount = allLogs.filter(l => new Date(l.created_at) >= startOfToday).length;

    // Per User summary calculation
    const userSummaryMap: Record<string, {
      email: string;
      role: string;
      lastActive: string;
      lastLogin: string | null;
      lastAction: string;
      lastPath: string;
      totalActions: number;
      isOnline: boolean;
    }> = {};

    allLogs.forEach(log => {
      const email = log.user_email;
      const logTime = new Date(log.created_at).getTime();

      if (logTime >= fifteenMinAgo) {
        activeUserEmails.add(email);
      }

      if (!userSummaryMap[email]) {
        userSummaryMap[email] = {
          email,
          role: log.user_role || 'Viewer',
          lastActive: log.created_at,
          lastLogin: log.action_type === 'LOGIN' ? log.created_at : null,
          lastAction: log.action_title,
          lastPath: log.path || '/',
          totalActions: 1,
          isOnline: logTime >= fifteenMinAgo
        };
      } else {
        const u = userSummaryMap[email];
        u.totalActions += 1;
        if (new Date(log.created_at) > new Date(u.lastActive)) {
          u.lastActive = log.created_at;
          u.lastAction = log.action_title;
          u.lastPath = log.path || u.lastPath;
          u.isOnline = logTime >= fifteenMinAgo;
        }
        if (log.action_type === 'LOGIN' && (!u.lastLogin || new Date(log.created_at) > new Date(u.lastLogin))) {
          u.lastLogin = log.created_at;
        }
      }
    });

    // Top Modules breakdown
    const moduleCounts: Record<string, number> = {};
    allLogs.forEach(l => {
      const m = l.module || 'LAINNYA';
      moduleCounts[m] = (moduleCounts[m] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalLogsCount: allLogs.length,
        todayLogsCount,
        activeUsersCount: activeUserEmails.size,
        totalTrackedUsers: Object.keys(userSummaryMap).length,
        moduleCounts
      },
      userSummaries: Object.values(userSummaryMap).sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()),
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
