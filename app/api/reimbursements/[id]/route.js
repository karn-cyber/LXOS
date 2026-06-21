import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Reimbursement from '@/models/Reimbursement';
// Referenced by populate('eventId'/'processedBy') — register their schemas.
import Event from '@/models/Event';
import User from '@/models/User';
import { getDashboardSession } from '@/lib/dashboard-session';

const REVIEWER_ROLES = ['ADMIN', 'FINANCE', 'LX_TEAM'];
// LX / Admin decide whether a claim is legitimate.
const APPROVER_ROLES = ['ADMIN', 'LX_TEAM'];
// Finance / Admin release the payment after approval.
const FINANCE_ROLES = ['ADMIN', 'FINANCE'];

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
            .populate('processedBy', 'name email')
            .populate('eventId', 'title type')
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

        if (body.status) {
            // Status changes follow a strict, role-gated workflow.
            const target = body.status;

            if (target === 'APPROVED' || target === 'REJECTED') {
                if (!APPROVER_ROLES.includes(role)) {
                    return NextResponse.json({ error: 'Only LX / Admin can approve or reject' }, { status: 403 });
                }
                if (item.status !== 'PENDING') {
                    return NextResponse.json({ error: `Cannot ${target.toLowerCase()} a request that is already ${item.status.toLowerCase()}` }, { status: 400 });
                }
                item.status = target;
                item.reviewedBy = userId;
                item.reviewedAt = new Date();
                if (target === 'REJECTED') item.rejectionReason = body.rejectionReason || null;
                if (body.notes) item.notes = body.notes;
            } else if (target === 'PROCESSED') {
                if (!FINANCE_ROLES.includes(role)) {
                    return NextResponse.json({ error: 'Only Finance / Admin can mark a claim processed' }, { status: 403 });
                }
                if (item.status !== 'APPROVED') {
                    return NextResponse.json({ error: 'Only approved claims can be marked processed' }, { status: 400 });
                }
                item.status = 'PROCESSED';
                item.processedBy = userId;
                item.processedAt = new Date();
                if (body.notes) item.notes = body.notes;
            } else {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
        } else {
            // Field edits — only the owner, and only while still pending.
            if (!isOwner && !isReviewer) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            if (isOwner && item.status === 'PENDING') {
                if (body.title) item.title = body.title;
                if (body.description !== undefined) item.description = body.description;
                if (body.amount) item.amount = Number(body.amount);
                if (body.expenseDate) item.expenseDate = new Date(body.expenseDate);
                if (body.category) item.category = body.category;
                if (body.purpose !== undefined) item.purpose = body.purpose;
                if (body.bankDetails) {
                    item.bankDetails = {
                        accountHolderName: (body.bankDetails.accountHolderName || '').trim(),
                        accountNumber: (body.bankDetails.accountNumber || '').trim(),
                        ifsc: (body.bankDetails.ifsc || '').trim().toUpperCase(),
                    };
                }
            }
        }

        await item.save();

        const updated = await Reimbursement.findById(id)
            .populate('submittedBy', 'name email')
            .populate('reviewedBy', 'name')
            .populate('processedBy', 'name')
            .populate('eventId', 'title type')
            .lean();

        return NextResponse.json(JSON.parse(JSON.stringify(updated)));
    } catch (error) {
        console.error('Reimbursement PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
