import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const apiUrl = process.env.NEXT_PUBLIC_NEW_SHEETS_URL;
    
    if (!apiUrl) {
      return NextResponse.json({ status: 'error', message: 'NEXT_PUBLIC_NEW_SHEETS_URL is not defined in .env' }, { status: 500 });
    }

    // Forward the POST request to the new Google Apps Script
    const response = await fetch(`${apiUrl}?action=updateTransaksi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();

    if (result.status === 'success') {
      return NextResponse.json({ status: 'success', message: 'Berhasil mengupdate ke Google Sheets' });
    } else {
      return NextResponse.json({ status: 'error', message: result.message || 'Gagal dari Apps Script' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating via Google Sheets API:', error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
