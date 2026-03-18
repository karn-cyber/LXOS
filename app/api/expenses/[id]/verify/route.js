import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Event from '@/models/Event';
import { auth } from '@/auth';

export async function POST(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN and FINANCE can verify expenses
        if (session.user.role !== 'ADMIN' && session.user.role !== 'FINANCE') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();
        const { id } = params;
        const body = await request.json();
        const { action, rejectionReason } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const expense = await Expense.findById(id);

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        if (expense.status !== 'PENDING') {
            return NextResponse.json({ error: 'Expense is not pending verification' }, { status: 400 });
        }

        if (action === 'approve') {
            expense.status = 'APPROVED';
            expense.verifiedBy = session.user.id;
            expense.verifiedAt = new Date();

            // Update event budget spent
            const event = await Event.findById(expense.eventId);
            if (event) {
                event.budgetSpent += expense.amount;
                await event.save();
            }
        } else {
            expense.status = 'REJECTED';
            expense.rejectionReason = rejectionReason || 'No reason provided';
        }

        await expense.save();

        // Update unified approval record
        const { default: Approval } = await import('@/models/Approval');
        await Approval.findOneAndUpdate(
            { entityId: id, entityModel: 'Expense' },
            {
                status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                approvedBy: action === 'approve' ? session.user.id : null,
                rejectedBy: action === 'reject' ? session.user.id : null,
                approvedAt: action === 'approve' ? new Date() : null,
                rejectedAt: action === 'reject' ? new Date() : null,
                rejectionReason: action === 'reject' ? (rejectionReason || 'No reason provided') : null
            }
        );

        const updatedExpense = await Expense.findById(id)
            .populate('eventId', 'title type')
            .populate('submittedBy', 'name email')
            .populate('verifiedBy', 'name email')
            .lean();

        return NextResponse.json({
            ...updatedExpense,
            _id: updatedExpense._id.toString(),
        });
    } catch (error) {
        console.error('Expense verification error:', error);
        return NextResponse.json({ error: 'Failed to process verification' }, { status: 500 });
    }
}
