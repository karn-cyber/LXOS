import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
import { getDashboardSession } from '@/lib/dashboard-session';
import { Trophy, Star, Users, Flag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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

const CATEGORY_COLORS = {
    Academic:  'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    Sports:    'text-green-600 bg-green-50 dark:bg-green-950/30',
    Cultural:  'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    Technical: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30',
    Social:    'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
    Other:     'text-zinc-500 bg-zinc-50 dark:bg-zinc-800',
};

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
                <div className="max-w-3xl space-y-4">
                    {updates.map(update => {
                        const catStyle = CATEGORY_COLORS[update.category] || CATEGORY_COLORS.Other;
                        return (
                            <div key={update._id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                {update.images?.[0] && (
                                    <div className="relative w-full h-52 bg-zinc-100 dark:bg-zinc-800">
                                        <Image src={update.images[0]} alt={update.title} fill className="object-cover" />
                                    </div>
                                )}
                                <div className="p-5">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catStyle}`}>
                                            {update.category}
                                        </span>
                                        {update.clubId && (
                                            <Link href={`/dashboard/clubs/${update.clubId._id}`}>
                                                <span className="text-[10px] font-medium text-zinc-500 hover:text-primary flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {update.clubId.name}
                                                </span>
                                            </Link>
                                        )}
                                        {update.clanId && (
                                            <span className="text-[10px] font-medium text-zinc-500 flex items-center gap-1">
                                                <Flag className="h-3 w-3" />
                                                {update.clanId.name}
                                            </span>
                                        )}
                                        {update.points > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                {update.points} pts
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{update.title}</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{update.description}</p>

                                    <div className="flex items-center gap-2 mt-3 text-[11px] text-zinc-400">
                                        {update.achievedDate && (
                                            <span>{new Date(update.achievedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        )}
                                        {update.createdBy && (
                                            <>
                                                <span>·</span>
                                                <span>{update.createdBy.name}</span>
                                            </>
                                        )}
                                    </div>

                                    {update.participants?.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800 flex flex-wrap gap-1.5">
                                            {update.participants.map((p, i) => (
                                                <span key={i} className="text-[10px] bg-zinc-50 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
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
