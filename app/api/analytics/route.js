import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Expense from '@/models/Expense';
import Achievement from '@/models/Achievement';
import { auth } from '@/auth';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Get all data
        const [events, clubs, clans, expenses, achievements] = await Promise.all([
            Event.find().lean(),
            Club.find({ isActive: true }).lean(),
            Clan.find().lean(),
            Expense.find({ status: 'APPROVED' }).lean(),
            Achievement.find().lean(),
        ]);

        // Calculate club activity
        const clubActivity = clubs.map(club => ({
            name: club.name,
            events: events.filter(e => e.clubId?.toString() === club._id.toString()).length,
        })).sort((a, b) => b.events - a.events);

        // Events by type
        const eventsByType = [
            { name: 'Club', value: events.filter(e => e.type === 'CLUB').length },
            { name: 'Clan', value: events.filter(e => e.type === 'CLAN').length },
            { name: 'LX', value: events.filter(e => e.type === 'LX').length },
        ].filter(item => item.value > 0);

        // Budget trends (clubs)
        const budgetTrends = clubs.map(club => ({
            name: club.name,
            allocated: club.budgetAllocated,
            spent: club.budgetSpent,
        })).sort((a, b) => b.allocated - a.allocated).slice(0, 5);

        // Clan performance
        const clanPerformance = clans.map(clan => ({
            name: clan.name,
            points: clan.points,
            color: clan.color,
        })).sort((a, b) => b.points - a.points);

        // Stats
        const stats = {
            totalEvents: events.length,
            totalBudget: clubs.reduce((sum, club) => sum + club.budgetAllocated, 0) +
                clans.reduce((sum, clan) => sum + clan.budgetAllocated, 0),
            totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
            totalAchievements: achievements.length,
        };

        return NextResponse.json({
            clubActivity,
            eventsByType,
            budgetTrends,
            clanPerformance,
            stats,
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
