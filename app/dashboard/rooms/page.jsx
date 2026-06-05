import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Plus } from 'lucide-react';
import RoomCalendar from '@/components/rooms/room-calendar';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { getDashboardSession } from '@/lib/dashboard-session';

async function getRooms() {
    await dbConnect();
    const rooms = await Room.find().sort({ name: 1 }).lean();
    return rooms.map(r => ({ ...r, _id: r._id.toString() }));
}

function RoomsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <div key={i} className="h-36 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

async function RoomsContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    const rooms = await getRooms();
    const isAdmin = session.user.role === 'ADMIN';
    const canEdit = hasPermission(session.user.role, PERMISSIONS.EDIT_ROOM);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Rooms</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {rooms.filter(r => r.isAvailable).length} available · {rooms.length} total
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/rooms/create">
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl font-medium flex items-center gap-1.5 h-9">
                            <Plus className="h-3.5 w-3.5" />
                            Add Room
                        </Button>
                    </Link>
                )}
            </div>

            <Tabs defaultValue="list" className="space-y-5">
                <TabsList className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 h-8">
                    <TabsTrigger value="list" className="text-xs rounded-md h-7 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm font-medium">
                        Rooms
                    </TabsTrigger>
                    <TabsTrigger value="calendar" className="text-xs rounded-md h-7 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm font-medium">
                        Calendar
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list">
                    {rooms.length === 0 ? (
                        <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                            No rooms added yet.
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {rooms.map(room => (
                                <div
                                    key={room._id}
                                    className={`bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 ${!room.isAvailable ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-medium text-zinc-400">{room.type}</span>
                                                {!room.isAvailable && (
                                                    <span className="text-[10px] font-medium text-red-400">closed</span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{room.name}</h3>
                                        </div>
                                        {room.isAvailable && (
                                            <div className="h-2 w-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                                        )}
                                    </div>

                                    <div className="space-y-1 text-xs text-zinc-400 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-3 w-3" />
                                            {room.capacity} people
                                        </div>
                                        {room.location && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3 w-3" />
                                                {room.location}
                                            </div>
                                        )}
                                    </div>

                                    {room.facilities?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {room.facilities.map((f, i) => (
                                                <span key={i} className="text-[10px] bg-zinc-50 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {canEdit && (
                                            <Link href={`/dashboard/rooms/${room._id}/edit`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full h-8 text-xs rounded-lg">Edit</Button>
                                            </Link>
                                        )}
                                        <Link href={`/dashboard/events/create?roomId=${room._id}&roomName=${room.name}`} className="flex-1">
                                            <Button
                                                size="sm"
                                                className="w-full h-8 text-xs rounded-lg bg-primary text-white hover:bg-primary/90"
                                                disabled={!room.isAvailable}
                                            >
                                                {room.isAvailable ? 'Book' : 'Unavailable'}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="calendar">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
                        <RoomCalendar rooms={rooms} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function RoomsPage() {
    return (
        <Suspense fallback={<RoomsSkeleton />}>
            <RoomsContent />
        </Suspense>
    );
}
