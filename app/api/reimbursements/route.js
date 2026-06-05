import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Reimbursement from '@/models/Reimbursement';
import Approval from '@/models/Approval';
import { getDashboardSession } from '@/lib/dashboard-session';

const REVIEWER_ROLES = ['ADMIN', 'FINANCE', 'LX_TEAM'];

// Get userId + optional role — never throws
async function getAuthContext() {
    try {
        const session = await getDashboardSession();
        if (session?.user?.id) {
            return { userId: session.user.id, role: session.user.role || 'GUEST' };
        }
    } catch {
        // MongoDB may be unavailable — fall back to Clerk-only auth
    }
    try {
        const { userId } = await auth();
        if (userId) return { userId, role: 'GUEST' };
    } catch {
        // ignore
    }
    return { userId: null, role: null };
}

export async function GET() {
    try {
        const { userId, role } = await getAuthContext();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const filter = REVIEWER_ROLES.includes(role) ? {} : { submittedBy: userId };
        const items = await Reimbursement.find(filter)
            .sort({ createdAt: -1 })
            .populate('submittedBy', 'name email')
            .populate('reviewedBy', 'name')
            .lean();

        return NextResponse.json(JSON.parse(JSON.stringify(items)));
    } catch (error) {
        console.error('Reimbursements GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId } = await getAuthContext();
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const body = await request.json();
        const { title, description, amount, expenseDate, category, bills } = body;

        if (!title || !amount || !expenseDate) {
            return NextResponse.json({ error: 'Title, amount, and expense date are required' }, { status: 400 });
        }

        const reimbursement = await Reimbursement.create({
            title,
            description: description || '',
            amount: Number(amount),
            expenseDate: new Date(expenseDate),
            category: category || 'Other',
            bills: bills || [],
            submittedBy: userId,
            status: 'PENDING',
        });

        // Create approval record — non-fatal if it fails
        try {
            await Approval.create({
                type: 'EXPENSE',
                entityId: reimbursement._id,
                entityModel: 'Reimbursement',
                requestedBy: userId,
                status: 'PENDING',
                priority: Number(amount) > 5000 ? 'HIGH' : 'MEDIUM',
            });
        } catch (approvalErr) {
            console.warn('Could not create approval record:', approvalErr.message);
        }

        return NextResponse.json(JSON.parse(JSON.stringify(reimbursement)), { status: 201 });
    } catch (error) {
        console.error('Reimbursement POST error:', error);
        return NextResponse.json({ error: error.message || 'Failed to submit reimbursement' }, { status: 500 });
    }
}
