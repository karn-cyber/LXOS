import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Approval from '@/models/Approval';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDashboardSession } from '@/lib/dashboard-session';
import ApprovalQuickActions from '@/components/approvals/approval-quick-actions';

import '@/models/Event';
import '@/models/Expense';
import '@/models/Booking';
import '@/models/Club';
import '@/models/Clan';
import '@/models/Achievement';

async function getPendingApprovals() {
    await dbConnect();
    const approvals = await Approval.find({ status: 'PENDING' })
        .sort({ priority: -1, createdAt: 1 })
        .populate('requestedBy', 'name email')
        .populate('entityId')
        .lean();

    return approvals.map(a => ({
        ...a,
        _id: a._id.toString(),
        entity: a.entityId ? { ...a.entityId, _id: a.entityId._id?.toString() } : null,
        requestedBy: a.requestedBy ? { ...a.requestedBy, _id: a.requestedBy._id.toString() } : null,
    }));
}

function getReviewLink(approval) {
    const type = approval.entityModel || approval.type;
    if (!approval.entity?._id) return null;
    if (['Event', 'EVENT', 'BOOKING'].includes(type)) return `/dashboard/events/${approval.entity._id}`;
    if (['Reimbursement'].includes(type)) return `/dashboard/files/${approval.entity._id}`;
    if (['Expense', 'EXPENSE'].includes(type)) return `/dashboard/files/${approval.entity._id}`;
    if (['Achievement', 'ACHIEVEMENT'].includes(type)) return `/dashboard/achievements/${approval.entity._id}/edit`;
    return null;
}

// Event/booking approvals can be actioned inline; others open their detail page.
function isEventApproval(approval) {
    const type = approval.entityModel || approval.type;
    return ['Event', 'EVENT', 'BOOKING'].includes(type);
}

const PRIORITY_DOT = {
    URGENT: 'bg-red-500',
    HIGH:   'bg-orange-400',
    MEDIUM: 'bg-yellow-400',
    LOW:    'bg-green-400',
};

function ApprovalsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-36 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

async function ApprovalsContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');
    if (!['ADMIN', 'LX_TEAM', 'FINANCE'].includes(session.user.role)) redirect('/dashboard');

    const approvals = await getPendingApprovals();

    const filtered = approvals.filter(a => {
        if (session.user.role === 'ADMIN') return true;
        if (session.user.role === 'LX_TEAM') return a.type === 'EVENT' || a.type === 'BOOKING';
        if (session.user.role === 'FINANCE') return a.type === 'EXPENSE';
        return false;
    });

    const urgentCount = filtered.filter(a => ['HIGH', 'URGENT'].includes(a.priority)).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Approvals</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {filtered.length} pending
                        {urgentCount > 0 && (
                            <span className="ml-2 text-red-500 font-medium">· {urgentCount} urgent</span>
                        )}
                    </p>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    All caught up — no pending approvals.
                </div>
            ) : (
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-50 dark:divide-zinc-800">
                    {filtered.map((approval) => {
                        const reviewLink = getReviewLink(approval);
                        const isHighPriority = ['HIGH', 'URGENT'].includes(approval.priority);
                        return (
                            <div
                                key={approval._id}
                                className={`flex items-center gap-4 px-5 py-4 ${isHighPriority ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}
                            >
                                <div className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[approval.priority] || 'bg-zinc-300'}`} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-1.5 py-0.5 rounded">
                                            {approval.type}
                                        </span>
                                        {isHighPriority && (
                                            <span className="text-[10px] font-medium text-red-500">urgent</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                        {approval.entity?.title || `${approval.type} request`}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        By {approval.requestedBy?.name || '—'}
                                        {' · '}
                                        {new Date(approval.createdAt).toLocaleDateString()}
                                        {approval.entity?.amount && ` · ₹${approval.entity.amount.toLocaleString()}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {reviewLink && (
                                        <Link href={reviewLink}>
                                            <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs font-medium">
                                                Open
                                            </Button>
                                        </Link>
                                    )}
                                    {isEventApproval(approval) && approval.entity?._id ? (
                                        <ApprovalQuickActions entityId={approval.entity._id} />
                                    ) : (!reviewLink && (
                                        <Button size="sm" variant="outline" disabled className="rounded-lg h-8 text-xs">
                                            No link
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ApprovalsPage() {
    return (
        <Suspense fallback={<ApprovalsSkeleton />}>
            <ApprovalsContent />
        </Suspense>
    );
}
