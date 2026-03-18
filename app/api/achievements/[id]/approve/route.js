import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
import Clan from '@/models/Clan';
import { auth } from '@/auth';

export async function POST(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Only admins can approve updates' }, { status: 403 });
        }

        await dbConnect();

        const { id } = await params;
        const body = await request.json();
        const { action, rejectionReason } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const achievement = await Achievement.findById(id);

        if (!achievement) {
            return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
        }

        if (achievement.status !== 'PENDING') {
            return NextResponse.json({ error: 'Achievement is not pending approval' }, { status: 400 });
        }

        if (action === 'approve') {
            achievement.status = 'APPROVED';
            achievement.approvedBy = session.user.id;
            achievement.approvedAt = new Date();
            achievement.rejectionReason = null;
            await achievement.save();

            if (achievement.clanId && achievement.points > 0) {
                await Clan.findByIdAndUpdate(achievement.clanId, {
                    $inc: { points: achievement.points },
                });
            }
        } else {
            achievement.status = 'REJECTED';
            achievement.rejectionReason = rejectionReason || 'No reason provided';
            achievement.approvedBy = null;
            achievement.approvedAt = null;
            await achievement.save();
        }

        const { default: Approval } = await import('@/models/Approval');
        await Approval.findOneAndUpdate(
            { entityId: id, entityModel: 'Achievement' },
            {
                status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                approvedBy: action === 'approve' ? session.user.id : null,
                rejectedBy: action === 'reject' ? session.user.id : null,
                approvedAt: action === 'approve' ? new Date() : null,
                rejectedAt: action === 'reject' ? new Date() : null,
                rejectionReason: action === 'reject' ? (rejectionReason || 'No reason provided') : null,
            }
        );

        const updated = await Achievement.findById(id)
            .populate('clubId', 'name category')
            .populate('clanId', 'name color')
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .lean();

        return NextResponse.json({
            ...updated,
            _id: updated._id.toString(),
        });
    } catch (error) {
        console.error('Achievement approval error:', error);
        return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
    }
}
