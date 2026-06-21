import { redirect, notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getDashboardSession } from '@/lib/dashboard-session';
import dbConnect from '@/lib/db';
import Reimbursement from '@/models/Reimbursement';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImageIcon, Calendar, User, FileText, Landmark, CalendarDays, CheckCircle2, Clock, Banknote, XCircle } from 'lucide-react';
import ReimbursementReview from '@/components/reimbursements/reimbursement-review';

const REVIEWER_ROLES = ['ADMIN', 'FINANCE', 'LX_TEAM'];

const STATUS_STYLES = {
    APPROVED:  'text-green-600 bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900/20',
    PENDING:   'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/20',
    REJECTED:  'text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/20',
    PROCESSED: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/20',
};

// Amazon-style horizontal progress: Raised -> LX Approved -> Finance Processed.
function StatusTracker({ data }) {
    const rejected = data.status === 'REJECTED';
    const approved = ['APPROVED', 'PROCESSED'].includes(data.status);
    const processed = data.status === 'PROCESSED';

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;

    if (rejected) {
        return (
            <div className="bg-white dark:bg-zinc-900 border border-red-100 dark:border-red-900/30 rounded-xl p-5">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                        <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-red-600">Rejected</p>
                        <p className="text-xs text-zinc-400">This claim was rejected and will not be paid out.</p>
                    </div>
                </div>
            </div>
        );
    }

    const steps = [
        { label: 'Raised', icon: FileText, done: true, sub: fmt(data.createdAt) },
        { label: 'LX Approved', icon: CheckCircle2, done: approved, sub: approved ? (fmt(data.reviewedAt) || 'done') : 'pending' },
        { label: 'Finance Processed', icon: Banknote, done: processed, sub: processed ? (fmt(data.processedAt) || 'done') : 'pending' },
    ];

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
            <div className="flex items-center">
                {steps.map((s, i) => {
                    const Icon = s.done ? s.icon : Clock;
                    return (
                        <div key={s.label} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center text-center">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${s.done ? 'bg-green-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <p className={`text-[11px] font-medium mt-1.5 ${s.done ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>{s.label}</p>
                                <p className="text-[10px] text-zinc-400">{s.sub}</p>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`h-0.5 flex-1 mx-2 ${steps[i + 1].done ? 'bg-green-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DetailSkeleton() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
            <div className="h-8 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="h-48 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />
        </div>
    );
}

async function ReimbursementDetail({ id }) {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    await dbConnect();
    const item = await Reimbursement.findById(id)
        .populate('submittedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .populate('processedBy', 'name email')
        .lean();

    if (!item) notFound();

    const isOwner = item.submittedBy?._id?.toString() === session.user.id;
    const isReviewer = REVIEWER_ROLES.includes(session.user.role);

    if (!isOwner && !isReviewer) redirect('/dashboard');

    const data = JSON.parse(JSON.stringify(item));
    const groupLabel = data.eventId?.title || data.purpose || '';
    const bank = data.bankDetails || {};
    const hasBank = bank.accountHolderName || bank.accountNumber || bank.ifsc;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard/files">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-600">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-display text-2xl italic text-zinc-900 dark:text-zinc-100">{data.title}</h1>
                    <p className="text-sm text-zinc-400 mt-0.5">Reimbursement request</p>
                </div>
            </div>

            {/* Status + Amount card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                            ₹{Number(data.amount).toLocaleString('en-IN')}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[data.status]}`}>
                                {data.status.toLowerCase()}
                            </span>
                            <span className="text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                                {data.category}
                            </span>
                            {groupLabel && (
                                <span className="text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    {groupLabel}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-left sm:text-right text-xs text-zinc-400 space-y-1 shrink-0">
                        <div className="flex items-center gap-1.5 sm:justify-end">
                            <Calendar className="h-3.5 w-3.5" />
                            Expense: {new Date(data.expenseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1.5 sm:justify-end">
                            <FileText className="h-3.5 w-3.5" />
                            Submitted: {new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {isReviewer && (
                            <div className="flex items-center gap-1.5 sm:justify-end">
                                <User className="h-3.5 w-3.5" />
                                {data.submittedBy?.name || data.submittedBy?.email}
                            </div>
                        )}
                    </div>
                </div>

                {data.description && (
                    <p className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {data.description}
                    </p>
                )}

                {data.status === 'REJECTED' && data.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 rounded-lg">
                        <p className="text-xs font-medium text-red-600 mb-0.5">Rejection reason</p>
                        <p className="text-sm text-red-700 dark:text-red-400">{data.rejectionReason}</p>
                    </div>
                )}

                {data.notes && data.status === 'APPROVED' && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/20 rounded-lg">
                        <p className="text-xs font-medium text-green-600 mb-0.5">Reviewer notes</p>
                        <p className="text-sm text-green-700 dark:text-green-400">{data.notes}</p>
                    </div>
                )}

                {data.reviewedBy && data.reviewedAt && (
                    <p className="text-[11px] text-zinc-400 mt-3">
                        {data.status === 'REJECTED' ? 'Rejected' : 'Approved'} by {data.reviewedBy.name} on {new Date(data.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                )}
                {data.processedBy && data.processedAt && (
                    <p className="text-[11px] text-blue-500 mt-1">
                        Marked processed by {data.processedBy.name} on {new Date(data.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                )}
            </div>

            {/* Amazon-style progress tracker */}
            <StatusTracker data={data} />

            {/* Bank details — visible to the owner and to reviewers/finance */}
            {hasBank && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
                    <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2 mb-3">
                        <Landmark className="h-4 w-4 text-zinc-400" />
                        Payout Account
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                            <p className="text-[11px] text-zinc-400">Account Holder</p>
                            <p className="font-medium text-zinc-800 dark:text-zinc-200">{bank.accountHolderName || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-zinc-400">Account Number</p>
                            <p className="font-medium text-zinc-800 dark:text-zinc-200 font-mono">{bank.accountNumber || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-zinc-400">IFSC</p>
                            <p className="font-medium text-zinc-800 dark:text-zinc-200 font-mono">{bank.ifsc || '—'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bill images */}
            {data.bills?.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-zinc-400" />
                        Bills ({data.bills.length})
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {data.bills.map((bill, i) => (
                            <a key={i} href={bill.path} target="_blank" rel="noopener noreferrer">
                                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-300 transition-colors">
                                    {bill.mimeType?.startsWith('image/') ? (
                                        <img
                                            src={bill.path}
                                            alt={bill.originalName}
                                            className="w-full h-36 object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-36 flex items-center justify-center">
                                            <FileText className="h-8 w-8 text-zinc-300" />
                                        </div>
                                    )}
                                    <div className="p-2">
                                        <p className="text-[10px] text-zinc-500 truncate">{bill.originalName}</p>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Review / process actions — the component decides what to show
                based on the viewer's role and the current status. */}
            {isReviewer && (data.status === 'PENDING' || data.status === 'APPROVED') && (
                <ReimbursementReview id={data._id} role={session.user.role} status={data.status} />
            )}
        </div>
    );
}

export default async function ReimbursementDetailPage({ params }) {
    const { id } = await params;
    return (
        <Suspense fallback={<DetailSkeleton />}>
            <ReimbursementDetail id={id} />
        </Suspense>
    );
}
