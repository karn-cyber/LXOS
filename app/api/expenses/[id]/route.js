import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Event from '@/models/Event';
import { auth } from '@/auth';

export async function GET(request, { params }) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const expense = await Expense.findById(id)
            .populate('eventId', 'title type budgetAllocated budgetSpent')
            .populate('submittedBy', 'name email role')
            .populate('verifiedBy', 'name email')
            .lean();

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({
            ...expense,
            _id: expense._id.toString(),
        });
    } catch (error) {
        console.error('Expense fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

        const expense = await Expense.findById(id);

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // Permission check
        const canEdit = session.user.role === 'ADMIN' ||
            expense.submittedBy.toString() === session.user.id;

        if (!canEdit) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update allowed fields
        const allowedUpdates = ['title', 'description', 'amount', 'category', 'paidDate'];

        allowedUpdates.forEach(field => {
            if (body[field] !== undefined) {
                expense[field] = body[field];
            }
        });

        await expense.save();

        const updatedExpense = await Expense.findById(id)
            .populate('eventId', 'title type')
            .populate('submittedBy', 'name email')
            .lean();

        return NextResponse.json({
            ...updatedExpense,
            _id: updatedExpense._id.toString(),
        });
    } catch (error) {
        console.error('Expense update error:', error);
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
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

        const expense = await Expense.findByIdAndDelete(id);

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Expense deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}
