import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Event from '@/models/Event';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const eventId = searchParams.get('eventId');

        const filter = {};
        if (status) filter.status = status;
        if (eventId) filter.eventId = eventId;

        // Club heads can only see their own expenses
        if (session.user.role === 'CLUB_HEAD') {
            filter.submittedBy = session.user.id;
        }

        const expenses = await Expense.find(filter)
            .sort({ createdAt: -1 })
            .populate('eventId', 'title type')
            .populate('submittedBy', 'name email')
            .populate('verifiedBy', 'name email')
            .lean();

        const formattedExpenses = expenses.map(expense => ({
            ...expense,
            _id: expense._id.toString(),
        }));

        return NextResponse.json(formattedExpenses);
    } catch (error) {
        console.error('Expenses API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only admin, LX team, and club heads can create expenses
        if (!['ADMIN', 'LX_TEAM', 'CLUB_HEAD'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();

        const body = await request.json();
        const { eventId, title, description, amount, category, paidDate } = body;

        if (!eventId || !title || !amount || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const expense = await Expense.create({
            eventId,
            title,
            description: description || '',
            amount,
            category,
            paidDate: paidDate ? new Date(paidDate) : null,
            submittedBy: session.user.id,
            status: 'PENDING',
        });

        // Create approval request
        const { default: Approval } = await import('@/models/Approval');
        await Approval.create({
            type: 'EXPENSE',
            entityId: expense._id,
            entityModel: 'Expense',
            requestedBy: session.user.id,
            status: 'PENDING',
            priority: amount > 50000 ? 'HIGH' : 'MEDIUM', // High priority for large expenses
        });

        const populatedExpense = await Expense.findById(expense._id)
            .populate('eventId', 'title type')
            .populate('submittedBy', 'name email')
            .lean();

        return NextResponse.json({
            ...populatedExpense,
            _id: populatedExpense._id.toString(),
        }, { status: 201 });
    } catch (error) {
        console.error('Expense creation error:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}
