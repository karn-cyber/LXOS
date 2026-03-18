import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Room from '@/models/Room';
import { auth } from '@/auth';

export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const body = await request.json();
        const { roomId, startDate, endDate, excludeEventId } = body;

        if (!roomId || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if room exists
        const room = await Room.findById(roomId);
        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        if (!room.isAvailable) {
            return NextResponse.json({
                available: false,
                reason: 'Room is marked as unavailable',
            });
        }

        // Find conflicting events
        const filter = {
            roomId,
            status: { $in: ['APPROVED', 'PENDING'] },
            $or: [
                {
                    startDate: { $lte: new Date(endDate) },
                    endDate: { $gte: new Date(startDate) },
                },
            ],
        };

        // Exclude specific event if provided (for editing)
        if (excludeEventId) {
            filter._id = { $ne: excludeEventId };
        }

        const conflictingEvents = await Event.find(filter)
            .populate('clubId', 'name')
            .populate('clanId', 'name')
            .lean();

        if (conflictingEvents.length > 0) {
            return NextResponse.json({
                available: false,
                conflicts: conflictingEvents.map(event => ({
                    _id: event._id.toString(),
                    title: event.title,
                    type: event.type,
                    startDate: event.startDate,
                    endDate: event.endDate,
                    organization: event.clubId?.name || event.clanId?.name || 'LX Event',
                })),
            });
        }

        return NextResponse.json({
            available: true,
            room: {
                _id: room._id.toString(),
                name: room.name,
                type: room.type,
                capacity: room.capacity,
                location: room.location,
                facilities: room.facilities,
            },
        });
    } catch (error) {
        console.error('Room availability check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
