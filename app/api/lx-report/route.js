import { NextResponse } from 'next/server';
import { auth } from '@/lib/api-auth';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Achievement from '@/models/Achievement';
import Reimbursement from '@/models/Reimbursement';

function cell(v) {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function row(arr) { return arr.map(cell).join(','); }
const money = (n) => Number(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// Pick a club/clan's budget figures for a given semester (current or history).
function figureFor(entity, semester) {
    if (entity.semester === semester) {
        return { allocated: entity.budgetAllocated || 0, spent: entity.budgetSpent || 0 };
    }
    const h = (entity.budgetHistory || []).find(x => x.semester === semester);
    return h ? { allocated: h.budgetAllocated || 0, spent: h.budgetSpent || 0 } : null;
}

export async function GET(request) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'LX_TEAM', 'FINANCE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        await dbConnect();

        const [clubs, clans, events, achievements, reimbursements] = await Promise.all([
            Club.find().lean(),
            Clan.find().lean(),
            Event.find().sort({ startDate: -1 })
                .populate('clubId', 'name').populate('clanId', 'name')
                .populate('roomId', 'name').populate('roomIds', 'name').populate('createdBy', 'name').lean(),
            Achievement.find().sort({ achievedDate: -1 })
                .populate('clubId', 'name').populate('clanId', 'name').populate('createdBy', 'name').lean(),
            Reimbursement.find().select('-bills.path').sort({ createdAt: -1 })
                .populate('submittedBy', 'name').populate('clubId', 'name').populate('clanId', 'name')
                .populate('eventId', 'title').lean(),
        ]);

        // Default to the current active semester (most common across clubs).
        let semester = searchParams.get('semester');
        if (!semester) {
            const counts = {};
            [...clubs, ...clans].forEach(e => { counts[e.semester] = (counts[e.semester] || 0) + 1; });
            semester = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Current';
        }

        const now = new Date();
        const lines = [];
        const push = (...rows) => rows.forEach(r => lines.push(r));
        const section = (title) => { lines.push(''); lines.push(`== ${title} ==`); };

        push('LX SEMESTER REPORT');
        push(row(['Semester', semester]));
        push(row(['Generated', now.toLocaleString('en-IN')]));
        push(row(['Note', 'Budget figures are for the selected semester. Events, achievements & reimbursements list all records.']));

        // ---- Summary ----
        const clubBudgets = clubs.map(c => figureFor(c, semester)).filter(Boolean);
        const clanBudgets = clans.map(c => figureFor(c, semester)).filter(Boolean);
        const sumA = [...clubBudgets, ...clanBudgets].reduce((s, b) => s + b.allocated, 0);
        const sumS = [...clubBudgets, ...clanBudgets].reduce((s, b) => s + b.spent, 0);
        section('SUMMARY');
        push(row(['Metric', 'Value']));
        push(row(['Events — total', events.length]));
        push(row(['Events — completed', events.filter(e => e.isCompleted || e.status === 'COMPLETED').length]));
        push(row(['Events — upcoming (next 30 days)', events.filter(e => e.status === 'APPROVED' && new Date(e.startDate) >= now && new Date(e.startDate) <= new Date(now.getTime() + 30 * 864e5)).length]));
        push(row(['Budget allocated (semester)', sumA]));
        push(row(['Budget used (semester)', sumS]));
        push(row(['Budget remaining (semester)', sumA - sumS]));
        push(row(['Achievements', achievements.filter(a => a.kind !== 'UPDATE').length]));
        push(row(['Reimbursements', reimbursements.length]));
        push(row(['Reimbursements processed (₹)', reimbursements.filter(r => r.status === 'PROCESSED').reduce((s, r) => s + money(r.amount), 0)]));

        // ---- Club budgets ----
        section(`CLUB BUDGETS (${semester})`);
        push(row(['Club', 'Allocated', 'Used', 'Remaining', 'Status']));
        clubs.forEach(c => {
            const f = figureFor(c, semester);
            if (!f) return;
            const rem = f.allocated - f.spent;
            push(row([c.name, f.allocated, f.spent, rem, rem < 0 ? 'OVER BUDGET' : 'Within budget']));
        });

        // ---- Clan budgets + points ----
        section(`CLAN BUDGETS & POINTS (${semester})`);
        push(row(['Clan', 'Points', 'Allocated', 'Used', 'Remaining', 'Status']));
        clans.forEach(c => {
            const f = figureFor(c, semester);
            const alloc = f ? f.allocated : 0, spent = f ? f.spent : 0, rem = alloc - spent;
            push(row([c.name, c.points || 0, alloc, spent, rem, rem < 0 ? 'OVER BUDGET' : 'Within budget']));
        });

        // ---- Events ----
        section('EVENTS');
        push(row(['Title', 'Type', 'Organisation', 'Start', 'End', 'Status', 'Venue', 'Budget Allocated', 'Budget Spent', 'Completed']));
        events.forEach(e => {
            const venue = (e.roomIds?.length ? e.roomIds.map(r => r.name).join(' / ') : e.roomId?.name) || e.location || '';
            const org = e.clubId?.name || e.clanId?.name || (e.type === 'FEST' ? 'Fest' : 'LX');
            push(row([e.title, e.type, org, fmtDate(e.startDate), fmtDate(e.endDate), e.status, venue, money(e.budgetAllocated), money(e.budgetSpent), (e.isCompleted || e.status === 'COMPLETED') ? 'Yes' : 'No']));
        });

        // ---- Achievements ----
        section('ACHIEVEMENTS');
        push(row(['Title', 'Category', 'Club/Clan', 'Points', 'Status', 'Date', 'Participants', 'Added By']));
        achievements.filter(a => a.kind !== 'UPDATE').forEach(a => {
            push(row([a.title, a.category, a.clubId?.name || a.clanId?.name || '', money(a.points), a.status, fmtDate(a.achievedDate), (a.participants || []).join('; '), a.createdBy?.name || '']));
        });

        // ---- Reimbursements ----
        section('REIMBURSEMENTS');
        push(row(['Title', 'Submitted By', 'Amount', 'Category', 'Charged To', 'Event/Purpose', 'Status', 'Expense Date']));
        reimbursements.forEach(r => {
            push(row([r.title, r.submittedBy?.name || '', money(r.amount), r.category, r.clubId?.name || r.clanId?.name || '', r.eventId?.title || r.purpose || '', r.status, fmtDate(r.expenseDate)]));
        });

        // ---- Clan point history (activity log) ----
        section('CLAN POINT HISTORY');
        push(row(['Clan', 'Points Change', 'Reason', 'Date']));
        clans.forEach(c => {
            (c.pointHistory || []).slice().reverse().forEach(h => {
                push(row([c.name, money(h.points), h.reason || '', fmtDate(h.date)]));
            });
        });

        const csv = lines.join('\n');
        const filename = `lx-report-${semester.replace(/\s+/g, '-').toLowerCase()}.csv`;
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('LX report error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
