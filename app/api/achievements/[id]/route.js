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

        const isAdmin = session.user.role === 'ADMIN';
        const isOwner = achievement.createdBy?.toString() === session.user.id;

        if (!isAdmin && !isOwner && achievement.status !== 'APPROVED') {
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

        const existingAchievement = await Achievement.findById(id);
        if (!existingAchievement) {
            return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
        }

        const isAdmin = userRole === 'ADMIN';
        const isOwner = existingAchievement.createdBy?.toString() === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updatePayload = { ...body };

        if (!isAdmin) {
            updatePayload.status = 'PENDING';
            updatePayload.approvedBy = null;
            updatePayload.approvedAt = null;
            updatePayload.rejectionReason = null;
        }

        const updatedAchievement = await Achievement.findByIdAndUpdate(
            id,
            { $set: updatePayload },
            { new: true, runValidators: true }
        );

        if (!updatedAchievement) {
            return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
        }

        if (!isAdmin) {
            const { default: Approval } = await import('@/models/Approval');
            await Approval.findOneAndUpdate(
                { entityId: id, entityModel: 'Achievement' },
                {
                    type: 'ACHIEVEMENT',
                    requestedBy: session.user.id,
                    status: 'PENDING',
                    approvedBy: null,
                    rejectedBy: null,
                    approvedAt: null,
                    rejectedAt: null,
                    rejectionReason: null,
                    priority: (updatePayload.points || existingAchievement.points || 0) > 0 ? 'HIGH' : 'MEDIUM',
                },
                { upsert: true }
            );
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

        const { default: Approval } = await import('@/models/Approval');
        await Approval.deleteMany({ entityId: id, entityModel: 'Achievement' });

        return NextResponse.json({ message: 'Achievement deleted successfully' });
    } catch (error) {
        console.error('Achievement deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
    }
}
