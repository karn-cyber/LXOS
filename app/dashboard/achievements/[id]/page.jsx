import { redirect, notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getDashboardSession } from '@/lib/dashboard-session';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Users, Flag, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import ApprovalQuickActions from '@/components/approvals/approval-quick-actions';

const CATEGORY_COLORS = {
    Academic:  'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    Sports:    'text-green-600 bg-green-50 dark:bg-green-950/30',
    Cultural:  'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    Technical: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30',
    Social:    'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
    Other:     'text-zinc-500 bg-zinc-50 dark:bg-zinc-800',
};

const STATUS_STYLES = {
    APPROVED: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    PENDING:  'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
    REJECTED: 'text-red-500 bg-red-50 dark:bg-red-950/30',
};

async function AchievementDetail({ id }) {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    await dbConnect();
    const item = await Achievement.findById(id)
        .populate('clubId', 'name category')
        .populate('clanId', 'name color')
        .populate('createdBy', 'name email')
        .populate('approvedBy', 'name email')
        .lean();

    if (!item) notFound();

    const data = JSON.parse(JSON.stringify(item));
    const isReviewer = ['ADMIN', 'LX_TEAM'].includes(session.user.role);
    const catStyle = CATEGORY_COLORS[data.category] || CATEGORY_COLORS.Other;
    const StatusIcon = data.status === 'APPROVED' ? CheckCircle : data.status === 'REJECTED' ? XCircle : Clock;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Link href="/dashboard/achievements">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-600">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="font-display text-xl sm:text-2xl italic text-zinc-900 dark:text-zinc-100 min-w-0 break-words">{data.title}</h1>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                {data.images?.length > 0 && (
                    <div className="bg-zinc-950 flex flex-col items-center">
                        {data.images.map((src, i) => (
                            <img key={i} src={src} alt={`${data.title} ${i + 1}`} className="w-full max-h-[70vh] object-contain" />
                        ))}
                    </div>
                )}
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${catStyle}`}>{data.category}</span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_STYLES[data.status] || ''}`}>
                            <StatusIcon className="h-3 w-3" /> {data.status.toLowerCase()}
                        </span>
                        {data.clubId && (
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1"><Users className="h-3 w-3" />{data.clubId.name}</span>
                        )}
                        {data.clanId && (
                            <span className="text-[11px] text-zinc-500 flex items-center gap-1"><Flag className="h-3 w-3" />{data.clanId.name}</span>
                        )}
                        {data.points > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />{data.points} pts
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                        {data.achievedDate && (
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                                {new Date(data.achievedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        )}
                        {data.createdBy?.name && <span>· by {data.createdBy.name}</span>}
                    </div>

                    <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{data.description}</p>

                    {data.participants?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs font-medium text-zinc-500 mb-2">Participants</p>
                            <div className="flex flex-wrap gap-1.5">
                                {data.participants.map((p, i) => (
                                    <span key={i} className="text-[11px] bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded">{p}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.status === 'REJECTED' && data.rejectionReason && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/20 rounded-lg">
                            <p className="text-xs font-medium text-red-600 mb-0.5">Rejection reason</p>
                            <p className="text-sm text-red-700 dark:text-red-400">{data.rejectionReason}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Approve / Reject for reviewers when pending */}
            {isReviewer && data.status === 'PENDING' && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Pending approval</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Approve to publish it to the feed{data.clanId && data.points > 0 ? ' and award clan points' : ''}.</p>
                    </div>
                    <ApprovalQuickActions entityId={data._id} kind="achievement" />
                </div>
            )}
        </div>
    );
}

export default async function AchievementDetailPage({ params }) {
    const { id } = await params;
    return (
        <Suspense fallback={<div className="max-w-2xl mx-auto h-48 bg-zinc-50 dark:bg-zinc-900 rounded-xl animate-pulse" />}>
            <AchievementDetail id={id} />
        </Suspense>
    );
}
