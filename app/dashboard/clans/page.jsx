import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Clan from '@/models/Clan';
import Achievement from '@/models/Achievement';
import Event from '@/models/Event';
import { Button } from '@/components/ui/button';
import { Trophy, Plus, TrendingUp, TrendingDown, Minus, Crown, Flame, Star, Calendar } from 'lucide-react';
import Link from 'next/link';
import BudgetController from '@/components/admin/budget-controller';
import PointsManager from '@/components/clans/points-manager';
import { getDashboardSession } from '@/lib/dashboard-session';

// Permanent clan identity — colors are fixed per name
const CLAN_CONFIG = {
    Maratha: {
        dot:    'bg-red-800',
        bar:    'bg-red-700',
        text:   'text-red-800 dark:text-red-400',
        badge:  'text-red-700 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/20',
        tint:   'bg-red-50/60 dark:bg-red-950/10',
        border: 'border-red-100 dark:border-red-900/20',
    },
    Vijaya: {
        dot:    'bg-yellow-500',
        bar:    'bg-yellow-400',
        text:   'text-yellow-600 dark:text-yellow-400',
        badge:  'text-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900/20',
        tint:   'bg-yellow-50/60 dark:bg-yellow-950/10',
        border: 'border-yellow-100 dark:border-yellow-900/20',
    },
    Rajputana: {
        dot:    'bg-emerald-600',
        bar:    'bg-emerald-500',
        text:   'text-emerald-700 dark:text-emerald-400',
        badge:  'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/20',
        tint:   'bg-emerald-50/60 dark:bg-emerald-950/10',
        border: 'border-emerald-100 dark:border-emerald-900/20',
    },
    Chola: {
        dot:    'bg-blue-600',
        bar:    'bg-blue-500',
        text:   'text-blue-700 dark:text-blue-400',
        badge:  'text-blue-700 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/20',
        tint:   'bg-blue-50/60 dark:bg-blue-950/10',
        border: 'border-blue-100 dark:border-blue-900/20',
    },
};

const DEFAULT_CONFIG = {
    dot:    'bg-zinc-400',
    bar:    'bg-zinc-400',
    text:   'text-zinc-500',
    badge:  'text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700',
    tint:   'bg-zinc-50 dark:bg-zinc-900',
    border: 'border-zinc-100 dark:border-zinc-800',
};

