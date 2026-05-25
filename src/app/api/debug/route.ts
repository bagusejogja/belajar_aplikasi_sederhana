import { NextResponse } from 'next/server';

export async function GET() {
  const accountId = process.env.R2_ACCOUNT_ID || '';
  const accessKey = process.env.R2_ACCESS_KEY_ID || '';
  const secretKey = process.env.R2_SECRET_ACCESS_KEY || '';

  // Fungsi untuk mengecek apakah format string hanya berisi karakter alfanumerik (hex)
  const isHex = (str: string) => /^[0-9a-fA-F]+$/.test(str);

  const diagnostic = {
    message: "Diagnostic Endpoint for Vercel Environment Variables",
    r2_account_id: {
      length: accountId.length,
      has_https: accountId.includes('http'),
      has_spaces: /\s/.test(accountId),
      has_dots: accountId.includes('.'),
      looks_valid: accountId.length === 32 && isHex(accountId),
      value_hint: accountId.substring(0, 4) + '...' + accountId.substring(accountId.length - 4),
    },
    r2_access_key: {
      length: accessKey.length,
      is_empty: accessKey === '',
    },
    r2_secret_key: {
      length: secretKey.length,
      is_empty: secretKey === '',
    },
    node_tls: process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'not set',
  };

  return NextResponse.json(diagnostic);
}
