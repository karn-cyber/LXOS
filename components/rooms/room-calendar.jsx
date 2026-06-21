'use client';

import { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';

// Stable, distinct palette so each room reads as its own color on the calendar.
const ROOM_PALETTE = [
    '#2563eb', '#16a34a', '#db2777', '#9333ea', '#ea580c',
    '#0891b2', '#ca8a04', '#dc2626', '#4f46e5', '#0d9488',
];

function colorForRoom(roomId, index) {
    return ROOM_PALETTE[index % ROOM_PALETTE.length];
}

export default function RoomCalendar({ rooms }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roomFilter, setRoomFilter] = useState('ALL');

    // Map each room id -> a stable color.
    const roomColors = useMemo(() => {
        const map = {};
        rooms.forEach((room, i) => { map[room._id] = colorForRoom(room._id, i); });
        return map;
    }, [rooms]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events');
                if (res.ok) {
                    const data = await res.json();

                    // An event can book several rooms — emit one calendar entry
                    // per room so each room's schedule shows the booking.
                    const roomEvents = data
                        .filter(e => e.status !== 'REJECTED')
                        .flatMap(e => {
                            const eventRooms = (e.roomIds?.length > 0 ? e.roomIds : (e.roomId ? [e.roomId] : []));
                            const isPending = e.status === 'PENDING';
                            const bookedBy = e.clubId?.name || e.clanId?.name || (e.type === 'FEST' ? 'Fest' : 'LX / Admin');

                            return eventRooms.map(rm => {
                                const roomId = rm?._id || rm;
                                const room = rooms.find(r => r._id === roomId);
                                const roomName = room ? room.name : (rm?.name || 'Unknown Room');
                                const color = roomColors[roomId] || '#71717a';

                                return {
                                    id: `${e._id}-${roomId}`,
                                    title: e.title,
                                    start: e.startDate,
                                    end: e.endDate,
                                    backgroundColor: isPending ? '#ffffff' : color,
                                    borderColor: color,
                                    textColor: isPending ? color : '#ffffff',
                                    extendedProps: { roomId, room: roomName, status: e.status, isPending, bookedBy },
                                };
                            });
                        });
                    setEvents(roomEvents);
                }
            } catch (error) {
                console.error('Failed to fetch calendar events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [rooms, roomColors]);

    const visibleEvents = useMemo(() => {
        if (roomFilter === 'ALL') return events;
        return events.filter(e => e.extendedProps.roomId === roomFilter);
    }, [events, roomFilter]);

    const renderEventContent = (arg) => {
        const { room, bookedBy, isPending } = arg.event.extendedProps;
        return (
            <div className="px-1 py-0.5 overflow-hidden leading-tight">
                <div className="text-[11px] font-semibold truncate">{arg.event.title}</div>
                <div className="flex items-center gap-0.5 text-[10px] truncate opacity-90">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{room}</span>
                </div>
                <div className="text-[9px] truncate opacity-75">
                    {bookedBy}{isPending ? ' · pending' : ''}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-16 gap-2 text-sm text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading room schedule…
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle>Room Booking Schedule</CardTitle>
                    <select
                        value={roomFilter}
                        onChange={(e) => setRoomFilter(e.target.value)}
                        className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                    >
                        <option value="ALL">All rooms ({events.length} bookings)</option>
                        {rooms.map(room => (
                            <option key={room._id} value={room._id}>{room.name}</option>
                        ))}
                    </select>
                </div>

                {/* Per-room color legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {rooms.map(room => (
                        <button
                            key={room._id}
                            type="button"
                            onClick={() => setRoomFilter(prev => prev === room._id ? 'ALL' : room._id)}
                            className={`flex items-center gap-1.5 text-xs transition-opacity ${roomFilter !== 'ALL' && roomFilter !== room._id ? 'opacity-40' : ''}`}
                        >
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: roomColors[room._id] }} />
                            <span className="text-zinc-600 dark:text-zinc-300">{room.name}</span>
                        </button>
                    ))}
                    <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <span className="h-2.5 w-2.5 rounded-full border-2 bg-white border-zinc-400" />
                        Pending (hollow)
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                {visibleEvents.length === 0 ? (
                    <div className="text-center py-16 text-sm text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        No room bookings{roomFilter !== 'ALL' ? ' for this room' : ''} yet.
                    </div>
                ) : (
                    <div className="calendar-container h-[600px] sm:h-[700px] overflow-x-auto">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay',
                            }}
                            events={visibleEvents}
                            eventContent={renderEventContent}
                            height="100%"
                            slotMinTime="07:00:00"
                            slotMaxTime="23:00:00"
                            allDaySlot={false}
                            nowIndicator={true}
                            expandRows={true}
                            eventDidMount={(info) => {
                                const p = info.event.extendedProps;
                                info.el.title = `${info.event.title}\nRoom: ${p.room}\nBy: ${p.bookedBy}\nStatus: ${p.status}`;
                            }}
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
