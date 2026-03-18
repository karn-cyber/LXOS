'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    Trophy, 
    DollarSign, 
    Calendar, 
    Target,
    Edit,
    TrendingUp,
    Users
} from 'lucide-react';

export default function ClanOverview({ clan, events, canEdit, isAdmin }) {
    const budgetUtilization = clan.budgetAllocated > 0 
        ? (clan.budgetSpent / clan.budgetAllocated) * 100 
        : 0;

    const upcomingEvents = events.filter(event => 
        new Date(event.date) > new Date()
    ).length;

    const completedEvents = events.filter(event => 
        new Date(event.date) <= new Date()
    ).length;

    return (
        <div className="space-y-6">
            {/* Clan Information Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Clan Information</CardTitle>
                        {canEdit && (
                            <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Details
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Clan Name</p>
                            <p className="text-lg font-semibold">{clan.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Semester</p>
                            <p className="text-lg font-semibold">{clan.semester}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Current Points</p>
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                <p className="text-lg font-semibold">{clan.points}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-zinc-500">Clan Color</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full ${clan.color || 'bg-gray-500'}`}></div>
                                <p className="text-lg font-semibold capitalize">
                                    {clan.color?.replace('bg-', '').replace('-500', '') || 'Gray'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {clan.description && (
                        <div>
                            <p className="text-sm font-medium text-zinc-500 mb-2">Description</p>
                            <p className="text-gray-700 dark:text-gray-300">{clan.description}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Performance Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-500" />
                            Budget Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>Budget Utilization</span>
                                <span className={
                                    budgetUtilization > 90 
                                        ? "text-red-600 font-medium" 
                                        : budgetUtilization > 75 
                                        ? "text-yellow-600 font-medium" 
                                        : "text-green-600 font-medium"
                                }>
                                    {budgetUtilization.toFixed(1)}%
                                </span>
                            </div>
                            <Progress 
                                value={Math.min(budgetUtilization, 100)} 
                                className="h-2"
                            />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-zinc-500">Allocated</p>
                                <p className="font-semibold text-green-600">
                                    ₹{clan.budgetAllocated?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Spent</p>
                                <p className="font-semibold text-red-600">
                                    ₹{clan.budgetSpent?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-zinc-500">Remaining</p>
                                <p className="font-semibold text-blue-600">
                                    ₹{((clan.budgetAllocated || 0) - (clan.budgetSpent || 0)).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            Event Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{upcomingEvents}</p>
                                <p className="text-sm text-zinc-500">Upcoming Events</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{completedEvents}</p>
                                <p className="text-sm text-zinc-500">Completed Events</p>
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                            <p className="text-sm text-zinc-500 mb-2">Total Events This Semester</p>
                            <p className="text-lg font-semibold">{events.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        Recent Activity
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {events.length > 0 ? (
                        <div className="space-y-3">
                            {events.slice(0, 5).map((event) => (
                                <div key={event._id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{event.title}</p>
                                        <p className="text-sm text-zinc-500">
                                            {new Date(event.date).toLocaleDateString()} • {event.type}
                                        </p>
                                    </div>
                                    <Badge variant={
                                        new Date(event.date) > new Date() ? "default" : "secondary"
                                    }>
                                        {new Date(event.date) > new Date() ? "Upcoming" : "Completed"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-center py-8">No events found for this clan.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
