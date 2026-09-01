import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, error: 'Parameter to, subject, dan isi email wajib diisi.' },
        { status: 400 }
      );
    }

    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT) || 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.warn('Konfigurasi EMAIL_USER atau EMAIL_PASS belum diset di .env');
      return NextResponse.json(
        { success: false, error: 'Email configuration is missing in environment variables.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"Notifikasi Kas & Transfer" <${user}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: text || '',
      html: html || '',
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Gagal mengirim email:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengirim email' },
      { status: 500 }
    );
  }
}
