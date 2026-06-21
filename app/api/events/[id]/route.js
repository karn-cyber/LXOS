import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Room from '@/models/Room';
import { auth } from '@/lib/api-auth';
import { normalizeRoomIds, findRoomConflicts } from '@/lib/event-rooms';

export async function GET(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const event = await Event.findById(id)
            .populate('clubId', 'name category budgetAllocated')
            .populate('clanId', 'name color points')
            .populate('roomId', 'name type capacity location facilities')
            .populate('roomIds', 'name type capacity location facilities')
            .populate('createdBy', 'name email role')
            .populate('approvedBy', 'name email')
            .lean();

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...event,
            _id: event._id.toString(),
        });
    } catch (error) {
        console.error('Event fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Permission check
        const canEdit = session.user.role === 'ADMIN' ||
            session.user.role === 'LX_TEAM' ||
            event.createdBy.toString() === session.user.id;

        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        ).populate('clubId', 'name category')
         .populate('clanId', 'name color')
         .populate('roomId', 'name type capacity location')
         .populate('createdBy', 'name email role');

        return NextResponse.json({
            message: 'Event updated successfully',
            event: {
                ...updatedEvent.toObject(),
                _id: updatedEvent._id.toString(),
            }
        });
    } catch (error) {
        console.error('Event update error:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
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
        const body = await request.json();

        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Permission check
        const canEdit = session.user.role === 'ADMIN' ||
            session.user.role === 'LX_TEAM' ||
            event.createdBy.toString() === session.user.id;

        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Can't edit approved events unless admin
        if (event.status === 'APPROVED' && session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Cannot edit approved events' }, { status: 403 });
        }

        // Update allowed fields
        const allowedUpdates = [
            'title', 'description', 'startDate', 'endDate',
            'budgetAllocated', 'attendees', 'requirements', 'location'
        ];

        allowedUpdates.forEach(field => {
            if (body[field] !== undefined) {
                event[field] = body[field];
            }
        });

        // Rooms can be sent as roomIds[] and/or legacy roomId.
        const roomsProvided = body.roomIds !== undefined || body.roomId !== undefined;
        const selectedRoomIds = roomsProvided ? normalizeRoomIds(body) : null;

        // Validate dates
        if (event.startDate >= event.endDate) {
            return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
        }

        // Check conflicts for the (new) set of rooms against everything else.
        if (selectedRoomIds && selectedRoomIds.length > 0) {
            const conflicts = await findRoomConflicts(selectedRoomIds, event.startDate, event.endDate, id);
            if (conflicts.length > 0) {
                const rooms = await Room.find({ _id: { $in: conflicts.map(c => c.roomId) } }).select('name').lean();
                const nameOf = (rid) => rooms.find(r => r._id.toString() === rid)?.name || 'Room';
                return NextResponse.json({
                    error: `These rooms are already booked for the selected time: ${conflicts.map(c => nameOf(c.roomId)).join(', ')}`,
                    conflicts,
                }, { status: 409 });
            }
        }

        if (selectedRoomIds) {
            event.roomIds = selectedRoomIds;
            event.roomId = selectedRoomIds[0] || null;
            if (selectedRoomIds.length > 0) event.location = '';
        }

        await event.save();

        const updatedEvent = await Event.findById(id)
            .populate('clubId', 'name category')
            .populate('clanId', 'name color')
            .populate('roomId', 'name type capacity')
            .populate('roomIds', 'name type capacity')
            .populate('createdBy', 'name email')
            .lean();

        return NextResponse.json({
            ...updatedEvent,
            _id: updatedEvent._id.toString(),
        });
    } catch (error) {
        console.error('Event update error:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // The creator of the event, ADMIN, or LX_TEAM may delete it.
        const canDelete = session.user.role === 'ADMIN' ||
            session.user.role === 'LX_TEAM' ||
            event.createdBy?.toString() === session.user.id;

        if (!canDelete) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Event.findByIdAndDelete(id);

        // Remove any linked approval request so it doesn't dangle in the queue.
        try {
            const { default: Approval } = await import('@/models/Approval');
            await Approval.deleteMany({ entityId: id, entityModel: 'Event' });
        } catch (cleanupErr) {
            console.warn('Could not clean up approval for deleted event:', cleanupErr.message);
        }

        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Event deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
