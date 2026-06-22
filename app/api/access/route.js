import { NextResponse } from 'next/server';
import { auth } from '@/lib/api-auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import { lookupRUUser } from '@/lib/ru-data-mapper';

const PROTECTED = ['ADMIN', 'FINANCE']; // never auto-downgraded by this UI

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim().replace(/\s+/g, '');
}

// Role derived from a user's remaining club/clan linkage (used after removals).
function roleFromLinkage(user) {
    if (PROTECTED.includes(user.role)) return user.role;
    if (user.clubId) return 'CLUB_HEAD';
    if (user.clanId) return 'CLAN_HEAD';
    return 'GUEST';
}

async function requireAdmin() {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return null;
    return session;
}

export async function GET() {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await dbConnect();

    const [clubs, clans, users] = await Promise.all([
        Club.find().select('name').sort({ name: 1 }).lean(),
        Clan.find().select('name color').sort({ name: 1 }).lean(),
        User.find({ $or: [{ clubId: { $ne: null } }, { clanId: { $ne: null } }, { role: 'LX_TEAM' }] })
            .select('name email role clubId clanId').lean(),
    ]);

    const heads = (list, key, id) =>
        users.filter(u => u[key]?.toString() === id.toString())
            .map(u => ({ _id: u._id.toString(), name: u.name, email: u.email }));

    return NextResponse.json({
        clubs: clubs.map(c => ({ _id: c._id.toString(), name: c.name, heads: heads(users, 'clubId', c._id) })),
        clans: clans.map(c => ({ _id: c._id.toString(), name: c.name, color: c.color, heads: heads(users, 'clanId', c._id) })),
        lxMembers: users.filter(u => u.role === 'LX_TEAM').map(u => ({ _id: u._id.toString(), name: u.name, email: u.email })),
    });
}

// Assign access: { email, type: 'club'|'clan'|'lx', clubId?, clanId?, name? }
export async function POST(request) {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await dbConnect();

    const body = await request.json();
    const email = normalizeEmail(body.email);
    const { type, clubId, clanId } = body;
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    let user = await User.findOne({ email });
    if (!user) {
        const ru = lookupRUUser(email);
        user = new User({ email, name: body.name || ru?.name || email.split('@')[0], role: 'GUEST', isActive: true });
    }

    if (type === 'club') {
        if (!clubId) return NextResponse.json({ error: 'clubId required' }, { status: 400 });
        user.clubId = clubId;
        if (!PROTECTED.includes(user.role) && user.role !== 'LX_TEAM') user.role = 'CLUB_HEAD';
    } else if (type === 'clan') {
        if (!clanId) return NextResponse.json({ error: 'clanId required' }, { status: 400 });
        user.clanId = clanId;
        if (!PROTECTED.includes(user.role) && user.role !== 'LX_TEAM' && user.role !== 'CLUB_HEAD') user.role = 'CLAN_HEAD';
    } else if (type === 'lx') {
        user.role = 'LX_TEAM'; // keeps any existing club/clan linkage
    } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await user.save();
    return NextResponse.json({ success: true });
}

// Remove access: { email, type: 'club'|'clan'|'lx' }
export async function DELETE(request) {
    if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    await dbConnect();

    const body = await request.json();
    const email = normalizeEmail(body.email);
    const { type } = body;

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (type === 'club') {
        user.clubId = null;
        user.role = roleFromLinkage(user);
    } else if (type === 'clan') {
        user.clanId = null;
        user.role = roleFromLinkage(user);
    } else if (type === 'lx') {
        if (user.role === 'LX_TEAM') user.role = roleFromLinkage({ ...user.toObject(), role: 'GUEST' });
    } else {
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await user.save();
    return NextResponse.json({ success: true });
}
