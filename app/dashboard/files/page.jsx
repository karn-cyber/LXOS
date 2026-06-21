import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getDashboardSession } from '@/lib/dashboard-session';
import dbConnect from '@/lib/db';
import Reimbursement from '@/models/Reimbursement';
// Referenced by populate() — keep their schemas registered on the lambda.
import Event from '@/models/Event';
import User from '@/models/User';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ReimbursementsView from '@/components/reimbursements/reimbursements-view';

const REVIEWER_ROLES = ['ADMIN', 'FINANCE', 'LX_TEAM'];

function formatAmount(n) {
    return `₹${Number(n).toLocaleString('en-IN')}`;
}

function ReimbursementsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-44 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
            <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

async function ReimbursementsContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    await dbConnect();

    const isReviewer = REVIEWER_ROLES.includes(session.user.role);
    const filter = isReviewer ? {} : { submittedBy: session.user.id };

    const items = await Reimbursement.find(filter)
        .select('-bills.path') // drop heavy base64 bill data — list only needs the count
        .sort({ createdAt: -1 })
        .populate('submittedBy', 'name email')
        .populate('reviewedBy', 'name')
        .populate('eventId', 'title type')
        .lean();

    const data = JSON.parse(JSON.stringify(items));

    const totals = data.reduce((acc, r) => {
        acc.total += r.amount;
        acc[r.status] = (acc[r.status] || 0) + 1;
        acc[r.status + '_amt'] = (acc[r.status + '_amt'] || 0) + r.amount;
        return acc;
    }, { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0, PROCESSED: 0 });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Reimbursements</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {isReviewer
                            ? `${data.length} total · ${totals.PENDING} pending review`
                            : `${data.length} submitted · ${totals.PENDING} pending`}
                    </p>
                </div>
                <Link href="/dashboard/files/upload">
                    <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl font-medium flex items-center gap-1.5 h-9">
                        <Plus className="h-3.5 w-3.5" />
                        Submit Request
                    </Button>
                </Link>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: 'Total submitted', value: data.length, sub: formatAmount(totals.total) },
                    { label: 'Pending review', value: totals.PENDING, sub: formatAmount(totals.PENDING_amt || 0) },
                    { label: 'Approved', value: totals.APPROVED, sub: formatAmount(totals.APPROVED_amt || 0) },
                    { label: 'Processed', value: totals.PROCESSED, sub: formatAmount(totals.PROCESSED_amt || 0) },
                    { label: 'Rejected', value: totals.REJECTED, sub: formatAmount(totals.REJECTED_amt || 0) },
                ].map(({ label, value, sub }) => (
                    <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                        <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
                        <div className="text-xs font-medium text-zinc-500 mt-1">{sub}</div>
                    </div>
                ))}
            </div>

            {/* List / CRM table */}
            {data.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No reimbursement requests yet.
                    <Link href="/dashboard/files/upload" className="block mt-2 text-primary text-xs hover:underline">
                        Submit your first request →
                    </Link>
                </div>
            ) : (
                <ReimbursementsView items={data} isReviewer={isReviewer} />
            )}
        </div>
    );
}

export default function ReimbursementsPage() {
    return (
        <Suspense fallback={<ReimbursementsSkeleton />}>
            <ReimbursementsContent />
        </Suspense>
    );
}
