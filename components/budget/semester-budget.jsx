'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, History } from 'lucide-react';

function money(n) {
    return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default function SemesterBudget({
    entityType, entityId, semester, budgetAllocated, budgetSpent, budgetHistory = [], isAdmin = false,
}) {
    const router = useRouter();
    const [selected, setSelected] = useState('current');
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ semester: '', budgetAllocated: '', budgetSpent: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const current = { semester, budgetAllocated: budgetAllocated || 0, budgetSpent: budgetSpent || 0 };
    const view = selected === 'current'
        ? current
        : (budgetHistory.find(h => h.semester === selected) || current);

    const allocated = view.budgetAllocated || 0;
    const spent = view.budgetSpent || 0;
    const remaining = allocated - spent;
    const pct = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;

    const save = async () => {
        setError('');
        if (!form.semester.trim()) { setError('Enter a semester name.'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/budget-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityType, entityId,
                    semester: form.semester.trim(),
                    budgetAllocated: Number(form.budgetAllocated) || 0,
                    budgetSpent: Number(form.budgetSpent) || 0,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save');
            }
            setForm({ semester: '', budgetAllocated: '', budgetSpent: '' });
            setShowAdd(false);
            router.refresh();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <History className="h-4 w-4 text-zinc-400" /> Budget by Semester
                </h3>
                <select
                    value={selected}
                    onChange={e => setSelected(e.target.value)}
                    className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                >
                    <option value="current">{current.semester} (current)</option>
                    {budgetHistory.map(h => (
                        <option key={h.semester} value={h.semester}>{h.semester}</option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3">
                    <p className="text-[11px] text-zinc-400">Allocated</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{money(allocated)}</p>
                </div>
                <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3">
                    <p className="text-[11px] text-zinc-400">Spent</p>
                    <p className="text-xl font-bold text-red-600">{money(spent)}</p>
                </div>
                <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3">
                    <p className="text-[11px] text-zinc-400">Remaining</p>
                    <p className={`text-xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>{money(remaining)}</p>
                </div>
            </div>

            <div>
                <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>{pct.toFixed(0)}% used</span>
                    {selected !== 'current' && <span>past semester</span>}
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-yellow-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
                </div>
            </div>

            {isAdmin && (
                <div className="pt-3 border-t border-zinc-50 dark:border-zinc-800">
                    {!showAdd ? (
                        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                            <Plus className="h-3.5 w-3.5" /> Add a past semester record
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                    value={form.semester}
                                    onChange={e => setForm({ ...form, semester: e.target.value })}
                                    placeholder="Semester (e.g. Fall 2025)"
                                    className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                                />
                                <input
                                    type="number" min="0"
                                    value={form.budgetAllocated}
                                    onChange={e => setForm({ ...form, budgetAllocated: e.target.value })}
                                    placeholder="Allocated ₹"
                                    className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                                />
                                <input
                                    type="number" min="0"
                                    value={form.budgetSpent}
                                    onChange={e => setForm({ ...form, budgetSpent: e.target.value })}
                                    placeholder="Spent ₹"
                                    className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm"
                                />
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <div className="flex gap-2">
                                <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-medium rounded-lg px-3 h-8">
                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                                </button>
                                <button onClick={() => { setShowAdd(false); setError(''); }} className="text-xs text-zinc-500 px-2">Cancel</button>
                            </div>
                            <p className="text-[11px] text-zinc-400">Re-entering an existing semester name updates it.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
