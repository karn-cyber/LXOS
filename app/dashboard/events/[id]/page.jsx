import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Room from '@/models/Room';
import User from '@/models/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, CheckCircle, XCircle, Clock, Edit } from 'lucide-react';
import Link from 'next/link';
import ApprovalActions from '@/components/events/approval-actions';

async function getEvent(id) {
    await dbConnect();

    const event = await Event.findById(id)
        .populate('clubId', 'name category budgetAllocated')
        .populate('clanId', 'name color points')
        .populate('roomId', 'name type capacity location facilities')
        .populate('createdBy', 'name email role')
        .populate('approvedBy', 'name email')
        .lean();

    if (!event) return null;

    // Deep serialization helper for Mongo objects
    const serialize = (obj) => {
        if (!obj) return null;
        return JSON.parse(JSON.stringify(obj));
    };

    return serialize(event);
}

export default async function EventDetailPage(props) {
    const params = await props.params;
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const event = await getEvent(params.id);

    if (!event) {
        redirect('/dashboard/events');
    }

    const canApprove = session.user.role === 'ADMIN' || session.user.role === 'LX_TEAM';
    const budgetRemaining = event.budgetAllocated - event.budgetSpent;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/events">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
                            <Badge className={`
                                ${event.type === 'CLUB' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : ''}
                                ${event.type === 'CLAN' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' : ''}
                                ${event.type === 'LX' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : ''}
                            `}>
                                {event.type}
                            </Badge>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                            Created by {event.createdBy?.name} • {new Date(event.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge className={`
                        ${event.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300' : ''}
                        ${event.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' : ''}
                        ${event.status === 'REJECTED' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' : ''}
                        ${event.status === 'COMPLETED' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' : ''}
                    `}>
                        {event.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {event.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                        {event.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                        {event.status}
                    </Badge>

                    {/* Edit/Delete Buttons for authorized users */}
                    {(session.user.role === 'ADMIN' || session.user.role === 'LX_TEAM' || event.createdBy?._id === session.user.id) && (
                        <div className="flex gap-2 ml-4">
                            <Link href={`/dashboard/events/${event._id}/edit`}>
                                <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Approval Actions */}
            {canApprove && event.status === 'PENDING' && (
                <ApprovalActions eventId={event._id} />
            )}

            {/* Rejection Reason */}
            {event.status === 'REJECTED' && event.rejectionReason && (
                <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">Rejection Reason:</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{event.rejectionReason}</p>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Description */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{event.description}</p>
                        </CardContent>
                    </Card>

                    {/* Requirements */}
                    {event.requirements && event.requirements.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Requirements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {event.requirements.map((req, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                                            <div>
                                                <p className="font-medium">{req.item}</p>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400">Quantity: {req.quantity}</p>
                                            </div>
                                            <p className="font-medium">₹{req.estimatedCost.toLocaleString()}</p>
                                        </div>
                                    ))}
                                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                        <div className="flex items-center justify-between font-semibold">
                                            <span>Total Estimated Cost</span>
                                            <span>₹{event.requirements.reduce((sum, req) => sum + req.estimatedCost, 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Room Details */}
                    {event.roomId && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Venue Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-zinc-500" />
                                    <span className="font-medium">{event.roomId.name}</span>
                                </div>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Type:</span>
                                        <span>{event.roomId.type}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Capacity:</span>
                                        <span>{event.roomId.capacity} people</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Location:</span>
                                        <span>{event.roomId.location}</span>
                                    </div>
                                </div>
                                {event.roomId.facilities && event.roomId.facilities.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Facilities:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {event.roomId.facilities.map((facility, index) => (
                                                <Badge key={index} variant="outline">{facility}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Event Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Event Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>Start Date</span>
                                </div>
                                <p className="font-medium">{new Date(event.startDate).toLocaleString()}</p>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>End Date</span>
                                </div>
                                <p className="font-medium">{new Date(event.endDate).toLocaleString()}</p>
                            </div>

                            {event.attendees > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                                        <Users className="h-4 w-4" />
                                        <span>Expected Attendees</span>
                                    </div>
                                    <p className="font-medium">{event.attendees}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Organization */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {event.clubId && (
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Club</p>
                                    <p className="font-medium">{event.clubId.name}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{event.clubId.category}</p>
                                </div>
                            )}
                            {event.clanId && (
                                <div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Clan</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-lg" style={{ backgroundColor: event.clanId.color }} />
                                        <p className="font-medium">{event.clanId.name}</p>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">{event.clanId.points} points</p>
                                </div>
                            )}
                            {!event.clubId && !event.clanId && (
                                <p className="font-medium">LX Event</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Budget */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Budget</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Allocated</span>
                                <span className="font-medium">₹{event.budgetAllocated.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500 dark:text-zinc-400">Spent</span>
                                <span className="font-medium text-red-600 dark:text-red-400">₹{event.budgetSpent.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                <span className="text-zinc-500 dark:text-zinc-400">Remaining</span>
                                <span className="font-medium text-green-600 dark:text-green-400">₹{budgetRemaining.toLocaleString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
