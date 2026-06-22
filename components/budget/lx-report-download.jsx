'use client';

import { useState } from 'react';
import { FileText, Download, Printer } from 'lucide-react';

// One combined, page-wise LX report (budgets, events, achievements,
// reimbursements, clan activity) for a chosen semester — downloaded as CSV.
export default function LxReportDownload({ semesters = [] }) {
    const [sem, setSem] = useState(semesters[semesters.length - 1] || '');
    const href = `/api/lx-report${sem ? `?semester=${encodeURIComponent(sem)}` : ''}`;
    const printHref = `/lx-report${sem ? `?semester=${encodeURIComponent(sem)}` : ''}`;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-zinc-400" /> LX Semester Report
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Everything in one file — summary, club &amp; clan budgets, events, achievements, reimbursements, and clan activity.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {semesters.length > 0 && (
                        <select
                            value={sem}
                            onChange={e => setSem(e.target.value)}
                            className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                        >
                            {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                    <a
                        href={printHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium rounded-lg px-3 h-9 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                        <Printer className="h-3.5 w-3.5" /> Print / PDF
                    </a>
                    <a
                        href={href}
                        className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-medium rounded-lg px-3 h-9 hover:bg-primary/90"
                    >
                        <Download className="h-3.5 w-3.5" /> CSV
                    </a>
                </div>
            </div>
        </div>
    );
}
