import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import Event from '@/models/Event';
import Achievement from '@/models/Achievement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, DollarSign, Calendar, TrendingUp, Trophy, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import ClubUpdates from '@/components/clubs/club-updates';
import BudgetController from '@/components/admin/budget-controller';

async function getClubData(id) {
    try {
        // Ensure ID is valid Mongo ID
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) return null;

        await dbConnect();

        const club = await Club.findById(id).lean();
        if (!club) return null;

        // Get club events
        const events = await Event.find({ clubId: id })
            .sort({ startDate: -1 })
            .lean();

        // Get club achievements/updates
        const updates = await Achievement.find({ clubId: id })
            .sort({ achievedDate: -1 })
            .lean();

        // Deep serialization helper for Mongo objects
        const serialize = (obj) => {
            if (!obj) return null;
            return JSON.parse(JSON.stringify(obj));
        };

        return {
            club: serialize(club),
            events: serialize(events),
            updates: serialize(updates),
        };
    } catch (error) {
        console.error('Error in getClubData:', error);
        return null;
    }
}

export default async function ClubDetailPage(props) {
    const params = await props.params;
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const { id } = params;
    console.log(`[ClubDetail] Fetching data for club ID: ${id}`);
    const data = await getClubData(id);

    if (!data) {
        redirect('/dashboard/clubs');
    }

    const { club, events, updates } = data;

    const budgetRemaining = club.budgetAllocated - club.budgetSpent;
    const budgetPercentage = club.budgetAllocated > 0
        ? (club.budgetSpent / club.budgetAllocated) * 100
        : 0;

    const isAdmin = session.user.role === 'ADMIN';

    // Check if user is the specific head of THIS club to allow posting updates
    const canPostUpdates = isAdmin ||
        (session.user.role === 'CLUB_HEAD' && session.user.clubId === id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{club.name}</h1>
                        <Badge variant="outline">{club.category}</Badge>
                        {!club.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                        )}
                    </div>
                    {club.description && (
                        <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
                            {club.description}
                        </p>
                    )}
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Link href={`/dashboard/clubs/${club._id}/edit`}>
                            <Button variant="outline">Edit Club</Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                    <TabsTrigger value="updates">Updates & Blog</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview">
                    <div className="grid gap-6">
                        {/* Key Stats */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Budget Allocated</CardTitle>
                                    <DollarSign className="h-4 w-4 text-zinc-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <div className="text-2xl font-bold">₹{club.budgetAllocated.toLocaleString()}</div>
                                        {isAdmin && (
                                            <BudgetController
                                                entityId={club._id}
                                                entityType="CLUB"
                                                currentBudget={club.budgetAllocated}
                                            />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Budget Spent</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">₹{club.budgetSpent.toLocaleString()}</div>
                                    <p className="text-xs text-zinc-500 mt-1">{budgetPercentage.toFixed(1)}% used</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Events Hosted</CardTitle>
                                    <Calendar className="h-4 w-4 text-zinc-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{events.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Updates</CardTitle>
                                    <Trophy className="h-4 w-4 text-zinc-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{updates.length}</div>
                                </CardContent>
                            </Card>
                        </div>
                        {/* ... Rest of overview ... */}
                    </div>
                </TabsContent>

                {/* EVENTS TAB */}
                <TabsContent value="events">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>All Events</CardTitle>
                                {canPostUpdates && (
                                    <Link href="/dashboard/events/create?type=CLUB">
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Event
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {events.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
                                    <h3 className="text-lg font-medium">No events found</h3>
                                    <p className="text-zinc-500">This club hasn't hosted any events yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {events.map((event) => (
                                        <Link key={event._id} href={`/dashboard/events/${event._id}`} className="block">
                                            <div className="flex items-center justify-between p-4 border rounded-lg hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-12 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <Calendar className="h-6 w-6 text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-lg">{event.title}</h4>
                                                        <div className="flex items-center gap-4 text-sm text-zinc-500 mt-1">
                                                            <span>{new Date(event.startDate).toLocaleDateString()}</span>
                                                            {event.location && <span>• {event.location}</span>}
                                                            <span>• ₹{event.budgetAllocated.toLocaleString()} Budget</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge className={`
                                                    ${event.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                                                    ${event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                                                    ${event.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                                                `}>
                                                    {event.status}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BUDGET TAB */}
                <TabsContent value="budget">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Financial Overview</CardTitle>
                                {isAdmin && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-zinc-500">Edit Budget:</span>
                                        <BudgetController
                                            entityId={club._id}
                                            entityType="CLUB"
                                            currentBudget={club.budgetAllocated}
                                        />
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-center space-y-2">
                                        <div className="relative h-40 w-40 mx-auto">
                                            {/* Simple Ring Chart Representation */}
                                            <div className="absolute inset-0 rounded-full border-8 border-zinc-100 dark:border-zinc-800"></div>
                                            <div
                                                className="absolute inset-0 rounded-full border-8 border-transparent border-t-green-500"
                                                style={{ transform: `rotate(${budgetPercentage * 3.6}deg)` }}
                                            ></div>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className="text-3xl font-bold">{budgetPercentage.toFixed(0)}%</span>
                                                <span className="text-xs text-zinc-500 uppercase">Used</span>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <h3 className="text-lg font-medium">Total Budget: ₹{club.budgetAllocated.toLocaleString()}</h3>
                                            <p className="text-zinc-500">Remaining: ₹{budgetRemaining.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* UPDATES / BLOG TAB */}
                <TabsContent value="updates">
                    <ClubUpdates
                        clubId={club._id}
                        updates={updates}
                        canPost={canPostUpdates}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
