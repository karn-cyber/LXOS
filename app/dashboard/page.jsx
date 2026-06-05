import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Approval from '@/models/Approval';
import ruDataRaw from '../../data/ru-data.json' with { type: 'json' };
import {
    CalendarDays, Users, Flag, TrendingUp, ArrowRight,
    CheckSquare, Clock, Trophy, Zap, BarChart2, FolderOpen,
} from 'lucide-react';
import Link from 'next/link';

async function getDashboardStats() {
    try {
        await dbConnect();
        const [totalEvents, totalClubs, totalClans, upcomingEvents, pendingApprovals] = await Promise.all([
            Event.countDocuments(),
            Club.countDocuments({ isActive: true }),
            Clan.countDocuments(),
            Event.countDocuments({ startDate: { $gte: new Date() }, status: 'APPROVED' }),
            Approval.countDocuments({ status: 'PENDING' }),
        ]);
        return { totalEvents, totalClubs, totalClans, upcomingEvents, pendingApprovals };
    } catch {
        return { totalEvents: 0, totalClubs: 0, totalClans: 0, upcomingEvents: 0, pendingApprovals: 0 };
    }
}

async function getRecentEvents() {
    try {
        await dbConnect();
        const events = await Event.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('clubId', 'name')
            .populate('clanId', 'name')
            .lean();
        return JSON.parse(JSON.stringify(events));
    } catch {
        return [];
    }
}

async function getNextEvent() {
    try {
        await dbConnect();
        const event = await Event.findOne({
            startDate: { $gte: new Date() },
            status: 'APPROVED',
        })
            .sort({ startDate: 1 })
            .populate('clubId', 'name')
            .lean();
        return event ? JSON.parse(JSON.stringify(event)) : null;
    } catch {
        return null;
    }
}

async function getUserType(email) {
    const ruData = Array.isArray(ruDataRaw) ? ruDataRaw : ruDataRaw?.data || [];
    const user = ruData.find(r => r?.email?.toLowerCase().trim() === email?.toLowerCase().trim());
    return user?.userType || null;
}

