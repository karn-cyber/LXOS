import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Room from '@/models/Room';
import { auth } from '@/lib/api-auth';
import { normalizeRoomIds, findRoomConflicts } from '@/lib/event-rooms';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const clubId = searchParams.get('clubId');

        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (clubId) filter.clubId = clubId;

        const events = await Event.find(filter)
            .sort({ startDate: -1 })
            .populate('clubId', 'name')
            .populate('clanId', 'name color')
            .populate('roomId', 'name')
            .populate('roomIds', 'name')
            .populate('createdBy', 'name email')
            .lean();

        const formattedEvents = events.map(event => ({
            ...event,
            _id: event._id.toString(),
            clubId: event.clubId ? { ...event.clubId, _id: event.clubId._id.toString() } : null,
            clanId: event.clanId ? { ...event.clanId, _id: event.clanId._id.toString() } : null,
            roomId: event.roomId ? { ...event.roomId, _id: event.roomId._id.toString() } : null,
            roomIds: Array.isArray(event.roomIds)
                ? event.roomIds.map(r => ({ ...r, _id: r._id.toString() }))
                : [],
            createdBy: event.createdBy ? { ...event.createdBy, _id: event.createdBy._id.toString() } : null,
        }));

        return NextResponse.json(formattedEvents);
    } catch (error) {
        console.error('Events API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await request.json();
        const {
            title,
            description,
            type,
            clubId,
            clanId,
            startDate,
            endDate,
            roomId,
            location,
            requirements,
            budgetAllocated,
            attendees,
        } = body;

        // Validation
        if (!title || !description || !type || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (new Date(endDate) < new Date(startDate)) {
            return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
        }

        if (type === 'CLUB' && !clubId) {
            return NextResponse.json({ error: 'Club ID required for club events' }, { status: 400 });
        }

        if (type === 'CLAN' && !clanId) {
            return NextResponse.json({ error: 'Clan ID required for clan events' }, { status: 400 });
        }

        // One or more rooms may be booked (e.g. a Fest needs several at once).
        const selectedRoomIds = normalizeRoomIds(body);

        // Every selected room must be free for the whole time window.
        if (selectedRoomIds.length > 0) {
            const conflicts = await findRoomConflicts(selectedRoomIds, startDate, endDate);

            if (conflicts.length > 0) {
                // Map ids -> names so the message is readable.
                const rooms = await Room.find({ _id: { $in: conflicts.map(c => c.roomId) } }).select('name').lean();
                const nameOf = (id) => rooms.find(r => r._id.toString() === id)?.name || 'Room';
                return NextResponse.json({
                    error: `These rooms are already booked for the selected time: ${conflicts.map(c => nameOf(c.roomId)).join(', ')}`,
                    conflicts,
                }, { status: 409 });
            }
        }

        const event = await Event.create({
            title,
            description,
            type,
            clubId: type === 'CLUB' ? clubId : undefined,
            clanId: type === 'CLAN' ? clanId : undefined,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            roomIds: selectedRoomIds,
            roomId: selectedRoomIds[0] || null,
            location: selectedRoomIds.length > 0 ? '' : (location || '').trim(),
            requirements: requirements || [],
            budgetAllocated: budgetAllocated || 0,
            attendees: attendees || 0,
            createdBy: session.user.id,
            status: session.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING',
        });

        // Create approval request if pending
        if (event.status === 'PENDING') {
            const { default: Approval } = await import('@/models/Approval');
            await Approval.create({
                type: selectedRoomIds.length > 0 ? 'BOOKING' : 'EVENT', // If rooms are involved, treat as booking request + event
                entityId: event._id,
                entityModel: 'Event',
                requestedBy: session.user.id,
                status: 'PENDING',
                priority: 'MEDIUM',
            });
        }

        const populatedEvent = await Event.findById(event._id)
            .populate('clubId', 'name')
            .populate('clanId', 'name color')
            .populate('roomId', 'name')
            .populate('roomIds', 'name')
            .populate('createdBy', 'name email')
            .lean();

        return NextResponse.json({
            ...populatedEvent,
            _id: populatedEvent._id.toString(),
        }, { status: 201 });
    } catch (error) {
        console.error('Event creation error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create event' }, { status: 500 });
    }
}
