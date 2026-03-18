'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/calendar');
            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (info) => {
        const event = events.find(e => e.id === info.event.id);
        if (event) {
            setSelectedEvent(event);
            setDialogOpen(true);
        }
    };

    const getEventColor = (type) => {
        switch (type) {
            case 'CLUB':
                return '#3B82F6'; // Blue
            case 'CLAN':
                return '#A855F7'; // Purple
            case 'LX':
                return '#10B981'; // Green
            default:
                return '#6B7280'; // Gray
        }
    };

    const calendarEvents = events.map(event => ({
        id: event._id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: getEventColor(event.type),
        borderColor: getEventColor(event.type),
        extendedProps: {
            ...event,
        },
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                        View all events across clubs, clans, and LX
                    </p>
                </div>
            </div>

            {/* Legend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Event Types</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-lg bg-blue-500"></div>
                            <span className="text-sm">Club Events</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-lg bg-purple-500"></div>
                            <span className="text-sm">Clan Events</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-lg bg-green-500"></div>
                            <span className="text-sm">LX Events</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar */}
            <Card>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-zinc-500 dark:text-zinc-400">Loading calendar...</div>
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay',
                            }}
                            events={calendarEvents}
                            eventClick={handleEventClick}
                            height="auto"
                            eventDisplay="block"
                            displayEventTime={true}
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: false,
                            }}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Event Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4">
                            <div>
                                <span className={`
                  inline-block px-2 py-1 text-xs rounded-lg
                  ${selectedEvent.type === 'CLUB' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : ''}
                  ${selectedEvent.type === 'CLAN' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' : ''}
                  ${selectedEvent.type === 'LX' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : ''}
                `}>
                                    {selectedEvent.type}
                                </span>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Description</h4>
                                <p className="text-sm">{selectedEvent.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Start Date</h4>
                                    <p className="text-sm">{new Date(selectedEvent.startDate).toLocaleString()}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">End Date</h4>
                                    <p className="text-sm">{new Date(selectedEvent.endDate).toLocaleString()}</p>
                                </div>
                            </div>

                            {selectedEvent.roomId && (
                                <div>
                                    <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Room</h4>
                                    <p className="text-sm">{selectedEvent.roomId.name}</p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Budget</h4>
                                <p className="text-sm">₹{selectedEvent.budgetAllocated.toLocaleString()}</p>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Status</h4>
                                <span className={`
                  inline-block px-2 py-1 text-xs font-medium rounded-lg
                  ${selectedEvent.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : ''}
                  ${selectedEvent.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' : ''}
                  ${selectedEvent.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' : ''}
                `}>
                                    {selectedEvent.status}
                                </span>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setDialogOpen(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
