import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Room from '@/models/Room';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import { auth } from '@/lib/api-auth';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const events = await Event.find({ status: { $in: ['APPROVED', 'PENDING'] } })
            .populate('clubId', 'name')
            .populate('clanId', 'name')
            .populate('roomId', 'name')
            .populate('roomIds', 'name')
            .lean();

        const formattedEvents = events.map(event => ({
            _id: event._id.toString(),
            title: event.title,
            description: event.description,
            type: event.type,
            startDate: event.startDate,
            endDate: event.endDate,
            status: event.status,
            budgetAllocated: event.budgetAllocated,
            location: event.location || '',
            clubId: event.clubId ? { _id: event.clubId._id.toString(), name: event.clubId.name } : null,
            clanId: event.clanId ? { _id: event.clanId._id.toString(), name: event.clanId.name } : null,
            roomId: event.roomId ? { _id: event.roomId._id.toString(), name: event.roomId.name } : null,
            roomIds: Array.isArray(event.roomIds)
                ? event.roomIds.map(r => ({ _id: r._id.toString(), name: r.name }))
                : [],
        }));

        return NextResponse.json(formattedEvents);
    } catch (error) {
        console.error('Calendar API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