function getQuickActions(userType) {
    const defaults = [
        { label: 'Events', href: '/dashboard/events', icon: CalendarDays },
        { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
        { label: 'Calendar', href: '/dashboard/calendar', icon: CalendarDays },
    ];
    const roleActions = {
        ADMIN: [
            { label: 'Approvals', href: '/dashboard/approvals', icon: CheckSquare },
            { label: 'Budget', href: '/dashboard/budget', icon: BarChart2 },
            { label: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
            { label: 'Create Event', href: '/dashboard/events/create', icon: Zap },
        ],
        LX: [
            { label: 'Approvals', href: '/dashboard/approvals', icon: CheckSquare },
            { label: 'Create Event', href: '/dashboard/events/create', icon: Zap },
            { label: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
        ],
        CLUB: [
            { label: 'Request Event', href: '/dashboard/events/create', icon: Zap },
            { label: 'My Club', href: '/dashboard/clubs', icon: Users },
            { label: 'Add Achievement', href: '/dashboard/achievements/create', icon: Trophy },
        ],
        CLAN: [
            { label: 'My Clan', href: '/dashboard/clans', icon: Flag },
            { label: 'Create Event', href: '/dashboard/events/create', icon: Zap },
            { label: 'Achievements', href: '/dashboard/achievements', icon: Trophy },
        ],
        FINANCE: [
            { label: 'Approvals', href: '/dashboard/approvals', icon: CheckSquare },
            { label: 'Budget', href: '/dashboard/budget', icon: BarChart2 },
            { label: 'Repository', href: '/dashboard/files', icon: FolderOpen },
        ],
    };
    return roleActions[userType] || defaults;
}

const STATUS_STYLES = {
    APPROVED:  'text-green-600 bg-green-50 dark:bg-green-950/40',
    PENDING:   'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40',
    REJECTED:  'text-red-500 bg-red-50 dark:bg-red-950/40',
    COMPLETED: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800',
    CANCELLED: 'text-zinc-400 bg-zinc-50 dark:bg-zinc-900',
};

const TYPE_DOT = {
    CLUB: 'bg-blue-400',
    CLAN: 'bg-primary',
    LX:   'bg-emerald-400',
};

async function DashboardContent() {
    const session = await auth();
    if (!session?.userId) redirect('/login');

    const userEmail = session.sessionClaims?.email || '';
    const userName = session.sessionClaims?.name || 'there';
    const firstName = userName.split(' ')[0];
    const userType = userEmail ? await getUserType(userEmail) : null;
    const quickActions = getQuickActions(userType);

    const [stats, recentEvents, nextEvent] = await Promise.all([
        getDashboardStats(),
        getRecentEvents(),
        getNextEvent(),
    ]);

    const statItems = [
        { label: 'Total events', value: stats.totalEvents, icon: CalendarDays, href: '/dashboard/events' },
        { label: 'Active clubs', value: stats.totalClubs, icon: Users, href: '/dashboard/clubs' },
        { label: 'Clans', value: stats.totalClans, icon: Flag, href: '/dashboard/clans' },
        { label: 'Upcoming', value: stats.upcomingEvents, icon: Clock, href: '/dashboard/calendar' },
    ];

    return (
        <div className="space-y-10">
            {/* Greeting */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-5 flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">
                        Good to see you, {firstName}.
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                {stats.pendingApprovals > 0 && (
                    <Link
                        href="/dashboard/approvals"
                        className="flex items-center gap-2 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-100 dark:border-yellow-900/30 px-3 py-2 rounded-xl hover:bg-yellow-100 transition-colors shrink-0"
                    >
                        <Clock className="h-3.5 w-3.5" />
                        {stats.pendingApprovals} pending
                    </Link>
                )}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {statItems.map(({ label, value, icon: Icon, href }) => (
                    <Link key={label} href={href}>
                        <div className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                                    <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                </div>
                            </div>
                            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
                            <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Next upcoming event highlight */}
            {nextEvent && (
                <div>
                    <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Next up</h2>
                    <Link href={`/dashboard/events/${nextEvent._id}`}>
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${TYPE_DOT[nextEvent.type] || 'bg-zinc-400'}`} />
                                    <div className="min-w-0">
                                        <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{nextEvent.title}</p>
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                            {nextEvent.clubId?.name || 'LX'}
                                            {' · '}
                                            {new Date(nextEvent.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-zinc-400">
                                        {Math.ceil((new Date(nextEvent.startDate) - new Date()) / (1000 * 60 * 60 * 24))} days away
                                    </span>
                                    <ArrowRight className="h-3.5 w-3.5 text-zinc-300" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Quick actions */}
            <div>
                <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Quick actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {quickActions.map(({ label, href, icon: Icon }) => (
                        <Link key={label} href={href}>
                            <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-3.5 py-3 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-primary transition-colors cursor-pointer group">
                                <Icon className="h-4 w-4 text-zinc-400 group-hover:text-primary transition-colors shrink-0" />
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-primary transition-colors truncate">{label}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Recent events */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl italic text-zinc-900 dark:text-zinc-100">Recent Events</h2>
                    <Link href="/dashboard/events" className="text-xs text-zinc-400 hover:text-primary transition-colors flex items-center gap-1">
                        View all <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                {recentEvents.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        No events yet.
                    </div>
                ) : (
                    <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-50 dark:divide-zinc-800">
                        {recentEvents.map((event) => (
                            <Link key={event._id} href={`/dashboard/events/${event._id}`}>
                                <div className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`h-2 w-2 rounded-full shrink-0 ${TYPE_DOT[event.type] || 'bg-zinc-400'}`} />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{event.title}</p>
                                            <p className="text-xs text-zinc-400 truncate">
                                                {event.clubId?.name || event.clanId?.name || 'LX'}
                                                {' · '}
                                                {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-4 ${STATUS_STYLES[event.status] || ''}`}>
                                        {event.status?.toLowerCase()}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-10 animate-pulse">
            <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />)}
            </div>
            <div className="h-16 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
            <div className="h-64 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardContent />
        </Suspense>
    );
}
