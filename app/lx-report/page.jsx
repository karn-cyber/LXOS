import { redirect } from 'next/navigation';
import { getDashboardSession } from '@/lib/dashboard-session';
import { getLxReportData } from '@/lib/lx-report-data';
import PrintButton from '@/components/budget/print-button';

export const dynamic = 'force-dynamic';

function money(n) {
    return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function Section({ title, children }) {
    return (
        <section className="mt-8 break-inside-avoid">
            <h2 className="text-base font-bold text-zinc-900 border-b-2 border-zinc-800 pb-1 mb-3">{title}</h2>
            {children}
        </section>
    );
}

function Table({ headers, rows, align = {} }) {
    if (!rows || rows.length === 0) {
        return <p className="text-sm text-zinc-400 italic">No records.</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
                <thead>
                    <tr className="bg-zinc-100">
                        {headers.map((h, i) => (
                            <th key={i} className={`border border-zinc-200 px-2 py-1.5 font-semibold text-zinc-700 ${align[i] === 'right' ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, ri) => (
                        <tr key={ri} className="even:bg-zinc-50">
                            {r.map((c, ci) => (
                                <td key={ci} className={`border border-zinc-200 px-2 py-1.5 align-top ${align[ci] === 'right' ? 'text-right' : 'text-left'} ${c?.cls || ''}`}>
                                    {c?.cls !== undefined ? c.text : c}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Colored remaining cell (green positive, red negative).
function rem(value) {
    return { text: value < 0 ? `-${money(value)}` : money(value), cls: value < 0 ? 'text-red-600 font-semibold' : 'text-green-700 font-semibold' };
}

export default async function LxReportPrintPage({ searchParams }) {
    const session = await getDashboardSession();
    if (!session) redirect('/login');
    if (!['ADMIN', 'LX_TEAM', 'FINANCE'].includes(session.user.role)) redirect('/dashboard');

    const sp = await searchParams;
    const data = await getLxReportData(sp?.semester);

    return (
        <div className="min-h-screen bg-white text-zinc-900">
            <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b-4 border-zinc-900 pb-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">LX Semester Report</h1>
                        <p className="text-sm text-zinc-500 mt-1">{data.semester}</p>
                        <p className="text-[11px] text-zinc-400">Generated {data.generatedAt.toLocaleString('en-IN')}</p>
                    </div>
                    <PrintButton />
                </div>

                <Section title="Summary">
                    <Table
                        headers={['Metric', 'Value']}
                        align={{ 1: 'right' }}
                        rows={data.summary.map(s => [s.metric, typeof s.value === 'number' && /₹|allocated|used|remaining|processed/i.test(s.metric) ? money(s.value) : String(s.value)])}
                    />
                </Section>

                <Section title={`Club Budgets — ${data.semester}`}>
                    <Table
                        headers={['Club', 'Allocated', 'Used', 'Remaining']}
                        align={{ 1: 'right', 2: 'right', 3: 'right' }}
                        rows={data.clubBudgets.map(b => [b.name, money(b.allocated), money(b.used), rem(b.remaining)])}
                    />
                </Section>

                <Section title={`Clan Budgets & Points — ${data.semester}`}>
                    <Table
                        headers={['Clan', 'Points', 'Allocated', 'Used', 'Remaining']}
                        align={{ 1: 'right', 2: 'right', 3: 'right', 4: 'right' }}
                        rows={data.clanBudgets.map(b => [b.name, String(b.points), money(b.allocated), money(b.used), rem(b.remaining)])}
                    />
                </Section>

                <Section title="Events">
                    <Table
                        headers={['Title', 'Type', 'Organisation', 'Start', 'Status', 'Venue', 'Spent', 'Done']}
                        align={{ 6: 'right' }}
                        rows={data.events.map(e => [e.title, e.type, e.org, e.start, e.status, e.venue, money(e.spent), e.completed])}
                    />
                </Section>

                <Section title="Achievements">
                    <Table
                        headers={['Title', 'Category', 'Club/Clan', 'Points', 'Status', 'Date', 'Added By']}
                        align={{ 3: 'right' }}
                        rows={data.achievements.map(a => [a.title, a.category, a.org, String(a.points), a.status, a.date, a.addedBy])}
                    />
                </Section>

                <Section title="Reimbursements">
                    <Table
                        headers={['Title', 'By', 'Amount', 'Category', 'Charged To', 'Status', 'Date']}
                        align={{ 2: 'right' }}
                        rows={data.reimbursements.map(r => [r.title, r.by, money(r.amount), r.category, r.chargedTo, r.status, r.date])}
                    />
                </Section>

                <Section title="Initiatives">
                    <Table
                        headers={['Title', 'Clan', 'Semester', 'Status', 'Date']}
                        rows={data.initiatives.map(it => [it.title, it.clan, it.semester, it.status, it.date])}
                    />
                </Section>

                <Section title="Clan Point History">
                    <Table
                        headers={['Clan', 'Points', 'Reason', 'Date']}
                        align={{ 1: 'right' }}
                        rows={data.pointHistory.map(h => [h.clan, String(h.points), h.reason, h.date])}
                    />
                </Section>

                <p className="mt-10 text-[10px] text-zinc-400 text-center print:hidden">
                    Use “Print / Save as PDF” above. Budget figures reflect {data.semester}; events, achievements & reimbursements list all records.
                </p>
            </div>
        </div>
    );
}
