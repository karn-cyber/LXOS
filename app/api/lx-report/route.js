import { NextResponse } from 'next/server';
import { auth } from '@/lib/api-auth';
import { getLxReportData } from '@/lib/lx-report-data';

function cell(v) {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function row(arr) { return arr.map(cell).join(','); }

export async function GET(request) {
    try {
        const session = await auth();
        if (!session || !['ADMIN', 'LX_TEAM', 'FINANCE'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const data = await getLxReportData(searchParams.get('semester'));

        const lines = [];
        const push = (...rs) => rs.forEach(r => lines.push(r));
        const section = (title) => { lines.push(''); lines.push(`== ${title} ==`); };
        const statusOf = (rem) => (rem < 0 ? 'OVER BUDGET' : 'Within budget');

        push('LX SEMESTER REPORT');
        push(row(['Semester', data.semester]));
        push(row(['Generated', data.generatedAt.toLocaleString('en-IN')]));
        push(row(['Note', 'Budget figures are for the selected semester. Events, achievements & reimbursements list all records.']));

        section('SUMMARY');
        push(row(['Metric', 'Value']));
        data.summary.forEach(s => push(row([s.metric, s.value])));

        section(`CLUB BUDGETS (${data.semester})`);
        push(row(['Club', 'Allocated', 'Used', 'Remaining', 'Status']));
        data.clubBudgets.forEach(b => push(row([b.name, b.allocated, b.used, b.remaining, statusOf(b.remaining)])));

        section(`CLAN BUDGETS & POINTS (${data.semester})`);
        push(row(['Clan', 'Points', 'Allocated', 'Used', 'Remaining', 'Status']));
        data.clanBudgets.forEach(b => push(row([b.name, b.points, b.allocated, b.used, b.remaining, statusOf(b.remaining)])));

        section('EVENTS');
        push(row(['Title', 'Type', 'Organisation', 'Start', 'End', 'Status', 'Venue', 'Budget Allocated', 'Budget Spent', 'Completed']));
        data.events.forEach(e => push(row([e.title, e.type, e.org, e.start, e.end, e.status, e.venue, e.allocated, e.spent, e.completed])));

        section('ACHIEVEMENTS');
        push(row(['Title', 'Category', 'Club/Clan', 'Points', 'Status', 'Date', 'Participants', 'Added By']));
        data.achievements.forEach(a => push(row([a.title, a.category, a.org, a.points, a.status, a.date, a.participants, a.addedBy])));

        section('REIMBURSEMENTS');
        push(row(['Title', 'Submitted By', 'Amount', 'Category', 'Charged To', 'Event/Purpose', 'Status', 'Expense Date']));
        data.reimbursements.forEach(r => push(row([r.title, r.by, r.amount, r.category, r.chargedTo, r.purpose, r.status, r.date])));

        section('INITIATIVES');
        push(row(['Title', 'Clan', 'Semester', 'Status', 'Date', 'Description']));
        data.initiatives.forEach(it => push(row([it.title, it.clan, it.semester, it.status, it.date, it.description])));

        section('CLAN POINT HISTORY');
        push(row(['Clan', 'Points Change', 'Reason', 'Date']));
        data.pointHistory.forEach(h => push(row([h.clan, h.points, h.reason, h.date])));

        const csv = lines.join('\n');
        const filename = `lx-report-${data.semester.replace(/\s+/g, '-').toLowerCase()}.csv`;
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
