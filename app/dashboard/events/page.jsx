import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Room from '@/models/Room';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CalendarDays } from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

async function getEvents() {
    await dbConnect();

    const events = await Event.find()
        .sort({ startDate: -1 })
        .populate('clubId', 'name')
        .populate('clanId', 'name')
        .populate('roomId', 'name')
        .populate('createdBy', 'name')
        .lean();

    // Deep serialization helper for Mongo objects
    const serialize = (obj) => {
        if (!obj) return null;
        return JSON.parse(JSON.stringify(obj));
    };

    return serialize(events);
}

export default async function EventsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const events = await getEvents();
    const canCreateEvent = hasPermission(session.user.role, PERMISSIONS.CREATE_EVENT);

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Events</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Discover and manage <span className="text-green-600 font-bold italic">Extraordinary</span> Gatherings.
                    </p>
                </div>
                {canCreateEvent && (
                    <Link href="/dashboard/events/create">
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Plus className="h-5 w-5 mr-3" />
                            Create New Event
                        </Button>
                    </Link>
                )}
            </div>

            {/* Total Count Area */}
            <div className="flex items-center gap-3 ml-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{events.length} Scheduled Events</span>
            </div>

            {/* Events Grid */}
            {events.length === 0 ? (
                <Card className="border-none bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center py-24">
                        <div className="bg-white dark:bg-zinc-800 h-20 w-20 rounded-3xl shadow-xl flex items-center justify-center mb-6">
                            <CalendarDays className="h-10 w-10 text-zinc-300" />
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8 font-medium">
                            No events currently scheduled in the calendar.
                        </p>
                        {canCreateEvent && (
                            <Link href="/dashboard/events/create">
                                <Button className="bg-primary text-white font-bold px-6 py-5 rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Launch First Event
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                        <Link key={event._id} href={`/dashboard/events/${event._id}`} className="group h-full">
                            <Card className="h-full border-none shadow-xl shadow-zinc-200/40 dark:shadow-none bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden hover:translate-y-[-8px] transition-all duration-300 relative">
                                <CardHeader className="pt-8 px-8">
                                    <div className="flex items-start justify-between">
                                        <div className="flex flex-col gap-2">
                                            <div className={`inline-flex items-center self-start px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border
                                                ${event.type === 'CLUB' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/30' : ''}
                                                ${event.type === 'CLAN' ? 'bg-secondary text-primary border-primary/10' : ''}
                                                ${event.type === 'LX' ? 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/30 dark:border-green-900/30' : ''}
                                            `}>
                                                {event.type}
                                            </div>
                                            <CardTitle className="text-2xl font-black text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors leading-tight">
                                                {event.title}
                                            </CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-6">
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2 min-h-[2.5em]">
                                        {event.description}
                                    </p>

                                    <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Host</span>
                                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                {event.clubId?.name || event.clanId?.name || 'LX Direct'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">When</span>
                                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                {new Date(event.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        {event.roomId && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Where</span>
                                                <span className="text-xs font-bold text-primary">{event.roomId.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <div className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full
                                            ${event.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                                            ${event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                                            ${event.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                                            ${event.status === 'COMPLETED' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' : ''}
                                        `}>
                                            {event.status}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Budget</p>
                                            <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">₹{event.budgetAllocated.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Explore Event Details →</span>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
