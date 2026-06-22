'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CalendarClock } from 'lucide-react';

// Admin/LX control to close the current semester and open a new one. Archives
// every club/clan's current budget into history, then makes the new semester
// active (the term budget is deducted from going forward).
export default function SemesterRollover({ currentSemesters = [] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [resetAllocation, setResetAllocation] = useState(false);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    const run = async () => {
        setError(''); setMsg('');
        if (!name.trim()) { setError('Enter the new semester name.'); return; }
        setBusy(true);
        try {
            const res = await fetch('/api/semester-rollover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newSemester: name.trim(), resetAllocation }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setMsg(`Rolled over ${data.updated} club/clan budgets to “${data.semester}”.`);
            setName('');
            router.refresh();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-zinc-400" /> Semester
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Active term{currentSemesters.length ? `: ${[...new Set(currentSemesters)].join(', ')}` : ''}. New events &amp; claims are deducted from the active term.
                    </p>
                </div>
                {!open && (
                    <button onClick={() => setOpen(true)} className="text-xs font-medium text-primary hover:underline shrink-0">
                        Start new semester
                    </button>
                )}
            </div>

            {open && (
                <div className="mt-3 space-y-2 pt-3 border-t border-zinc-50 dark:border-zinc-800">
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="New semester (e.g. Diwali 2026)"
                        className="w-full sm:max-w-xs h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                    />
                    <label className="flex items-center gap-2 text-xs text-zinc-500">
                        <input type="checkbox" checked={resetAllocation} onChange={e => setResetAllocation(e.target.checked)} className="accent-primary" />
                        Reset allocations to ₹0 (otherwise keep current allocations, spent resets to 0)
                    </label>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    {msg && <p className="text-xs text-green-600">{msg}</p>}
                    <div className="flex gap-2">
                        <button onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-medium rounded-lg px-3 h-8">
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Close current & start new'}
                        </button>
                        <button onClick={() => { setOpen(false); setError(''); setMsg(''); }} className="text-xs text-zinc-500 px-2">Cancel</button>
                    </div>
                    <p className="text-[11px] text-zinc-400">This archives every club &amp; clan&apos;s current budget into history first.</p>
                </div>
            )}
        </div>
    );
}
