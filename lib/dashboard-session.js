import { auth, clerkClient } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
// Referenced by populate('clubId'/'clanId') below — register their schemas so
// users who belong to a club/clan don't trigger a MissingSchemaError on login.
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import { getRoleFromRUData, lookupRUUser } from '@/lib/ru-data-mapper';
import { getSsoEmail } from '@/lib/sso';

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim().replace(/\s+/g, '');
}

const looksLikeEmailLocalPart = (n, mail) =>
    !!n && !!mail && n.trim().toLowerCase() === mail.split('@')[0].toLowerCase();

// Build the app session for a known email — shared by Clerk and Rishiverse SSO.
// Provisions the Mongo user if missing so `id` is always a real ObjectId.
async function buildSessionForEmail(normalizedEmail, { clerkName = '', userId = null } = {}) {
    if (!normalizedEmail) return null;
    await dbConnect();

    let dbUser = await User.findOne({ email: normalizedEmail })
        .populate('clubId', 'name').populate('clanId', 'name').lean();

    const storedNameIsReal = dbUser?.name && !looksLikeEmailLocalPart(dbUser.name, normalizedEmail);
    const ruName = lookupRUUser(normalizedEmail)?.name || '';
    const displayName = clerkName
        || (storedNameIsReal ? dbUser.name : '')
        || ruName
        || dbUser?.name
        || normalizedEmail.split('@')[0];

    const resolvedRole = dbUser?.role
        || getRoleFromRUData(normalizedEmail)
        || resolveAdminExceptionRole(normalizedEmail)
        || 'GUEST';

    if (!dbUser) {
        try {
            await User.updateOne(
                { email: normalizedEmail },
                { $setOnInsert: { email: normalizedEmail, name: displayName, role: resolvedRole, isActive: true } },
                { upsert: true }
            );
            dbUser = await User.findOne({ email: normalizedEmail })
                .populate('clubId', 'name').populate('clanId', 'name').lean();
        } catch (error) {
            console.error('[dashboard-session] user provisioning failed:', error?.message || error);
        }
    }

    // Keep the stored name in sync with the real (Clerk) name when we have one.
    if (dbUser?._id && clerkName && clerkName !== dbUser.name) {
        try { await User.updateOne({ _id: dbUser._id }, { $set: { name: clerkName } }); }
        catch (error) { console.error('[dashboard-session] name sync failed:', error?.message || error); }
    }

    return {
        user: {
            id: dbUser?._id?.toString() || userId,
            name: displayName,
            email: normalizedEmail,
            role: dbUser?.role || resolvedRole,
            clubId: dbUser?.clubId?._id?.toString() || null,
            clubName: dbUser?.clubId?.name || null,
            clanId: dbUser?.clanId?._id?.toString() || null,
            clanName: dbUser?.clanId?.name || null,
        },
    };
}

function resolveAdminExceptionRole(email) {
    if (email === 'admin@lxos.edu') return 'ADMIN';
    if (email === 'lx@lxos.edu') return 'LX_TEAM';
    if (email === 'clubhead@lxos.edu') return 'CLUB_HEAD';
    if (email === 'finance@lxos.edu') return 'FINANCE';
    // Named role assignments
    if (email === 'neelanshu.2024@nst.rishihood.edu.in') return 'ADMIN';
    if (email === 'sast@rishihood.edu.in') return 'CLUB_HEAD';
    if (email === 'mehak.m@rishihood.edu.in') return 'ADMIN';
    if (email === 'sandeep.s@rishihood.edu.in') return 'ADMIN';
    if (email === 'sohom.g@rishihood.edu.in') return 'ADMIN';
    if (email === 'soumya.a@rishihood.edu.in') return 'ADMIN';
    return null;
}

export async function getDashboardSession() {
    // 1) Rishiverse SSO — if a valid SSO session cookie is present, use it.
    const ssoEmail = await getSsoEmail();
    if (ssoEmail) {
        return await buildSessionForEmail(normalizeEmail(ssoEmail));
    }

    // 2) Clerk session (the existing login path).
    const { userId, sessionClaims } = await auth();
    if (!userId) {
        return null;
    }

    let email = sessionClaims?.email || sessionClaims?.email_address || '';
    let clerkName = sessionClaims?.name
        || [sessionClaims?.firstName, sessionClaims?.lastName].filter(Boolean).join(' ')
        || '';

    // Fall back to a Clerk API lookup only when claims lack the email or name.
    if (!email || !clerkName) {
        try {
            const client = await clerkClient();
            const u = await client.users.getUser(userId);
            const primaryEmail =
                u.emailAddresses.find((entry) => entry.id === u.primaryEmailAddressId) ||
                u.emailAddresses[0];
            email = email || primaryEmail?.emailAddress || '';
            clerkName = clerkName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || '';
        } catch (error) {
            console.error('[dashboard-session] Clerk user lookup failed:', error);
        }
    }

    return await buildSessionForEmail(normalizeEmail(email), { clerkName, userId });
}