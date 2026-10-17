import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import nodemailer from 'nodemailer';

// GET: Cek validitas token dan ambil data awal pengajuan
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token revisi tidak disertakan' }, { status: 400 });
    }

    let matched: any = null;

    // 1. Coba lookup instan via ID yang disematkan pada token: rev_{id}_{timestamp}_{random}
    const idMatch = token.match(/^rev_(\d+)_/);
    if (idMatch) {
      const targetId = Number(idMatch[1]);
      const { data, error } = await supabaseAdmin
        .from('mak_submissions')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (!error && data) {
        matched = data;
      }
    }

    // 2. Fallback jika format token tanpa ID atau data belum ketemu
    if (!matched) {
      const { data: submissions, error } = await supabaseAdmin
        .from('mak_submissions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      matched = (submissions || []).find((s: any) => {
        if (Array.isArray(s.lampiran_catatan)) {
          return s.lampiran_catatan.some((c: any) => c.type === 'revisi_meta' && c.token === token);
        }
        return false;
      });
    }

    if (!matched) {
      return NextResponse.json({ success: false, error: 'Tautan revisi tidak valid atau telah kedaluwarsa.' }, { status: 404 });
    }

    const revisiMeta = Array.isArray(matched.lampiran_catatan)
      ? matched.lampiran_catatan.find((c: any) => c.type === 'revisi_meta' && c.token === token)
      : null;

    // Filter file catatan yang asli (bukan revisi_meta / rka_selisih_data)
    const existingNotes = Array.isArray(matched.lampiran_catatan)
      ? matched.lampiran_catatan.filter((c: any) => c.type !== 'revisi_meta' && c.type !== 'rka_selisih_data')
      : [];

    return NextResponse.json({
      success: true,
      submission: {
        id: matched.id,
        unit: matched.unit,
        tahun: matched.tahun,
        pic: matched.pic,
        email: matched.email,
        status: matched.status,
        lampiran_excel: matched.lampiran_excel,
        lampiran_catatan: existingNotes,
        rka_selisih_data: matched.rka_selisih_data || null,
        created_at: matched.created_at,
      },
      catatanRevisi: revisiMeta?.catatan || 'Mohon lengkapi atau perbaiki berkas yang diminta verifikator.',
      requestedAt: revisiMeta?.requested_at || null,
      currentStatus: matched.status,
    });
  } catch (error: any) {
    console.error('Error GET revisi MAK:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal memuat data revisi' }, { status: 500 });
  }
}

