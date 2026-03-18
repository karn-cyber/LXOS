import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Plus, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import RoomCalendar from '@/components/rooms/room-calendar';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

async function getRooms() {
    await dbConnect();

    const rooms = await Room.find()
        .sort({ name: 1 })
        .lean();

    return rooms.map(room => ({
        ...room,
        _id: room._id.toString(),
    }));
}

export default async function RoomsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const rooms = await getRooms();
    const isAdmin = session.user.role === 'ADMIN';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Rooms & Bookings</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                        Manage classroom inventory and reservations
                    </p>
                </div>
                {/* Admin Actions */}
                {isAdmin && (
                    <div className="flex gap-2">
                        <Link href="/dashboard/events/create?type=LX">
                            <Button variant="secondary">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Manual Booking
                            </Button>
                        </Link>
                        <Link href="/dashboard/rooms/create">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Room
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            <Tabs defaultValue="list" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="list">Room Inventory</TabsTrigger>
                    <TabsTrigger value="calendar">Booking Calendar</TabsTrigger>
                </TabsList>

                {/* INVENTORY TAB */}
                <TabsContent value="list">
                    {rooms.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <p className="text-zinc-500 text-center">No rooms found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {rooms.map((room) => (
                                <Card key={room._id} className={`h-full ${!room.isAvailable ? 'opacity-60' : ''}`}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{room.name}</CardTitle>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="outline">{room.type}</Badge>
                                                    {!room.isAvailable && (
                                                        <Badge variant="destructive">Unavailable</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4 text-zinc-500" />
                                            <span className="text-zinc-600 dark:text-zinc-400">
                                                Capacity: <span className="font-medium text-zinc-900 dark:text-zinc-100">{room.capacity}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-zinc-500" />
                                            <span className="text-zinc-600 dark:text-zinc-400">{room.location}</span>
                                        </div>
                                        {room.facilities && room.facilities.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium mb-2">Facilities:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {room.facilities.map((facility, index) => (
                                                        <Badge key={index} variant="secondary" className="text-xs font-normal">
                                                            {facility}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="pt-4 border-t mt-4">
                                            {hasPermission(session.user.role, PERMISSIONS.EDIT_ROOM) ? (
                                                <div className="flex gap-2">
                                                    <Link href={`/dashboard/rooms/${room._id}/edit`} className="flex-1">
                                                        <Button variant="outline" size="sm" className="w-full">
                                                            Edit Room
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/dashboard/events/create?roomId=${room._id}&roomName=${room.name}`} className="flex-1">
                                                        <Button size="sm" className="w-full" disabled={!room.isAvailable}>
                                                            {room.isAvailable ? 'Book Room' : 'Unavailable'}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            ) : (
                                                <Link href={`/dashboard/events/create?roomId=${room._id}&roomName=${room.name}`}>
                                                    <Button size="sm" className="w-full" disabled={!room.isAvailable}>
                                                        {room.isAvailable ? 'Book This Room' : 'Unavailable'}
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* CALENDAR TAB */}
                <TabsContent value="calendar">
                    <RoomCalendar rooms={rooms} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