async function getClanData() {
    try {
        await dbConnect();
        const clans = await Clan.find().sort({ points: -1 }).lean();
        const serialized = JSON.parse(JSON.stringify(clans));

        const [achievementCounts, eventCounts] = await Promise.all([
            Achievement.aggregate([
                { $match: { status: 'APPROVED', clanId: { $ne: null } } },
                { $group: { _id: '$clanId', count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
            ]),
            Event.aggregate([
                { $match: { clanId: { $ne: null }, status: 'APPROVED' } },
                { $group: { _id: '$clanId', count: { $sum: 1 } } },
            ]),
        ]);

        const achieveMap = Object.fromEntries(achievementCounts.map(a => [a._id.toString(), a]));
        const eventMap   = Object.fromEntries(eventCounts.map(e => [e._id.toString(), e]));

        return serialized.map(c => ({
            ...c,
            achievementCount: achieveMap[c._id]?.count || 0,
            achievementPoints: achieveMap[c._id]?.totalPoints || 0,
            eventCount: eventMap[c._id]?.count || 0,
        }));
    } catch (error) {
        console.warn('Database connection failed:', error.message);
        return [];
    }
}

function ClansSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-8 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
            <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="h-48 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

function PointDelta({ history }) {
    if (!history?.length) return null;
    const last = history[history.length - 1];
    const delta = last.points;
    if (delta === 0) return <Minus className="h-3 w-3 text-zinc-400" />;
    return delta > 0
        ? <span className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-medium"><TrendingUp className="h-3 w-3" />+{delta}</span>
        : <span className="flex items-center gap-0.5 text-red-500 text-[10px] font-medium"><TrendingDown className="h-3 w-3" />{delta}</span>;
}

async function ClansContent() {
    let session;
    try {
        session = await getDashboardSession();
    } catch (error) {
        console.warn('Auth failed:', error.message);
        session = null;
    }
    if (!session) redirect('/login');

    const clans = await getClanData();
    const isAdmin = session.user.role === 'ADMIN';
    const isClanHead = session.user.role === 'CLAN_HEAD';

    if (isClanHead && session.user.clanId) {
        redirect(`/dashboard/clans/${session.user.clanId}`);
    }

    const leader = clans[0];
    const totalPoints = clans.reduce((s, c) => s + (c.points || 0), 0);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Clans</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {clans.length} clans · {totalPoints.toLocaleString()} total points this semester
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/clans/create">
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl font-medium flex items-center gap-1.5 h-9">
                            <Plus className="h-3.5 w-3.5" />
                            New Clan
                        </Button>
                    </Link>
                )}
            </div>

            {/* Summary strip */}
            {clans.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {clans.map((clan, i) => {
                        const cfg = CLAN_CONFIG[clan.name] || DEFAULT_CONFIG;
                        const share = totalPoints > 0 ? ((clan.points / totalPoints) * 100).toFixed(1) : '0';
                        return (
                            <div key={clan._id} className={`rounded-xl p-4 border ${cfg.tint} ${cfg.border}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                                    {i === 0 && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                                </div>
                                <div className={`text-xl font-semibold ${cfg.text}`}>{(clan.points || 0).toLocaleString()}</div>
                                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">{clan.name}</div>
                                <div className="text-[10px] text-zinc-400 mt-0.5">{share}% of total</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Clan cards */}
            {clans.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No clans created yet.
                </div>
            ) : (
                <div className="space-y-4">
                    {clans.map((clan, index) => {
                        const cfg = CLAN_CONFIG[clan.name] || DEFAULT_CONFIG;
                        const budgetPct = clan.budgetAllocated > 0
                            ? Math.min((clan.budgetSpent / clan.budgetAllocated) * 100, 100)
                            : 0;
                        const pointsPct = leader?.points > 0
                            ? Math.min((clan.points / leader.points) * 100, 100)
                            : 0;
                        const budgetLeft = clan.budgetAllocated - (clan.budgetSpent || 0);
                        const recentHistory = (clan.pointHistory || []).slice(-3).reverse();

                        return (
                            <div key={clan._id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                {/* Clan header row */}
                                <div className={`px-5 py-4 flex items-start justify-between gap-4 ${index === 0 ? cfg.tint : ''}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative shrink-0">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm text-white ${cfg.dot}`}>
                                                #{index + 1}
                                            </div>
                                            {index === 0 && (
                                                <Crown className="h-3.5 w-3.5 text-yellow-400 absolute -top-1.5 -right-1.5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">{clan.name}</h3>
                                                {index === 0 && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 border border-yellow-100 dark:border-yellow-900/30">
                                                        Leading
                                                    </span>
                                                )}
                                                <PointDelta history={clan.pointHistory} />
                                            </div>
                                            {clan.description && (
                                                <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs">{clan.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${cfg.text}`}>{(clan.points || 0).toLocaleString()}</div>
                                            <div className="text-[10px] text-zinc-400 text-right">points</div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                            <Link href={`/dashboard/clans/${clan._id}`}>
                                                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg">Details</Button>
                                            </Link>
                                            {isAdmin && (
                                                <>
                                                    <PointsManager clan={clan} isAdmin={isAdmin} />
                                                    <BudgetController
                                                        entityId={clan._id}
                                                        entityType="CLAN"
                                                        currentBudget={clan.budgetAllocated || 0}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Insights row */}
                                <div className="px-5 pb-4 space-y-3 border-t border-zinc-50 dark:border-zinc-800">
                                    {/* Points progress vs leader */}
                                    <div className="pt-3 space-y-1.5">
                                        <div className="flex justify-between text-[11px] text-zinc-400">
                                            <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> Points vs leader</span>
                                            <span>{pointsPct.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pointsPct}%` }} />
                                        </div>
                                    </div>

                                    {/* Budget */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[11px] text-zinc-400">
                                            <span>Budget utilisation</span>
                                            <span className={budgetLeft < 0 ? 'text-red-400' : ''}>
                                                ₹{Math.max(0, budgetLeft).toLocaleString()} remaining · {budgetPct.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${budgetPct > 90 ? 'bg-red-400' : budgetPct > 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                                                style={{ width: `${budgetPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats pills */}
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <span className="flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-zinc-700">
                                            <Star className="h-3 w-3 text-yellow-400" />
                                            {clan.achievementCount} achievement{clan.achievementCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-zinc-700">
                                            <Calendar className="h-3 w-3 text-zinc-400" />
                                            {clan.eventCount} event{clan.eventCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-zinc-700">
                                            <Flame className="h-3 w-3 text-orange-400" />
                                            {clan.achievementPoints} pts from achievements
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-100 dark:border-zinc-700">
                                            ₹{(clan.budgetAllocated || 0).toLocaleString()} allocated
                                        </span>
                                    </div>

                                    {/* Recent point history */}
                                    {recentHistory.length > 0 && (
                                        <div className="pt-1">
                                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Recent activity</p>
                                            <div className="space-y-1">
                                                {recentHistory.map((h, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs">
                                                        <span className="text-zinc-500 truncate max-w-xs">{h.reason}</span>
                                                        <span className={`font-medium shrink-0 ml-2 ${h.points >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            {h.points >= 0 ? '+' : ''}{h.points} pts
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
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

export default function ClansPage() {
    return (
        <Suspense fallback={<ClansSkeleton />}>
            <ClansContent />
        </Suspense>
    );
}