// POST: Terima upload revisi dari unit kerja dan update status ke 'Revisi Masuk'
export async function POST(req: NextRequest) {
  try {
    const { token, newExcelUrl, newNoteUrls, rkaParseResult, catatanPengirim } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token revisi tidak valid' }, { status: 400 });
    }

    let matched: any = null;

    // 1. Coba lookup instan via ID yang disematkan pada token: rev_{id}_{timestamp}_{random}
    const idMatch = token.match(/^rev_(\d+)_/);
    if (idMatch) {
      const targetId = Number(idMatch[1]);
      const { data, error } = await supabaseAdmin
        .from('mak_submissions')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (!error && data) {
        matched = data;
      }
    }

    // 2. Fallback jika format token tanpa ID
    if (!matched) {
      const { data: submissions, error } = await supabaseAdmin
        .from('mak_submissions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      matched = (submissions || []).find((s: any) => {
        if (Array.isArray(s.lampiran_catatan)) {
          return s.lampiran_catatan.some((c: any) => c.type === 'revisi_meta' && c.token === token);
        }
        return false;
      });
    }

    if (!matched) {
      return NextResponse.json({ success: false, error: 'Data pengajuan dengan token tersebut tidak ditemukan.' }, { status: 404 });
    }

    const currentNotes = Array.isArray(matched.lampiran_catatan) ? [...matched.lampiran_catatan] : [];
    const oldMeta = currentNotes.find((c: any) => c.type === 'revisi_meta');
    const filteredCatatan = currentNotes.filter((c: any) => c.type !== 'revisi_meta');

    // Gabungkan file catatan tambahan baru jika ada
    const combinedNotes = [...filteredCatatan];
    if (Array.isArray(newNoteUrls) && newNoteUrls.length > 0) {
      newNoteUrls.forEach((n: any) => {
        if (!combinedNotes.some((ex: any) => ex.url === n.url)) {
          combinedNotes.push(n);
        }
      });
    }

    // Update revisi_meta
    const updatedMeta = {
      type: 'revisi_meta',
      token,
      catatan: oldMeta?.catatan || '',
      status: 'Revisi Masuk',
      submitted_at: new Date().toISOString(),
      catatan_pengirim: catatanPengirim || '',
      history: [
        ...(oldMeta?.history || []),
        {
          action: 'dikirim_ulang_oleh_unit',
          date: new Date().toISOString(),
          catatanPengirim: catatanPengirim || 'Unit telah mengunggah perbaikan berkas.',
        }
      ]
    };
    combinedNotes.push(updatedMeta);

    // Siapkan payload update
    const updatePayload: any = {
      status: 'Revisi Masuk',
      lampiran_catatan: combinedNotes,
      updated_at: new Date().toISOString()
    };

    if (newExcelUrl) {
      updatePayload.lampiran_excel = newExcelUrl;
    }

    if (rkaParseResult) {
      updatePayload.rka_selisih_data = rkaParseResult;
    }

    const { error: updateError } = await supabaseAdmin
      .from('mak_submissions')
      .update(updatePayload)
      .eq('id', matched.id);

    if (updateError) throw updateError;

    // Kirim notifikasi email ke PIC Verifikator jika ada (dengan batas toleransi timeout 2.5s)
    if (matched.pic && matched.pic !== '-' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const sendPicEmail = async () => {
        const { data: picRecord } = await supabaseAdmin
          .from('gov_pics')
          .select('nama, email')
          .ilike('nama', matched.pic.trim())
          .single();

        if (picRecord?.email) {
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: false,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
            connectionTimeout: 4000,
            greetingTimeout: 4000,
            socketTimeout: 4000,
          });

          await transporter.sendMail({
            from: `"Verifikasi Anggaran UGM" <${process.env.EMAIL_USER}>`,
            to: picRecord.email,
            subject: `[Revisi Masuk] Unit ${matched.unit} Telah Memperbaiki Berkas MAK (${matched.tahun})`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
                <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 28px; border-radius: 16px 16px 0 0; color: white; text-align: center;">
                  <h2 style="margin: 0; font-size: 20px;">Berkas Revisi Telah Dikirimkan</h2>
                  <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">Unit kerja telah memperbaiki usulan MAK</p>
                </div>
                <div style="background: white; padding: 28px; border: 1px solid #e2e8f0; border-radius: 0 0 16px 16px;">
                  <p style="font-size: 14px; margin-top: 0;">Halo <strong>${picRecord.nama}</strong>,</p>
                  <p style="font-size: 14px; color: #475569;">
                    Unit <strong>${matched.unit}</strong> (${matched.tahun}) telah mengunggah perbaikan berkas pengajuan MAK yang sebelumnya Anda minta untuk direvisi.
                  </p>
                  ${catatanPengirim ? `
                    <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
                      <span style="font-size: 11px; font-weight: bold; color: #059669; text-transform: uppercase;">Pesan dari Pengirim:</span>
                      <p style="margin: 4px 0 0; font-size: 13px; color: #1e293b;">${catatanPengirim}</p>
                    </div>
                  ` : ''}
                  <p style="font-size: 13px; color: #64748b;">
                    Silakan buka dashboard verifikasi di menu <strong>Monitoring Revisi MAK</strong> untuk memeriksa berkas yang telah diperbarui.
                  </p>
                </div>
              </div>
            `,
          });
        }
      };

      try {
        await Promise.race([
          sendPicEmail(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('PIC email timeout')), 2500))
        ]);
      } catch (err: any) {
        console.warn('[Revisi MAK] Gagal kirim email ke PIC verifikator:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Perbaikan berkas berhasil disimpan. Verifikator telah diberitahu.',
      status: 'Revisi Masuk'
    });

  } catch (error: any) {
    console.error('Error POST revisi MAK:', error);
    return NextResponse.json({ success: false, error: error.message || 'Gagal menyimpan berkas revisi' }, { status: 500 });
  }
}
