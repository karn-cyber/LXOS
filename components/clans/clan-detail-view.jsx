'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Flag, 
    Trophy, 
    DollarSign, 
    Calendar, 
    FileText, 
    Lightbulb,
    ArrowLeft,
    Edit,
    Trash2,
    Plus
} from 'lucide-react';
import Link from 'next/link';
import ClanOverview from './clan-overview';
import ClanEvents from './clan-events';
import ClanBudget from './clan-budget';
import ClanInitiatives from './clan-initiatives';
import ClanBlog from './clan-blog';
import PointsManager from './points-manager';
import LeaderboardCharts from './leaderboard-charts';

export default function ClanDetailView({ 
    clan, 
    events, 
    user, 
    isAdmin, 
    isClanLeader 
}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [clanData, setClanData] = useState(clan);
    
    const canEdit = isAdmin || isClanLeader;
    
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <Link href="/dashboard/clans">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Clans
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${clanData.color || 'bg-gray-500'}`}>
                                <Flag className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{clanData.name}</h1>
                                <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                                    {clanData.description || 'No description available'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {canEdit && (
                    <div className="flex items-center gap-2">
                        <PointsManager 
                            clan={clanData}
                            isAdmin={isAdmin}
                        />
                        <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Clan
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Total Points</p>
                                <p className="text-2xl font-bold">{clanData.points}</p>
                            </div>
                            <Trophy className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Budget Allocated</p>
                                <p className="text-2xl font-bold">₹{clanData.budgetAllocated?.toLocaleString() || 0}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Budget Spent</p>
                                <p className="text-2xl font-bold">₹{clanData.budgetSpent?.toLocaleString() || 0}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Budget Remaining</p>
                                <p className="text-2xl font-bold">₹{((clanData.budgetAllocated || 0) - (clanData.budgetSpent || 0)).toLocaleString()}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="events" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Events
                    </TabsTrigger>
                    <TabsTrigger value="budget" className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Budget
                    </TabsTrigger>
                    <TabsTrigger value="initiatives" className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Initiatives
                    </TabsTrigger>
                    <TabsTrigger value="blog" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Blog
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <ClanOverview 
                        clan={clanData} 
                        events={events}
                        canEdit={canEdit}
                        isAdmin={isAdmin}
                    />
                </TabsContent>

                <TabsContent value="events" className="space-y-6">
                    <ClanEvents 
                        clan={clanData}
                        events={events}
                        canEdit={canEdit}
                        isAdmin={isAdmin}
                        isClanLeader={isClanLeader}
                    />
                </TabsContent>

                <TabsContent value="budget" className="space-y-6">
                    <ClanBudget 
                        clan={clanData}
                        events={events}
                        canEdit={isAdmin} // Only admin can edit budget
                        isAdmin={isAdmin}
                    />
                </TabsContent>

                <TabsContent value="initiatives" className="space-y-6">
                    <ClanInitiatives 
                        clan={clanData}
                        canEdit={canEdit}
                        isAdmin={isAdmin}
                        isClanLeader={isClanLeader}
                    />
                </TabsContent>

                <TabsContent value="blog" className="space-y-6">
                    <ClanBlog 
                        clan={clanData}
                        canEdit={canEdit}
                        isAdmin={isAdmin}
                        isClanLeader={isClanLeader}
                        userId={user.id}
                    />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <LeaderboardCharts />
                </TabsContent>
            </Tabs>
        </div>
    );
}
