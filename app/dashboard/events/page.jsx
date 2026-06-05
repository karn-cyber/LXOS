import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getDashboardSession } from '@/lib/dashboard-session';

async function getEvents() {
    await dbConnect();
    const events = await Event.find()
        .sort({ startDate: -1 })
        .populate('clubId', 'name')
        .populate('clanId', 'name')
        .populate('roomId', 'name')
        .populate('createdBy', 'name')
        .lean();
    return JSON.parse(JSON.stringify(events));
}

const STATUS_STYLES = {
    APPROVED:  'text-green-600 bg-green-50 dark:bg-green-950/40',
    PENDING:   'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40',
    REJECTED:  'text-red-500 bg-red-50 dark:bg-red-950/40',
    COMPLETED: 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800',
    CANCELLED: 'text-zinc-400 bg-zinc-50',
};

const TYPE_STYLES = {
    CLUB: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
    CLAN: 'text-primary bg-secondary',
    LX:   'text-green-600 bg-green-50 dark:bg-green-950/40',
};

function EventsSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="space-y-2">
                {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

async function EventsContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    const events = await getEvents();
    const canCreate = hasPermission(session.user.role, PERMISSIONS.CREATE_EVENT);

    const approvedCount = events.filter(e => e.status === 'APPROVED').length;
    const pendingCount = events.filter(e => e.status === 'PENDING').length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Events</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {events.length} total · {approvedCount} approved · {pendingCount} pending
                    </p>
                </div>
                {canCreate && (
                    <Link href="/dashboard/events/create">
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl font-medium flex items-center gap-1.5 h-9">
                            <Plus className="h-3.5 w-3.5" />
                            New Event
                        </Button>
                    </Link>
                )}
            </div>

            {/* Events list */}
            {events.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No events yet.
                    {canCreate && (
                        <Link href="/dashboard/events/create" className="block mt-2 text-primary text-xs hover:underline">
                            Create the first event →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-50 dark:divide-zinc-800">
                    {events.map((event) => (
                        <Link key={event._id} href={`/dashboard/events/${event._id}`}>
                            <div className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-1 md:gap-4 items-center">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate group-hover:text-primary transition-colors">
                                            {event.title}
                                        </p>
                                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                                            {event.clubId?.name || event.clanId?.name || 'LX Event'}
                                            {event.roomId && ` · ${event.roomId.name}`}
                                            {' · '}
                                            {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TYPE_STYLES[event.type] || 'bg-zinc-50 text-zinc-500'}`}>
                                            {event.type}
                                        </span>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[event.status] || ''}`}>
                                            {event.status}
                                        </span>
                                        <span className="text-xs text-zinc-400 font-medium hidden md:block">
                                            ₹{event.budgetAllocated?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function EventsPage() {
    return (
        <Suspense fallback={<EventsSkeleton />}>
            <EventsContent />
        </Suspense>
    );
}
