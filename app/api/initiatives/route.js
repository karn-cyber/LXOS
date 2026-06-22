import { NextResponse } from 'next/server';
import { auth } from '@/lib/api-auth';
import dbConnect from '@/lib/db';
import Initiative from '@/models/Initiative';

const STATUSES = ['PLANNING', 'ACTIVE', 'COMPLETED'];

export async function GET(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { searchParams } = new URL(request.url);
        const clanId = searchParams.get('clanId');
        const filter = {};
        if (clanId) filter.clanId = clanId;

        const items = await Initiative.find(filter)
            .sort({ date: -1 })
            .populate('createdBy', 'name')
            .populate('clanId', 'name color')
            .lean();
        return NextResponse.json(JSON.parse(JSON.stringify(items)));
    } catch (error) {
        console.error('Initiatives GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { role, id: userId, clanId: userClanId } = session.user;
        await dbConnect();
        const body = await request.json();
        const { title, description, clanId, semester, status, date } = body;

        if (!title?.trim() || !clanId) {
            return NextResponse.json({ error: 'Title and clan are required' }, { status: 400 });
        }

        // Admin/LX can post for any clan; a clan head only for their own clan.
        const allowed = ['ADMIN', 'LX_TEAM'].includes(role) || userClanId === clanId;
        if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const initiative = await Initiative.create({
            title: title.trim(),
            description: (description || '').trim(),
            clanId,
            semester: (semester || '').trim(),
            status: STATUSES.includes(status) ? status : 'ACTIVE',
            date: date ? new Date(date) : new Date(),
            createdBy: userId,
        });

        return NextResponse.json(JSON.parse(JSON.stringify(initiative)), { status: 201 });
    } catch (error) {
        console.error('Initiative POST error:', error);
        return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

        await dbConnect();
        const item = await Initiative.findById(id);
        if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const { role, clanId: userClanId } = session.user;
        const allowed = ['ADMIN', 'LX_TEAM'].includes(role) || userClanId === item.clanId?.toString();
        if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        await Initiative.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Initiative DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
