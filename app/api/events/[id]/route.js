import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Room from '@/models/Room';
import { auth } from '@/auth';

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
            'roomId', 'budgetAllocated', 'attendees', 'requirements'
        ];

        allowedUpdates.forEach(field => {
            if (body[field] !== undefined) {
                event[field] = body[field];
            }
        });

        // Validate dates
        if (event.startDate >= event.endDate) {
            return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
        }

        // Check room conflicts if room changed
        if (body.roomId && body.roomId !== event.roomId?.toString()) {
            const conflicts = await Event.find({
                _id: { $ne: id },
                roomId: body.roomId,
                status: { $in: ['APPROVED', 'PENDING'] },
                $or: [
                    {
                        startDate: { $lte: event.endDate },
                        endDate: { $gte: event.startDate },
                    },
                ],
            });

            if (conflicts.length > 0) {
                return NextResponse.json({
                    error: 'Room is not available for the selected time slot',
                    conflicts: conflicts.map(c => ({ title: c.title, startDate: c.startDate, endDate: c.endDate }))
                }, { status: 409 });
            }
        }

        await event.save();

        const updatedEvent = await Event.findById(id)
            .populate('clubId', 'name category')
            .populate('clanId', 'name color')
            .populate('roomId', 'name type capacity')
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

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        const event = await Event.findByIdAndDelete(id);

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Event deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
