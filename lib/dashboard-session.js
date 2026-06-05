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
    return null;
}

export async function getDashboardSession() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return null;
    }

    let email = sessionClaims?.email || sessionClaims?.email_address || '';
    let name = sessionClaims?.name || '';

    if (!email) {
        try {
            const client = await clerkClient();
            const user = await client.users.getUser(userId);
            const primaryEmail =
                user.emailAddresses.find((entry) => entry.id === user.primaryEmailAddressId) ||
                user.emailAddresses[0];

            email = primaryEmail?.emailAddress || '';
            name = name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '';
        } catch (error) {
            console.error('[dashboard-session] Clerk user lookup failed:', error);
        }
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
        return null;
    }

    await dbConnect();

    const user = await User.findOne({ email: normalizedEmail })
        .populate('clubId', 'name')
        .populate('clanId', 'name')
        .lean();

    const role = user?.role || getRoleFromRUData(normalizedEmail) || resolveAdminExceptionRole(normalizedEmail) || (lookupRUUser(normalizedEmail) ? 'GUEST' : 'GUEST');

    return {
        user: {
            id: user?._id?.toString() || userId,
            name: name || user?.name || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            role,
            clubId: user?.clubId?._id?.toString() || null,
            clubName: user?.clubId?.name || null,
            clanId: user?.clanId?._id?.toString() || null,
            clanName: user?.clanId?.name || null,
        },
    };
}