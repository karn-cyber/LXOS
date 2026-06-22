'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, Plus, Loader2, Calendar, Trash2 } from 'lucide-react';

const STATUS_STYLES = {
    PLANNING:  'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
    ACTIVE:    'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    COMPLETED: 'text-green-600 bg-green-50 dark:bg-green-950/30',
};

export default function ClanInitiatives({ clan, canEdit }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', semester: clan.semester || '', status: 'ACTIVE' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/initiatives?clanId=${clan._id}`);
            const data = res.ok ? await res.json() : [];
            setItems(Array.isArray(data) ? data : []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [clan._id]);

    useEffect(() => { load(); }, [load]);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.title.trim()) { setError('Enter a title.'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/initiatives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, clanId: clan._id }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create');
            }
            setForm({ title: '', description: '', semester: clan.semester || '', status: 'ACTIVE' });
            setShowForm(false);
            setLoading(true);
            load();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const removeItem = async (id) => {
        try {
            const res = await fetch(`/api/initiatives?id=${id}`, { method: 'DELETE' });
            if (res.ok) { setLoading(true); load(); }
        } catch { /* noop */ }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" /> {clan.name} Initiatives
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">Projects and drives run by the clan.</p>
                </div>
                {canEdit && (
                    <Button size="sm" onClick={() => setShowForm(v => !v)}>
                        <Plus className="h-4 w-4 mr-1.5" /> {showForm ? 'Close' : 'New Initiative'}
                    </Button>
                )}
            </div>

            {canEdit && showForm && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Add an initiative</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-3">
                            <Input placeholder="Title (e.g. Cleanliness Drive)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                            <Textarea placeholder="Describe the initiative…" className="min-h-20 resize-none" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input placeholder="Semester (e.g. Holi 2026)" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} />
                                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm">
                                    <option value="PLANNING">Planning</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                            <Button type="submit" disabled={saving} size="sm">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save initiative'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12 text-sm text-zinc-400 gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : items.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-zinc-400">
                        <Lightbulb className="h-10 w-10 mb-3 opacity-50" />
                        <p className="text-sm">No initiatives yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {items.map(it => (
                        <Card key={it._id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{it.title}</h3>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[it.status] || ''}`}>{it.status?.toLowerCase()}</span>
                                        {canEdit && (
                                            <button onClick={() => removeItem(it._id)} className="text-zinc-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                                        )}
                                    </div>
                                </div>
                                {it.description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-3">{it.description}</p>}
                                <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
                                    {it.semester && <span className="bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{it.semester}</span>}
                                    {it.date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(it.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
