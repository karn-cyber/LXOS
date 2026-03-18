import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Clan from '@/models/Clan';
import { auth } from '@/auth';

export async function GET(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        // Role-based access control
        if (session.user.role === 'CLAN_HEAD' && session.user.clanId !== id) {
            return NextResponse.json({ error: 'Forbidden - Access denied to this clan' }, { status: 403 });
        }

        const clan = await Clan.findById(id);

        if (!clan) {
            return NextResponse.json({ error: 'Clan not found' }, { status: 404 });
        }

        return NextResponse.json(clan);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        if (session.user.role !== 'ADMIN' &&
            !(session.user.role === 'CLAN_HEAD' && session.user.clanId === id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        const clan = await Clan.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!clan) {
            return NextResponse.json({ error: 'Clan not found' }, { status: 404 });
        }

        return NextResponse.json(clan);
    } catch (error) {
        console.error('Clan update error:', error);
        return NextResponse.json({ error: 'Failed to update clan' }, { status: 500 });
    }
}
