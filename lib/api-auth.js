import { getDashboardSession } from '@/lib/dashboard-session';

/**
 * Drop-in replacement for the old next-auth `auth()` used by API routes.
 *
 * The app authenticates with Clerk (see middleware.ts / login flow), but many
 * API routes were written against next-auth's `auth()`. next-auth has no active
 * session here, so those routes were returning 401 on every request.
 *
 * `getDashboardSession()` maps the Clerk session -> Mongo user + role and
 * returns the exact same `{ user: { id, role, clubId, clubName, clanId,
 * clanName, email, name } }` shape next-auth returned, so this is a clean
 * drop-in: routes only need to swap the import.
 *
 * Returns null when there is no authenticated user (mirrors next-auth).
 */
export async function auth() {
    try {
        return await getDashboardSession();
    } catch (error) {
        console.error('[api-auth] session resolution failed:', error?.message || error);
        return null;
    }
}
