import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import { auth } from '@/auth';

export async function GET(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const club = await Club.findById(id).lean();

        if (!club) {
            return NextResponse.json({ error: 'Club not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...club,
            _id: club._id.toString(),
        });
    } catch (error) {
        console.error('Club fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
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
        const body = await request.json();

        const updatedClub = await Club.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedClub) {
            return NextResponse.json({ error: 'Club not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Club updated successfully',
            club: {
                ...updatedClub.toObject(),
                _id: updatedClub._id.toString(),
            }
        });
    } catch (error) {
        console.error('Club update error:', error);
        return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
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
        const body = await request.json();

        const club = await Club.findById(id);

        if (!club) {
            return NextResponse.json({ error: 'Club not found' }, { status: 404 });
        }

        // Update allowed fields
        const allowedUpdates = ['name', 'description', 'category', 'budgetAllocated', 'isActive'];

        allowedUpdates.forEach(field => {
            if (body[field] !== undefined) {
                club[field] = body[field];
            }
        });

        await club.save();

        return NextResponse.json({
            ...club.toObject(),
            _id: club._id.toString(),
        });
    } catch (error) {
        console.error('Club update error:', error);
        return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
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

        const club = await Club.findByIdAndDelete(id);

        if (!club) {
            return NextResponse.json({ error: 'Club not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Club deleted successfully' });
    } catch (error) {
        console.error('Club deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 });
    }
}
