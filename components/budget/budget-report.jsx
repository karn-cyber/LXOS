'use client';

import { useState, useMemo } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';

function money(n) {
    const v = Number(n || 0);
    return `₹${Math.abs(v).toLocaleString('en-IN')}`;
}

function csvCell(val) {
    const s = String(val ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function BudgetReport({ entities = [], semesters = [] }) {
    const [sem, setSem] = useState(semesters[semesters.length - 1] || '');

    const rows = useMemo(() => {
        return entities
            .filter(e => e.bySemester && e.bySemester[sem])
            .map(e => {
                const d = e.bySemester[sem];
                const allocated = d.allocated || 0;
                const used = d.spent || 0;
                return { name: e.name, type: e.type, allocated, used, remaining: allocated - used };
            })
            .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    }, [entities, sem]);

    const totals = useMemo(() => rows.reduce((t, r) => ({
        allocated: t.allocated + r.allocated,
        used: t.used + r.used,
        remaining: t.remaining + r.remaining,
    }), { allocated: 0, used: 0, remaining: 0 }), [rows]);

    const downloadCSV = () => {
        const header = ['Name', 'Type', 'Budget Allocated', 'Budget Used', 'Remaining', 'Status'];
        const body = rows.map(r => [
            r.name, r.type, r.allocated, r.used,
            // Over budget is shown as a negative remaining (with the leading "-").
            r.remaining,
            r.remaining < 0 ? 'OVER BUDGET' : 'Within budget',
        ]);
        body.push(['TOTAL', '', totals.allocated, totals.used, totals.remaining, totals.remaining < 0 ? 'OVER BUDGET' : 'Within budget']);
        const csv = [header, ...body].map(line => line.map(csvCell).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-report-${(sem || 'semester').replace(/\s+/g, '-').toLowerCase()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (semesters.length === 0) return null;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-zinc-400" /> Budget Report
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Allocation, usage and balance per club & clan for a semester.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={sem}
                        onChange={e => setSem(e.target.value)}
                        className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                    >
                        {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                        onClick={downloadCSV}
                        disabled={rows.length === 0}
                        className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-medium rounded-lg px-3 h-9 disabled:opacity-50"
                    >
                        <Download className="h-3.5 w-3.5" /> CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                        <tr>
                            <th className="text-left font-medium px-2 py-2">Name</th>
                            <th className="text-left font-medium px-2 py-2">Type</th>
                            <th className="text-right font-medium px-2 py-2">Allocated</th>
                            <th className="text-right font-medium px-2 py-2">Used</th>
                            <th className="text-right font-medium px-2 py-2">Remaining</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                        {rows.length === 0 ? (
                            <tr><td colSpan={5} className="px-2 py-6 text-center text-zinc-400 text-xs">No data for {sem}.</td></tr>
                        ) : rows.map((r, i) => (
                            <tr key={i}>
                                <td className="px-2 py-2 text-zinc-800 dark:text-zinc-200">{r.name}</td>
                                <td className="px-2 py-2 text-zinc-500">{r.type}</td>
                                <td className="px-2 py-2 text-right text-zinc-700 dark:text-zinc-300">{money(r.allocated)}</td>
                                <td className="px-2 py-2 text-right text-zinc-700 dark:text-zinc-300">{money(r.used)}</td>
                                <td className={`px-2 py-2 text-right font-semibold ${r.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {r.remaining < 0 ? `-${money(r.remaining)}` : money(r.remaining)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {rows.length > 0 && (
                        <tfoot className="border-t border-zinc-100 dark:border-zinc-800 font-semibold">
                            <tr>
                                <td className="px-2 py-2" colSpan={2}>Total</td>
                                <td className="px-2 py-2 text-right">{money(totals.allocated)}</td>
                                <td className="px-2 py-2 text-right">{money(totals.used)}</td>
                                <td className={`px-2 py-2 text-right ${totals.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {totals.remaining < 0 ? `-${money(totals.remaining)}` : money(totals.remaining)}
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
}
