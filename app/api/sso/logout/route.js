import { NextResponse } from 'next/server';
import { SSO_COOKIE } from '@/lib/sso';

export const runtime = 'nodejs';

// Clears the SSO session cookie (used by the sidebar logout for SSO users).
export async function POST(request) {
    const res = NextResponse.json({ success: true });
    res.cookies.set(SSO_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
}
