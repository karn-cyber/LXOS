'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const EVENT_COLORS = {
    CLUB: '#71717a',
    CLAN: '#a1a1aa',
    LX:   '#52525b',
};

export default function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/calendar')
            .then(r => r.ok ? r.json() : [])
            .then(data => setEvents(data))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

    const calendarEvents = events.map(event => ({
        id: event._id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        backgroundColor: EVENT_COLORS[event.type] || EVENT_COLORS.LX,
        borderColor: 'transparent',
        extendedProps: { ...event },
    }));

    const handleEventClick = (info) => {
        const event = events.find(e => e._id === info.event.id);
        if (event) {
            setSelectedEvent(event);
            setDialogOpen(true);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Calendar</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        All scheduled events across clubs, clans, and LX
                    </p>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-3">
                    {[
                        { color: 'bg-zinc-600', label: 'Club' },
                        { color: 'bg-zinc-400', label: 'Clan' },
                        { color: 'bg-zinc-700', label: 'LX' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <div className={`h-2 w-2 rounded-full ${color}`} />
                            {label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-sm text-zinc-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading events…
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
            </div>

            {/* Event Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl italic">{selectedEvent?.title}</DialogTitle>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4 text-sm">
                            <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 rounded">
                                    {selectedEvent.type}
                                </span>
                                {selectedEvent.status && (
                                    <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 rounded">
                                        {selectedEvent.status}
                                    </span>
                                )}
                            </div>

                            {selectedEvent.description && (
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{selectedEvent.description}</p>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs text-zinc-400 mb-0.5">Start</p>
                                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                                        {new Date(selectedEvent.startDate).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-400 mb-0.5">End</p>
                                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                                        {new Date(selectedEvent.endDate).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {selectedEvent.budgetAllocated != null && (
                                <div>
                                    <p className="text-xs text-zinc-400 mb-0.5">Budget</p>
                                    <p className="font-medium text-zinc-800 dark:text-zinc-200">₹{selectedEvent.budgetAllocated.toLocaleString()}</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs" onClick={() => setDialogOpen(false)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
