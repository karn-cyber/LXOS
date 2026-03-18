import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
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

        const achievement = await Achievement.findById(id).lean();

        if (!achievement) {
            return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...achievement,
            _id: achievement._id.toString(),
        });
    } catch (error) {
        console.error('Achievement fetch error:', error);
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
        if (!hasPermission(userRole, PERMISSIONS.CREATE_ACHIEVEMENT) && userRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        const updatedAchievement = await Achievement.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true, runValidators: true }
        );

        if (!updatedAchievement) {
            return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Achievement updated successfully',
            achievement: {
                ...updatedAchievement.toObject(),
                _id: updatedAchievement._id.toString(),
            }
        });
    } catch (error) {
        console.error('Achievement update error:', error);
        return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userRole = session.user.role;
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;

        const achievement = await Achievement.findByIdAndDelete(id);

        if (!achievement) {
            return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        console.error('Achievement deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
    }
}
