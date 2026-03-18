'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Trophy } from 'lucide-react';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        clubActivity: [],
        budgetTrends: [],
        eventsByType: [],
        clanPerformance: [],
        stats: {
            totalEvents: 0,
            totalBudget: 0,
            totalExpenses: 0,
            totalAchievements: 0,
        },
    });

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            const response = await fetch('/api/analytics');
            if (response.ok) {
                const analyticsData = await response.json();
                setData(analyticsData);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                <p className="text-zinc-500">Loading analytics data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Comprehensive analytics and performance metrics
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                        <Calendar className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.totalEvents}</div>
                        <p className="text-xs text-zinc-500 mt-1">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.stats.totalBudget.toLocaleString()}</div>
                        <p className="text-xs text-zinc-500 mt-1">Allocated</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.stats.totalExpenses.toLocaleString()}</div>
                        <p className="text-xs text-zinc-500 mt-1">Approved</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                        <Trophy className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.stats.totalAchievements}</div>
                        <p className="text-xs text-zinc-500 mt-1">Recorded</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Club Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Club Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.clubActivity}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="events" fill="#3b82f6" name="Events" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Events by Type */}
                <Card>
                    <CardHeader>
                        <CardTitle>Events by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.eventsByType}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.eventsByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Budget Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Budget vs Spending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.budgetTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="allocated" fill="#10b981" name="Allocated" />
                                <Bar dataKey="spent" fill="#ef4444" name="Spent" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Clan Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Clan Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.clanPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="points" fill="#8b5cf6" name="Points" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
