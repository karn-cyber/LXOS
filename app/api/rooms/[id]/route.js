import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import { auth } from '@/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const room = await Room.findById(id).lean();

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...room,
            _id: room._id.toString(),
        });
    } catch (error) {
        console.error('Room fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = session.user.role;
        if (!hasPermission(userRole, PERMISSIONS.EDIT_ROOM)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        const updatedRoom = await Room.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedRoom) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Room updated successfully',
            room: {
                ...updatedRoom.toObject(),
                _id: updatedRoom._id.toString(),
            }
        });
    } catch (error) {
        console.error('Room update error:', error);
        return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = session.user.role;
        if (!hasPermission(userRole, PERMISSIONS.DELETE_ROOM)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        const room = await Room.findByIdAndDelete(id);

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Room deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}
