import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import { getRoleFromRUData } from '@/lib/ru-data-mapper';
import ruDataRaw from '../../all RU data 2 (1).json' with { type: 'json' };
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, Flag, TrendingUp } from 'lucide-react';
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton';

async function getDashboardStats() {
    await dbConnect();

    const [totalEvents, totalClubs, totalClans, upcomingEvents] = await Promise.all([
        Event.countDocuments(),
        Club.countDocuments({ isActive: true }),
        Clan.countDocuments(),
        Event.countDocuments({
            startDate: { $gte: new Date() },
            status: 'APPROVED'
        }),
    ]);

    return {
        totalEvents,
        totalClubs,
        totalClans,
        upcomingEvents,
    };
}

async function getRecentEvents() {
    await dbConnect();

    const events = await Event.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('clubId', 'name')
        .populate('clanId', 'name')
        .populate('createdBy', 'name')
        .lean();

    return events.map(event => ({
        ...event,
        _id: event._id.toString(),
        clubId: event.clubId ? { ...event.clubId, _id: event.clubId._id.toString() } : null,
        clanId: event.clanId ? { ...event.clanId, _id: event.clanId._id.toString() } : null,
        createdBy: event.createdBy ? { ...event.createdBy, _id: event.createdBy._id.toString() } : null,
    }));
}

// Get user type from RU data
async function getUserType(email) {
    try {
        const ruData = Array.isArray(ruDataRaw) ? ruDataRaw : ruDataRaw?.data || [];
        
        const normalizedEmail = email.toLowerCase().trim();
        const user = ruData.find(record => 
            record?.email?.toLowerCase().trim() === normalizedEmail
        );
        
        return user?.userType || null;
    } catch (error) {
        console.error('Error fetching user type:', error);
        return null;
    }
}

function getWelcomeMessage(userType) {
    switch(userType) {
        case 'STUDENT':
            return 'Welcome Learner';
        case 'CLUB':
            return 'Welcome Club Head';
        case 'CLAN':
            return 'Welcome Clan Head';
        case 'ADMIN':
            return 'Welcome Administrator';
        case 'FINANCE':
            return 'Welcome Finance Manager';
        case 'LX':
            return 'Welcome LX Team';
        default:
            return 'Welcome back';
    }
}

async function DashboardContent() {
    const session = await auth();

    if (!session?.userId) {
        redirect('/login');
    }

    // Get user email from session
    let userEmail = '';
    try {
        userEmail = session.sessionClaims?.email || '';
    } catch (error) {
        console.error('Error fetching user email:', error);
    }

    const userType = userEmail ? await getUserType(userEmail) : null;
    const welcomeMessage = getWelcomeMessage(userType);

    // Deep serialization helper for Mongo objects
    const serialize = (obj) => {
        if (!obj) return null;
        return JSON.parse(JSON.stringify(obj));
    };

    const stats = await getDashboardStats();
    const recentEvents = serialize(await getRecentEvents());

    const statCards = [
        {
            title: 'Total Events',
            value: stats.totalEvents,
            icon: CalendarDays,
            description: 'All time events',
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-950/30'
        },
        {
            title: 'Active Clubs',
            value: stats.totalClubs,
            icon: Users,
            description: 'Currently active',
            color: 'text-primary',
            bg: 'bg-secondary'
        },
        {
            title: 'Clans',
            value: stats.totalClans,
            icon: Flag,
            description: 'Competing clans',
            color: 'text-orange-600',
            bg: 'bg-orange-50 dark:bg-orange-950/30'
        },
        {
            title: 'Upcoming Events',
            value: stats.upcomingEvents,
            icon: TrendingUp,
            description: 'Approved events',
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-950/30'
        },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                        {welcomeMessage}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Hello, <span className="text-primary font-bold">{session.sessionClaims?.name || 'User'}</span>. Here's what's happening.
                    </p>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center">
                    <div className="px-4 py-2 bg-secondary text-primary rounded-xl text-xs font-bold uppercase tracking-wider">
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="overflow-hidden border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 group hover:-translate-y-1 transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-colors duration-300`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{stat.value}</div>
                                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                                            {stat.title}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center text-xs font-medium text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                                    {stat.description}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Main Grid */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Recent Events */}
                <Card className="lg:col-span-2 border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-910">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-800 pb-6">
                        <div>
                            <CardTitle className="text-xl font-bold">Recent Events</CardTitle>
                            <p className="text-xs text-zinc-400 font-medium mt-1">Latest activities from clubs and clans</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentEvents.length === 0 ? (
                            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                                <div className="bg-zinc-50 dark:bg-zinc-800/50 h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <CalendarDays className="h-8 w-8 text-zinc-300" />
                                </div>
                                <p className="font-medium">No events yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                {recentEvents.map((event) => (
                                    <div
                                        key={event._id}
                                        className="flex items-center justify-between p-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-all duration-200 group"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-white shadow-lg
                                                ${event.type === 'CLUB' ? 'bg-blue-600 shadow-blue-200 dark:shadow-none' : ''}
                                                ${event.type === 'CLAN' ? 'bg-primary shadow-primary/20 dark:shadow-none' : ''}
                                                ${event.type === 'LX' ? 'bg-green-600 shadow-green-200 dark:shadow-none' : ''}
                                            `}>
                                                {event.type[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-primary transition-colors">{event.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm font-medium text-zinc-500 truncate">
                                                        {event.clubId?.name || event.clanId?.name || 'LX Event'}
                                                    </span>
                                                    <span className="text-zinc-300">•</span>
                                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                                        By {event.createdBy?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 ml-4">
                                            <div className={`
                                                px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full
                                                ${event.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                                                ${event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                                                ${event.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                                            `}>
                                                {event.status}
                                            </div>
                                            <span className="text-[10px] font-medium text-zinc-400">
                                                {new Date(event.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Info / Platform Updates */}
                <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-primary text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full blur-2xl -ml-12 -mb-12"></div>

                    <CardHeader>
                        <CardTitle className="text-xl font-black">LX Platform</CardTitle>
                        <p className="text-primary-foreground/70 text-sm font-medium">Empowering Excellence</p>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <p className="text-sm leading-relaxed text-primary-foreground/90 font-medium">
                            Manage your clubs, track clan points, and stay updated with upcoming events at Rishihood University.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                <TrendingUp className="h-5 w-5 text-accent" />
                                <div className="text-xs">
                                    <p className="font-bold">Next Milestone</p>
                                    <p className="text-primary-foreground/70 mt-0.5">Reach 10,000 active members</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
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
