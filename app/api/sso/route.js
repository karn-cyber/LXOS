import { NextResponse } from 'next/server';
import { verifyRishiverseToken, createSessionToken, SSO_COOKIE, sessionCookieOptions } from '@/lib/sso';

export const runtime = 'nodejs';

// Entry point for Rishiverse SSO. Rishiverse redirects the user here with a
// signed JWT containing their email (?token=...). We verify the signature with
// the shared secret, then drop our own session cookie and send them in.
export async function GET(request) {
    const url = new URL(request.url);
    const origin = url.origin;
    const token = url.searchParams.get('token')
        || url.searchParams.get('jwt')
        || url.searchParams.get('sso');

    const email = verifyRishiverseToken(token);
    if (!email) {
        return NextResponse.redirect(`${origin}/login?sso=failed`);
    }

    const res = NextResponse.redirect(`${origin}/dashboard`);
    res.cookies.set(SSO_COOKIE, createSessionToken(email), sessionCookieOptions);
    return res;
}
