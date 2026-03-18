'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { TrendingUp, Calendar, Trophy, RotateCcw } from 'lucide-react';

const COLORS = {
    'Maratha': '#f97316', // orange
    'Vijaya': '#3b82f6',   // blue
    'Chola': '#10b981',    // green
    'Rajputana': '#8b5cf6' // purple
};

export default function LeaderboardCharts() {
    const [leaderboardData, setLeaderboardData] = useState({
        all: [],
        yearly: [],
        quarterly: []
    });
    const [activeTab, setActiveTab] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboardData();
    }, []);

    const fetchLeaderboardData = async () => {
        setIsLoading(true);
        try {
            const periods = ['all', 'yearly', 'quarterly'];
            const promises = periods.map(period =>
                fetch(`/api/clans/leaderboard?period=${period}`).then(res => res.json())
            );

            const results = await Promise.all(promises);
            
            setLeaderboardData({
                all: results[0],
                yearly: results[1],
                quarterly: results[2]
            });
        } catch (error) {
            console.error('Failed to fetch leaderboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getCurrentData = () => {
        return leaderboardData[activeTab] || { leaderboard: [], chartData: [] };
    };

    const currentData = getCurrentData();

    // Custom bar shape for 3D effect
    const CustomBar = (props) => {
        const { fill, ...rest } = props;
        return (
            <g>
                <Bar {...rest} fill={fill} />
                {/* Add 3D effect shadows */}
                <Bar 
                    {...rest} 
                    fill={fill} 
                    fillOpacity={0.3}
                    x={rest.x + 2}
                    y={rest.y - 2}
                />
            </g>
        );
    };

    const formatPoints = (value) => {
        return value.toLocaleString();
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading leaderboard data...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Clan Leaderboard Analytics</h2>
                    <p className="text-zinc-500">Interactive charts showing clan performance over time</p>
                </div>
                <Button onClick={fetchLeaderboardData} variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Period Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        All Time
                    </TabsTrigger>
                    <TabsTrigger value="yearly" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        This Year
                    </TabsTrigger>
                    <TabsTrigger value="quarterly" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Last 3 Months
                    </TabsTrigger>
                </TabsList>

                {/* All Time Leaderboard */}
                <TabsContent value="all" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* 3D Bar Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>All-Time Points (3D Bar Chart)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={currentData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis 
                                            dataKey="name" 
                                            tick={{ fontSize: 12 }}
                                            axisLine={false}
                                        />
                                        <YAxis 
                                            tickFormatter={formatPoints}
                                            tick={{ fontSize: 12 }}
                                            axisLine={false}
                                        />
                                        <Tooltip 
                                            formatter={(value) => [formatPoints(value), 'Points']}
                                            labelStyle={{ color: '#000' }}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                border: '1px solid #ccc',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar 
                                            dataKey="points" 
                                            fill="#8884d8"
                                            radius={[4, 4, 0, 0]}
                                            stroke="#6366f1"
                                            strokeWidth={1}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Points Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={currentData.chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value, percent }) => 
                                                `${name}: ${(percent * 100).toFixed(1)}%`
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="points"
                                        >
                                            {currentData.chartData?.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={COLORS[entry.name] || `hsl(${index * 45}, 70%, 50%)`} 
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatPoints(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Leaderboard Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All-Time Leaderboard</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {currentData.leaderboard?.map((clan) => (
                                    <div key={clan.clanId} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                                                {clan.rank}
                                            </div>
                                            <div className={`w-4 h-4 rounded-full ${clan.color}`}></div>
                                            <span className="font-medium">{clan.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">{formatPoints(clan.points)}</div>
                                            <div className="text-xs text-zinc-500">points</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Yearly Leaderboard */}
                <TabsContent value="yearly" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Yearly Bar Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Yearly Points (2024)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={currentData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={formatPoints} tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(value) => [formatPoints(value), 'Points']} />
                                        <Bar 
                                            dataKey="points" 
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Line Chart for Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Trends</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={currentData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={formatPoints} />
                                        <Tooltip formatter={(value) => [formatPoints(value), 'Points']} />
                                        <Line 
                                            type="monotone" 
                                            dataKey="points" 
                                            stroke="#3b82f6" 
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Quarterly Leaderboard */}
                <TabsContent value="quarterly" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Quarterly Bar Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>3-Month Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={currentData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={formatPoints} tick={{ fontSize: 12 }} />
                                        <Tooltip formatter={(value) => [formatPoints(value), 'Points']} />
                                        <Bar 
                                            dataKey="points" 
                                            fill="#f59e0b"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Recent Changes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Changes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {currentData.leaderboard?.map((clan) => (
                                        <div key={clan.clanId} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full ${clan.color}`}></div>
                                                <span className="font-medium">{clan.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{formatPoints(clan.points)}</span>
                                                {clan.change !== 0 && (
                                                    <span className={`text-sm px-2 py-1 rounded-full ${
                                                        clan.change > 0 
                                                            ? 'bg-green-100 text-green-600' 
                                                            : 'bg-red-100 text-red-600'
                                                    }`}>
                                                        {clan.change > 0 ? '+' : ''}{clan.change}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
