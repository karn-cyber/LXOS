import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Achievement from '@/models/Achievement';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Trophy, Star } from 'lucide-react';
import { getDashboardSession } from '@/lib/dashboard-session';

async function getAchievements(session) {
    await dbConnect();
    const filter = session?.user?.role === 'ADMIN' ? {} : { status: 'APPROVED' };
    const items = await Achievement.find(filter)
        .sort({ achievedDate: -1 })
        .populate('clubId', 'name')
        .populate('clanId', 'name')
        .lean();
    return JSON.parse(JSON.stringify(items));
}

function AchievementsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-36 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="grid gap-3 md:grid-cols-2">
                {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

const CATEGORY_COLORS = {
    Academic:  'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    Sports:    'text-green-600 bg-green-50 dark:bg-green-950/30',
    Cultural:  'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    Technical: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30',
    Social:    'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
    Other:     'text-zinc-500 bg-zinc-50 dark:bg-zinc-800',
};

async function AchievementsContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    const items = await getAchievements(session);
    // GUEST (General Access) and others with CREATE_ACHIEVEMENT can submit
    const canCreate = ['ADMIN', 'LX_TEAM', 'CLUB_HEAD', 'CLAN_HEAD', 'GUEST'].includes(session.user.role);
    const canEdit = ['ADMIN', 'LX_TEAM'].includes(session.user.role);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Achievements</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {items.filter(a => a.status === 'APPROVED').length} approved · {items.filter(a => a.status === 'PENDING').length} pending
                    </p>
                </div>
                {canCreate && (
                    <Link href="/dashboard/achievements/create">
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl font-medium flex items-center gap-1.5 h-9">
                            <Plus className="h-3.5 w-3.5" />
                            Submit
                        </Button>
                    </Link>
                )}
            </div>

            {items.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No achievements recorded yet.
                    {canCreate && (
                        <Link href="/dashboard/achievements/create" className="block mt-2 text-primary text-xs hover:underline">
                            Submit the first achievement →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {items.map(a => {
                        const catStyle = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.Other;
                        return (
                            <div key={a._id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catStyle}`}>
                                                {a.category}
                                            </span>
                                            {a.status === 'PENDING' && (
                                                <span className="text-[10px] font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-0.5 rounded-full">
                                                    pending
                                                </span>
                                            )}
                                            {a.points > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                                                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                                    {a.points} pts
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{a.title}</h3>
                                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{a.description}</p>
                                    </div>
                                    <Trophy className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                                </div>

                                <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[11px] text-zinc-400">
                                        {a.clubId?.name || a.clanId?.name || '—'}
                                        {a.achievedDate && ` · ${new Date(a.achievedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                                    </div>
                                    {canEdit && (
                                        <Link href={`/dashboard/achievements/${a._id}/edit`} className="text-xs text-zinc-400 hover:text-primary transition-colors">
                                            Edit →
                                        </Link>
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

export default function AchievementsPage() {
    return (
        <Suspense fallback={<AchievementsSkeleton />}>
            <AchievementsContent />
        </Suspense>
    );
}
