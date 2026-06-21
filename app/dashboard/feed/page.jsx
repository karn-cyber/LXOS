import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
import { getDashboardSession } from '@/lib/dashboard-session';
import FeedList from '@/components/feed/feed-list';

async function getAllUpdates(session) {
    await dbConnect();
    const filter = session?.user?.role === 'ADMIN' ? {} : { status: 'APPROVED' };
    const updates = await Achievement.find(filter)
        .sort({ achievedDate: -1 })
        .limit(50)
        .populate('clubId', 'name category')
        .populate('clanId', 'name color')
        .populate('createdBy', 'name')
        .lean();
    return JSON.parse(JSON.stringify(updates));
}

function FeedSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="max-w-3xl space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-36 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

async function FeedContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    const updates = await getAllUpdates(session);
    const activeClubsCount = new Set(updates.filter(u => u.clubId).map(u => u.clubId._id)).size;
    const activeClansCount = new Set(updates.filter(u => u.clanId).map(u => u.clanId._id)).size;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Activity Feed</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {updates.length} update{updates.length !== 1 ? 's' : ''} · {activeClubsCount} clubs · {activeClansCount} clans
                    </p>
                </div>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total updates', value: updates.length },
                    { label: 'Active clubs', value: activeClubsCount },
                    { label: 'Active clans', value: activeClansCount },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
                    </div>
                ))}
            </div>

            {/* Feed */}
            {updates.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl max-w-3xl">
                    No achievements recorded yet.
                </div>
            ) : (
                <FeedList updates={updates} />
            )}
        </div>
    );
}

export default function FeedPage() {
    return (
        <Suspense fallback={<FeedSkeleton />}>
            <FeedContent />
        </Suspense>
    );
}
