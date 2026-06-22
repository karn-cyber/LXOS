import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Expense from '@/models/Expense';
import Achievement from '@/models/Achievement';
import { auth } from '@/lib/api-auth';

export async function GET(request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Analytics (incl. budget figures) is for Admin / LX / Finance only.
        if (!['ADMIN', 'LX_TEAM', 'FINANCE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

        // Budget by semester — current + historical, across clubs and clans.
        const SEASON_RANK = { holi: 0, spring: 0, summer: 1, diwali: 2, fall: 2, autumn: 2, winter: 3 };
        const semesterMap = {};
        const addSem = (sem, alloc, spent) => {
            if (!sem) return;
            if (!semesterMap[sem]) semesterMap[sem] = { allocated: 0, spent: 0 };
            semesterMap[sem].allocated += alloc || 0;
            semesterMap[sem].spent += spent || 0;
        };
        [...clubs, ...clans].forEach(e => {
            addSem(e.semester, e.budgetAllocated, e.budgetSpent);
            (e.budgetHistory || []).forEach(h => addSem(h.semester, h.budgetAllocated, h.budgetSpent));
        });
        const sortKey = (s) => {
            const parts = s.toLowerCase().split(/\s+/);
            const year = parseInt(parts.find(p => /^\d{4}$/.test(p)) || '0', 10);
            const season = SEASON_RANK[parts[0]] ?? 9;
            return year * 10 + season;
        };
        const budgetBySemester = Object.entries(semesterMap)
            .map(([semester, v]) => ({ semester, ...v }))
            .sort((a, b) => sortKey(a.semester) - sortKey(b.semester));

        // Per-entity, per-semester figures for the downloadable report.
        const entityRow = (e, type) => {
            const bySemester = { [e.semester]: { allocated: e.budgetAllocated || 0, spent: e.budgetSpent || 0 } };
            (e.budgetHistory || []).forEach(h => { bySemester[h.semester] = { allocated: h.budgetAllocated || 0, spent: h.budgetSpent || 0 }; });
            return { name: e.name, type, current: e.semester, bySemester };
        };
        const budgetEntities = [
            ...clubs.map(c => entityRow(c, 'Club')),
            ...clans.map(c => entityRow(c, 'Clan')),
        ];
        const allSemesters = budgetBySemester.map(b => b.semester);

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
            budgetBySemester,
            budgetEntities,
            allSemesters,
            clanPerformance,
            stats,
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
