import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_NEW_SHEETS_URL;
  
  if (!apiUrl) {
    return NextResponse.json({ status: 'error', message: 'Missing API URL in .env' }, { status: 500 });
  }

  try {
    const res = await fetch(`${apiUrl}?action=getTransaksi`, { 
      cache: 'no-store',
      // Supaya Google tahu ini bukan browser yang minta, jadi tidak di-block CORS
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!res.ok) {
      throw new Error(`Google API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Route Error:', error.message);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
