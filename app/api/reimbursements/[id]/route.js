import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Reimbursement from '@/models/Reimbursement';
import { getDashboardSession } from '@/lib/dashboard-session';

const REVIEWER_ROLES = ['ADMIN', 'FINANCE', 'LX_TEAM'];

async function getAuthContext() {
    try {
        const session = await getDashboardSession();
        if (session?.user?.id) {
            return { userId: session.user.id, role: session.user.role || 'GUEST' };
        }
    } catch {
        // MongoDB unavailable — fall back to Clerk-only
    }
    try {
        const { userId } = await auth();
        if (userId) return { userId, role: 'GUEST' };
    } catch {
        // ignore
    }
    return { userId: null, role: null };
}

export async function GET(request, { params }) {
    try {
        const { userId, role } = await getAuthContext();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        const item = await Reimbursement.findById(id)
            .populate('submittedBy', 'name email')
            .populate('reviewedBy', 'name email')
            .lean();

        if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const isOwner = item.submittedBy?._id?.toString() === userId;
        const isReviewer = REVIEWER_ROLES.includes(role);

        if (!isOwner && !isReviewer) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(JSON.parse(JSON.stringify(item)));
    } catch (error) {
        console.error('Reimbursement GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { userId, role } = await getAuthContext();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        const item = await Reimbursement.findById(id);
        if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const isOwner = item.submittedBy?.toString() === userId;
        const isReviewer = REVIEWER_ROLES.includes(role);

        if (body.status && !isReviewer) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (!isOwner && !isReviewer) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (body.status && isReviewer) {
            item.status = body.status;
            item.reviewedBy = userId;
            item.reviewedAt = new Date();
            if (body.status === 'REJECTED') item.rejectionReason = body.rejectionReason || null;
            if (body.notes) item.notes = body.notes;
        } else if (isOwner && item.status === 'PENDING') {
            if (body.title) item.title = body.title;
            if (body.description !== undefined) item.description = body.description;
            if (body.amount) item.amount = Number(body.amount);
            if (body.expenseDate) item.expenseDate = new Date(body.expenseDate);
            if (body.category) item.category = body.category;
        }

        await item.save();

        const updated = await Reimbursement.findById(id)
            .populate('submittedBy', 'name email')
            .populate('reviewedBy', 'name')
            .lean();

        return NextResponse.json(JSON.parse(JSON.stringify(updated)));
    } catch (error) {
        console.error('Reimbursement PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
