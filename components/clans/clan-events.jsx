'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Calendar,
    MapPin,
    Users,
    DollarSign,
    Edit,
    Trash2,
    Plus,
    Eye,
    Clock,
    CheckCircle
} from 'lucide-react';
import EventScoring from './event-scoring';

export default function ClanEvents({ clan, events, canEdit, isAdmin, isClanLeader }) {
    const [filter, setFilter] = useState('all');
    
    const filteredEvents = events.filter(event => {
        if (filter === 'upcoming') return new Date(event.date) > new Date();
        if (filter === 'completed') return new Date(event.date) <= new Date();
        return true;
    });

    const getEventStatus = (event) => {
        const eventDate = new Date(event.date);
        const now = new Date();
        
        if (eventDate > now) {
            return { status: 'upcoming', color: 'bg-blue-500', icon: Clock };
        } else {
            return { status: 'completed', color: 'bg-green-500', icon: CheckCircle };
        }
    };

    const canEditEvent = (event) => {
        return isAdmin || (isClanLeader && event.clanId === clan._id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Clan Events</h2>
                    <p className="text-zinc-500">Manage events associated with {clan.name}</p>
                </div>
                {canEdit && (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                    </Button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
                <Button 
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    All Events ({events.length})
                </Button>
                <Button 
                    variant={filter === 'upcoming' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('upcoming')}
                >
                    Upcoming ({events.filter(e => new Date(e.date) > new Date()).length})
                </Button>
                <Button 
                    variant={filter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('completed')}
                >
                    Completed ({events.filter(e => new Date(e.date) <= new Date()).length})
                </Button>
            </div>

            {/* Events List */}
            {filteredEvents.length > 0 ? (
                <div className="grid gap-4">
                    {filteredEvents.map((event) => {
                        const eventStatus = getEventStatus(event);
                        const StatusIcon = eventStatus.icon;
                        
                        return (
                            <Card key={event._id} className="transition-shadow hover:shadow-md">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold">{event.title}</h3>
                                                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                                                        {event.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <Badge variant="outline" className="flex items-center gap-1">
                                                        <StatusIcon className="h-3 w-3" />
                                                        {eventStatus.status}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        {event.type}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-zinc-500" />
                                                    <span>{new Date(event.date).toLocaleDateString()}</span>
                                                </div>
                                                
                                                {event.location && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-zinc-500" />
                                                        <span>{event.location}</span>
                                                    </div>
                                                )}
                                                
                                                {event.expectedParticipants && (
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-zinc-500" />
                                                        <span>{event.expectedParticipants} participants</span>
                                                    </div>
                                                )}
                                                
                                                {event.budgetRequested && (
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-zinc-500" />
                                                        <span>₹{event.budgetRequested.toLocaleString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {event.approvalStatus && (
                                                <div className="pt-2 border-t">
                                                    <Badge 
                                                        variant={
                                                            event.approvalStatus === 'APPROVED' ? 'success' : 
                                                            event.approvalStatus === 'REJECTED' ? 'destructive' : 'outline'
                                                        }
                                                    >
                                                        {event.approvalStatus}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                            
                                            {/* Event Scoring for completed events */}
                                            {!event.isCompleted && isAdmin && (
                                                <EventScoring 
                                                    event={event} 
                                                    isAdmin={isAdmin}
                                                    onScoresSubmitted={(result) => {
                                                        // Handle score submission result
                                                        console.log('Scores submitted:', result);
                                                    }}
                                                />
                                            )}
                                            
                                            {canEditEvent(event) && (
                                                <>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Calendar className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No events found</h3>
                        <p className="text-zinc-500 mb-4">
                            {filter === 'all' 
                                ? `There are no events associated with ${clan.name} yet.`
                                : `There are no ${filter} events for ${clan.name}.`
                            }
                        </p>
                        {canEdit && (
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Event
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
