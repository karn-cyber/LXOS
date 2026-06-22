import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Achievement from '@/models/Achievement';
import Reimbursement from '@/models/Reimbursement';
import Initiative from '@/models/Initiative';

const money = (n) => Number(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function figureFor(entity, semester) {
    if (entity.semester === semester) {
        return { allocated: entity.budgetAllocated || 0, spent: entity.budgetSpent || 0 };
    }
    const h = (entity.budgetHistory || []).find(x => x.semester === semester);
    return h ? { allocated: h.budgetAllocated || 0, spent: h.budgetSpent || 0 } : null;
}

/**
 * Gathers the full LX report for a semester as a structured object.
 * Shared by the CSV export (/api/lx-report) and the printable report page.
 */
export async function getLxReportData(requestedSemester) {
    await dbConnect();

    const [clubs, clans, events, achievements, reimbursements, initiatives] = await Promise.all([
        Club.find().lean(),
        Clan.find().lean(),
        Event.find().sort({ startDate: -1 })
            .populate('clubId', 'name').populate('clanId', 'name')
            .populate('roomId', 'name').populate('roomIds', 'name').lean(),
        Achievement.find().sort({ achievedDate: -1 })
            .populate('clubId', 'name').populate('clanId', 'name').populate('createdBy', 'name').lean(),
        Reimbursement.find().select('-bills.path').sort({ createdAt: -1 })
            .populate('submittedBy', 'name').populate('clubId', 'name').populate('clanId', 'name')
            .populate('eventId', 'title').lean(),
        Initiative.find().sort({ date: -1 }).populate('clanId', 'name').lean(),
    ]);

    let semester = requestedSemester;
    if (!semester) {
        const counts = {};
        [...clubs, ...clans].forEach(e => { counts[e.semester] = (counts[e.semester] || 0) + 1; });
        semester = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Current';
    }

    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 864e5);

    const clubBudgets = clubs.map(c => {
        const f = figureFor(c, semester);
        if (!f) return null;
        return { name: c.name, allocated: f.allocated, used: f.spent, remaining: f.allocated - f.spent };
    }).filter(Boolean);

    const clanBudgets = clans.map(c => {
        const f = figureFor(c, semester) || { allocated: 0, spent: 0 };
        return { name: c.name, points: c.points || 0, allocated: f.allocated, used: f.spent, remaining: f.allocated - f.spent };
    });

    const sumA = [...clubBudgets, ...clanBudgets].reduce((s, b) => s + b.allocated, 0);
    const sumS = [...clubBudgets, ...clanBudgets].reduce((s, b) => s + b.used, 0);

    const summary = [
        { metric: 'Events — total', value: events.length },
        { metric: 'Events — completed', value: events.filter(e => e.isCompleted || e.status === 'COMPLETED').length },
        { metric: 'Events — upcoming (next 30 days)', value: events.filter(e => e.status === 'APPROVED' && new Date(e.startDate) >= now && new Date(e.startDate) <= in30).length },
        { metric: 'Budget allocated (semester)', value: sumA },
        { metric: 'Budget used (semester)', value: sumS },
        { metric: 'Budget remaining (semester)', value: sumA - sumS },
        { metric: 'Achievements', value: achievements.filter(a => a.kind !== 'UPDATE').length },
        { metric: 'Reimbursements', value: reimbursements.length },
        { metric: 'Reimbursements processed (₹)', value: reimbursements.filter(r => r.status === 'PROCESSED').reduce((s, r) => s + money(r.amount), 0) },
    ];

    return {
        semester,
        generatedAt: now,
        summary,
        clubBudgets,
        clanBudgets,
        events: events.map(e => ({
            title: e.title, type: e.type,
            org: e.clubId?.name || e.clanId?.name || (e.type === 'FEST' ? 'Fest' : 'LX'),
            start: fmtDate(e.startDate), end: fmtDate(e.endDate), status: e.status,
            venue: (e.roomIds?.length ? e.roomIds.map(r => r.name).join(' / ') : e.roomId?.name) || e.location || '',
            allocated: money(e.budgetAllocated), spent: money(e.budgetSpent),
            completed: (e.isCompleted || e.status === 'COMPLETED') ? 'Yes' : 'No',
        })),
        achievements: achievements.filter(a => a.kind !== 'UPDATE').map(a => ({
            title: a.title, category: a.category, org: a.clubId?.name || a.clanId?.name || '',
            points: money(a.points), status: a.status, date: fmtDate(a.achievedDate),
            participants: (a.participants || []).join('; '), addedBy: a.createdBy?.name || '',
        })),
        reimbursements: reimbursements.map(r => ({
            title: r.title, by: r.submittedBy?.name || '', amount: money(r.amount), category: r.category,
            chargedTo: r.clubId?.name || r.clanId?.name || '', purpose: r.eventId?.title || r.purpose || '',
            status: r.status, date: fmtDate(r.expenseDate),
        })),
        initiatives: initiatives.map(it => ({
            title: it.title, clan: it.clanId?.name || '', semester: it.semester || '',
            status: it.status, date: fmtDate(it.date), description: it.description || '',
        })),
        pointHistory: clans.flatMap(c => (c.pointHistory || []).slice().reverse().map(h => ({
            clan: c.name, points: money(h.points), reason: h.reason || '', date: fmtDate(h.date),
        }))),
    };
}
