import crypto from 'crypto';
import { cookies } from 'next/headers';

// Our own session cookie (set after a valid Rishiverse hand-off).
export const SSO_COOKIE = 'lxos_session';

// Secret used to sign OUR session cookie. Falls back to existing auth secrets.
const sessionSecret = () =>
    process.env.SSO_SESSION_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';

// Shared secret with Rishiverse, used to VERIFY the token they hand us.
const rishiverseSecret = () => process.env.RISHIVERSE_SSO_SECRET || '';

function b64urlJSON(obj) {
    return Buffer.from(JSON.stringify(obj)).toString('base64url');
}
function hmac(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

// Verify an HS256 JWT and return its payload, or null if invalid/expired.
export function verifyJwtHS256(token, secret) {
    if (!token || !secret) return null;
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const expected = hmac(`${h}.${p}`, secret);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    let payload;
    try { payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')); } catch { return null; }
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
}

export function createJwtHS256(payload, secret, expiresInSec = 60 * 60 * 24 * 7) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const body = { ...payload, iat: now, exp: now + expiresInSec };
    const data = `${b64urlJSON(header)}.${b64urlJSON(body)}`;
    return `${data}.${hmac(data, secret)}`;
}

// Verify the token Rishiverse redirected with and pull out the email.
export function verifyRishiverseToken(token) {
    const payload = verifyJwtHS256(token, rishiverseSecret());
    if (!payload) return null;
    const email = payload.email || payload.email_address || payload.mail || payload.sub;
    return email ? String(email).toLowerCase().trim() : null;
}

export function createSessionToken(email) {
    return createJwtHS256({ email }, sessionSecret());
}

// Read the email from our own session cookie (server side).
export async function getSsoEmail() {
    try {
        if (!sessionSecret()) return null;
        const store = await cookies();
        const token = store.get(SSO_COOKIE)?.value;
        const payload = verifyJwtHS256(token, sessionSecret());
        return payload?.email ? String(payload.email).toLowerCase().trim() : null;
    } catch {
        return null;
    }
}

export const sessionCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
};
