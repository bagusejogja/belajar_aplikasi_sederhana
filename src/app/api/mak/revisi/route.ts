import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
  process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder')
);

// GET: Cek validitas token dan ambil data awal pengajuan
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token revisi tidak disertakan' }, { status: 400 });
    }

    // Cari submission yang memiliki token ini di lampiran_catatan
    // Ambil data submission terbaru
    const { data: submissions, error } = await supabaseAdmin
      .from('mak_submissions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const matched = (submissions || []).find((s: any) => {
      if (Array.isArray(s.lampiran_catatan)) {
        return s.lampiran_catatan.some((c: any) => c.type === 'revisi_meta' && c.token === token);
      }
      return false;
    });

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

    // Cari submission
    const { data: submissions, error } = await supabaseAdmin
      .from('mak_submissions')
      .select('*');

    if (error) throw error;

    const matched = (submissions || []).find((s: any) => {
      if (Array.isArray(s.lampiran_catatan)) {
        return s.lampiran_catatan.some((c: any) => c.type === 'revisi_meta' && c.token === token);
      }
      return false;
    });

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
        // Cek duplikasi url
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

    // Kirim notifikasi email ke PIC Verifikator jika ada
    if (matched.pic && matched.pic !== '-') {
      try {
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
          });

          await transporter.sendMail({
            from: `"Verifikasi Anggaran UGM" <${process.env.EMAIL_USER}>`,
            to: picRecord.email,
            subject: `[Revisi Masuk] Unit ${matched.unit} Telah Memperbaiki Berkas MAK (${matched.tahun})`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 20px;">
                <div style="background: linear-gradient(135deg, #0284c7, #2563eb); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
                  <h2 style="margin: 0; font-size: 20px;">📬 Berkas Revisi Telah Dikirim Ulang</h2>
                  <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Pemberitahuan untuk PIC Verifikator: ${picRecord.nama}</p>
                </div>
                <div style="background: white; padding: 24px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
                  <p style="font-size: 14px; color: #334155; margin-top: 0;">
                    Unit Kerja <strong>${matched.unit}</strong> telah mengirimkan berkas revisi / perbaikan MAK Tahun <strong>${matched.tahun}</strong>.
                  </p>
                  ${catatanPengirim ? `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
                      <strong style="color: #166534; font-size: 12px; display: block; margin-bottom: 4px;">Keterangan dari Unit:</strong>
                      <span style="color: #14532d; font-size: 13px;">${catatanPengirim}</span>
                    </div>
                  ` : ''}
                  <div style="margin-top: 24px; text-align: center;">
                    <a href="https://portalkeu.vercel.app/anggaran/mak" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
                      Buka Tabel Monitoring /anggaran/mak &rarr;
                    </a>
                  </div>
                </div>
              </div>
            `,
          });
        }
      } catch (mailErr) {
        console.error('Gagal kirim email notif ke PIC:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Perbaikan berkas berhasil disimpan. Verifikator telah menerima laporan pengiriman ulang.',
      submissionId: matched.id
    });

  } catch (error: any) {
    console.error('Error POST revisi MAK:', error);
    return NextResponse.json({ success: false, error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
