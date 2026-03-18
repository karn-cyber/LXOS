import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Room from '@/models/Room';
import { auth } from '@/auth';

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
            .populate('createdBy', 'name email')
            .lean();

        const formattedEvents = events.map(event => ({
            ...event,
            _id: event._id.toString(),
            clubId: event.clubId ? { ...event.clubId, _id: event.clubId._id.toString() } : null,
            clanId: event.clanId ? { ...event.clanId, _id: event.clanId._id.toString() } : null,
            roomId: event.roomId ? { ...event.roomId, _id: event.roomId._id.toString() } : null,
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

        // Check room availability if room is selected
        if (roomId) {
            const conflictingEvents = await Event.find({
                roomId,
                status: { $in: ['APPROVED', 'PENDING'] },
                $or: [
                    {
                        startDate: { $lte: new Date(endDate) },
                        endDate: { $gte: new Date(startDate) },
                    },
                ],
            });

            if (conflictingEvents.length > 0) {
                return NextResponse.json({
                    error: 'Room is not available for the selected time slot',
                    conflicts: conflictingEvents.map(e => ({
                        title: e.title,
                        startDate: e.startDate,
                        endDate: e.endDate,
                    })),
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
            roomId: roomId || null,
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
                type: roomId ? 'BOOKING' : 'EVENT', // If room is involved, treat as booking request + event
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
