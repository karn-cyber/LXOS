import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Clan from '@/models/Clan';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, Trophy, Plus, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import BudgetController from '@/components/admin/budget-controller';
import PointsManager from '@/components/clans/points-manager';

async function getClans() {
    try {
        await dbConnect();
        const clans = await Clan.find()
            .sort({ points: -1 })
            .lean();

        // Deep serialization helper for Mongo objects
        const serialize = (obj) => {
            if (!obj) return null;
            return JSON.parse(JSON.stringify(obj));
        };

        return serialize(clans);
    } catch (error) {
        console.warn('Database connection failed, using mock data:', error.message);

        // Return mock data for development
        return [
            {
                _id: '507f1f77bcf86cd799439011',
                name: 'Maratha',
                color: 'bg-orange-500',
                points: 2450,
                budgetAllocated: 50000,
                budgetSpent: 35000,
                semester: 'Spring 2026',
                description: 'The warrior clan known for strength and valor'
            },
            {
                _id: '507f1f77bcf86cd799439012',
                name: 'Vijaya',
                color: 'bg-blue-500',
                points: 2200,
                budgetAllocated: 45000,
                budgetSpent: 28000,
                semester: 'Spring 2026',
                description: 'The victorious clan with a legacy of success'
            },
            {
                _id: '507f1f77bcf86cd799439013',
                name: 'Chola',
                color: 'bg-green-500',
                points: 1980,
                budgetAllocated: 40000,
                budgetSpent: 22000,
                semester: 'Spring 2026',
                description: 'The maritime clan with rich cultural heritage'
            },
            {
                _id: '507f1f77bcf86cd799439014',
                name: 'Rajputana',
                color: 'bg-purple-500',
                points: 1850,
                budgetAllocated: 42000,
                budgetSpent: 31000,
                semester: 'Spring 2026',
                description: 'The royal clan known for honor and chivalry'
            }
        ];
    }
}

export default async function ClansPage() {
    let session;
    try {
        session = await auth();
    } catch (error) {
        console.warn('Auth failed, using mock session:', error.message);
        // Mock session for development
        session = {
            user: {
                id: 'mock-user-id',
                name: 'Development Admin',
                email: 'admin@dev.local',
                role: 'ADMIN',
                clanId: null,
                clanName: null
            }
        };
    }

    if (!session) {
        redirect('/login');
    }

    const clans = await getClans();
    const isAdmin = session.user.role === 'ADMIN';
    const isClanHead = session.user.role === 'CLAN_HEAD';

    // If user is clan head, redirect to their specific clan page
    if (isClanHead && session.user.clanId) {
        redirect(`/dashboard/clans/${session.user.clanId}`);
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Clans</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        The ultimate battle for <span className="text-primary font-bold italic">Excellence</span> and Standings.
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/clans/create">
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Plus className="h-5 w-5 mr-3" />
                            Initialize New Clan
                        </Button>
                    </Link>
                )}
            </div>

            {/* Leaderboard Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-accent flex items-center justify-center rounded-xl">
                        <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight uppercase italic underline decoration-accent decoration-4 underline-offset-8">Hall of Fame</h2>
                </div>

                <div className="grid gap-6 lg:grid-cols-1">
                    {clans.map((clan, index) => {
                        const isTop = index === 0;
                        const rankColors = [
                            'from-yellow-400 to-orange-500 shadow-orange-200/50',
                            'from-zinc-300 to-zinc-500 shadow-zinc-200/50',
                            'from-orange-700 to-amber-900 shadow-amber-200/50'
                        ];

                        return (
                            <div
                                key={clan._id}
                                className={`group relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl border transition-all duration-300 hover:translate-x-2
                                    ${isTop
                                        ? 'bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/10 dark:to-zinc-900 border-yellow-200 dark:border-yellow-900/30'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
                                    }`}
                            >
                                {/* Rank Container */}
                                <div className={`flex-shrink-0 w-20 h-20 flex items-center justify-center rounded-2xl font-black text-3xl shadow-xl transition-transform group-hover:scale-110
                                    ${index < 3 ? `bg-gradient-to-br ${rankColors[index]} text-white` : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}
                                `}>
                                    #{index + 1}
                                </div>

                                {/* Clan Details */}
                                <div className="flex-1 flex flex-col md:flex-row items-center gap-6 text-center md:text-left min-w-0">
                                    <div className={`p-4 rounded-3xl ${clan.color || 'bg-gray-500'} shadow-lg group-hover:rotate-6 transition-transform`}>
                                        <Flag className="h-8 w-8 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-3">
                                            {clan.name}
                                            {isTop && <Badge className="bg-yellow-500 text-[10px] font-black uppercase">Current Champion</Badge>}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-2">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border border-zinc-100 dark:border-zinc-800">
                                                <Trophy className="h-3 w-3 text-accent" />
                                                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">{clan.points} Points</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-50 dark:bg-zinc-800/50 rounded-full border border-zinc-100 dark:border-zinc-800">
                                                <DollarSign className="h-3 w-3 text-green-500" />
                                                <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">₹{Number(clan.budgetAllocated).toLocaleString()} Budget</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats & Actions */}
                                <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                                    <div className="text-center md:text-right hidden md:block">
                                        <div className="text-4xl font-black text-primary group-hover:scale-110 transition-transform">{clan.points}</div>
                                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Standings</div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <Link href={`/dashboard/clans/${clan._id}`} className="flex-1 md:flex-none">
                                            <Button variant="outline" className="w-full text-xs font-bold rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 px-6 py-5">
                                                Performance Details
                                            </Button>
                                        </Link>
                                        {isAdmin && (
                                            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                <PointsManager clan={clan} isAdmin={isAdmin} />
                                                <BudgetController
                                                    entityId={clan._id}
                                                    entityType="CLAN"
                                                    currentBudget={clan.budgetAllocated || 0}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Performance Grid */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 flex items-center justify-center rounded-xl">
                        <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Resource Utilization</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {clans.map((clan) => {
                        const budgetRatio = clan.budgetAllocated > 0 ? (clan.budgetSpent / clan.budgetAllocated) : 0;
                        const isCritical = budgetRatio > 0.9;

                        return (
                            <Card key={clan._id} className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 overflow-hidden group">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex justify-between items-center">
                                        <span className="font-black text-lg group-hover:text-primary transition-colors">{clan.name}</span>
                                        <Badge variant="secondary" className="font-bold bg-secondary text-primary">{Math.round(budgetRatio * 100)}% Used</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-1 shadow-inner">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm
                                                    ${isCritical ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-primary to-primary/80'}
                                                `}
                                                style={{ width: `${Math.min(budgetRatio * 100, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-4">
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Spent</p>
                                                <p className={`text-sm font-black ${isCritical ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>₹{clan.budgetSpent?.toLocaleString() || 0}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Allowance</p>
                                                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">₹{clan.budgetAllocated?.toLocaleString() || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
