'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RoomCalendar({ rooms }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                // Fetch all events that have a room assigned
                const res = await fetch('/api/events');
                if (res.ok) {
                    const data = await res.json();

                    // Filter mainly approved/pending events with rooms
                    const roomEvents = data
                        .filter(e => e.roomId && e.status !== 'REJECTED')
                        .map(e => {
                            const room = rooms.find(r => r._id === e.roomId._id || r._id === e.roomId);
                            const roomName = room ? room.name : 'Unknown Room';

                            // Color coding based on status
                            let color = '#3b82f6'; // blue default
                            if (e.status === 'PENDING') color = '#eab308'; // yellow

                            return {
                                id: e._id,
                                title: `${e.title} (${roomName})`,
                                start: e.startDate,
                                end: e.endDate,
                                backgroundColor: color,
                                borderColor: color,
                                extendedProps: {
                                    room: roomName,
                                    status: e.status,
                                    bookedBy: e.clubId?.name || e.clanId?.name || 'Admin',
                                }
                            };
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
    }, [rooms]);

    if (loading) {
        return <div className="p-8 text-center">Loading calendar...</div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Room Booking Schedule</CardTitle>
                <div className="flex gap-2">
                    <Badge className="bg-blue-500 hover:bg-blue-600">Approved</Badge>
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending Request</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="calendar-container h-[700px]">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="timeGridWeek"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        events={events}
                        height="100%"
                        slotMinTime="08:00:00"
                        slotMaxTime="22:00:00"
                        allDaySlot={false}
                        nowIndicator={true}
                        eventDidMount={(info) => {
                            // Add tooltip or custom rendering if needed
                            info.el.title = `Room: ${info.event.extendedProps.room}\nBy: ${info.event.extendedProps.bookedBy}\nStatus: ${info.event.extendedProps.status}`;
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
