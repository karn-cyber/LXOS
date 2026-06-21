import { auth, clerkClient } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getRoleFromRUData, lookupRUUser } from '@/lib/ru-data-mapper';

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim().replace(/\s+/g, '');
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
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return null;
    }

    let email = sessionClaims?.email || sessionClaims?.email_address || '';
    // Clerk's real name — prefer an explicit claim, else assemble from name parts.
    let clerkName = sessionClaims?.name
        || [sessionClaims?.firstName, sessionClaims?.lastName].filter(Boolean).join(' ')
        || '';

    const looksLikeEmailLocalPart = (n, mail) =>
        !!n && !!mail && n.trim().toLowerCase() === mail.split('@')[0].toLowerCase();

    let dbUser = null;
    if (email) {
        // Resolve the DB user up front so we can decide whether a Clerk lookup is
        // even needed (avoids an API call on every request once the name is synced).
        await dbConnect();
        dbUser = await User.findOne({ email: normalizeEmail(email) })
            .populate('clubId', 'name')
            .populate('clanId', 'name')
            .lean();
    }

    const storedNameIsReal = dbUser?.name && !looksLikeEmailLocalPart(dbUser.name, email);

    // Fall back to a Clerk API lookup when we lack the email, or lack a real name
    // both from the claims and from the stored user record.
    if (!email || (!clerkName && !storedNameIsReal)) {
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

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return null;
    }

    await dbConnect();
    // If we resolved the email only via the Clerk lookup above, fetch the user now.
    if (!dbUser) {
        dbUser = await User.findOne({ email: normalizedEmail })
            .populate('clubId', 'name')
            .populate('clanId', 'name')
            .lean();
    }

    const ruName = lookupRUUser(normalizedEmail)?.name || '';

    // Display name priority: Clerk's real name > stored real name > RU data > email local part.
    const displayName = clerkName
        || (storedNameIsReal ? dbUser.name : '')
        || ruName
        || dbUser?.name
        || normalizedEmail.split('@')[0];

    // Keep the stored name in sync with Clerk so every populated reference
    // (reimbursements, events, achievements) shows the real name. Only write when
    // Clerk gave us a real name that differs from what's stored.
    if (dbUser?._id && clerkName && clerkName !== dbUser.name) {
        try {
            await User.updateOne({ _id: dbUser._id }, { $set: { name: clerkName } });
        } catch (error) {
            console.error('[dashboard-session] name sync failed:', error?.message || error);
        }
    }

    const role = dbUser?.role || getRoleFromRUData(normalizedEmail) || resolveAdminExceptionRole(normalizedEmail) || 'GUEST';

    return {
        user: {
            id: dbUser?._id?.toString() || userId,
            name: displayName,
            email: normalizedEmail,
            role,
            clubId: dbUser?.clubId?._id?.toString() || null,
            clubName: dbUser?.clubId?.name || null,
            clanId: dbUser?.clanId?._id?.toString() || null,
            clanName: dbUser?.clanId?.name || null,
        },
    };
}