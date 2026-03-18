import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import { auth } from '@/auth';

export async function POST(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN and LX_TEAM can approve
        if (session.user.role !== 'ADMIN' && session.user.role !== 'LX_TEAM') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { action, rejectionReason } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const event = await Event.findById(id);

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (event.status !== 'PENDING') {
            return NextResponse.json({ error: 'Event is not pending approval' }, { status: 400 });
        }

        if (action === 'approve') {
            // Calculate budget spent from requirements (safely)
            const requirements = event.requirements || [];
            const budgetSpent = requirements.reduce((sum, req) => {
                return sum + ((req.estimatedCost || 0) * (req.quantity || 1));
            }, 0);

            event.status = 'APPROVED';
            event.approvedBy = session.user.id;
            event.approvedAt = new Date();
            event.budgetSpent = budgetSpent;

            await event.save();

            // Update club budget spent if this is a club event
            if (event.clubId) {
                const Club = (await import('@/models/Club')).default;
                await Club.findByIdAndUpdate(event.clubId, {
                    $inc: { budgetSpent: budgetSpent }
                });
            }

            // Update clan budget spent if this is a clan event
            if (event.clanId) {
                const Clan = (await import('@/models/Clan')).default;
                await Clan.findByIdAndUpdate(event.clanId, {
                    $inc: { budgetSpent: budgetSpent }
                });
            }
        } else {
            event.status = 'REJECTED';
            event.rejectionReason = rejectionReason || 'No reason provided';
            await event.save();
        }

        // Update unified approval record
        const { default: Approval } = await import('@/models/Approval');
        await Approval.findOneAndUpdate(
            { entityId: id, entityModel: 'Event' },
            {
                status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                approvedBy: action === 'approve' ? session.user.id : null,
                rejectedBy: action === 'reject' ? session.user.id : null,
                approvedAt: action === 'approve' ? new Date() : null,
                rejectedAt: action === 'reject' ? new Date() : null,
                rejectionReason: action === 'reject' ? (rejectionReason || 'No reason provided') : null
            }
        );

        const updatedEvent = await Event.findById(id)
            .populate('clubId', 'name')
            .populate('clanId', 'name color')
            .populate('roomId', 'name')
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .lean();

        return NextResponse.json({
            ...updatedEvent,
            _id: updatedEvent._id.toString(),
        });
    } catch (error) {
        console.error('Event approval error:', error);
        return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
    }
}
