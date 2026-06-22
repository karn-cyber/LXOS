'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, X, UserPlus, Search, Flag, Users, Shield } from 'lucide-react';

// Searchable RU-directory picker. Calls back with the chosen { email, name }.
function AddPicker({ onPick, placeholder }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const timer = useRef(null);

    useEffect(() => {
        if (!open) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/ru-users?q=${encodeURIComponent(q)}`);
                const data = res.ok ? await res.json() : [];
                setResults(Array.isArray(data) ? data : []);
            } catch {
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 250);
        return () => clearTimeout(timer.current);
    }, [q, open]);

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
                <UserPlus className="h-3.5 w-3.5" /> Add person
            </button>
        );
    }

    return (
        <div className="relative w-full max-w-sm">
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={placeholder || 'Search name or email…'}
                    className="w-full h-9 pl-8 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
                <button onClick={() => { setOpen(false); setQ(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
                {loading ? (
                    <div className="p-3 text-xs text-zinc-400 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…</div>
                ) : results.length === 0 ? (
                    <div className="p-3 text-xs text-zinc-400">No matches.</div>
                ) : (
                    results.map((u) => (
                        <button
                            key={u.email}
                            onClick={() => { onPick(u); setOpen(false); setQ(''); }}
                            className="w-full text-left px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                        >
                            <p className="text-sm text-zinc-800 dark:text-zinc-200">{u.name}</p>
                            <p className="text-[11px] text-zinc-400">{u.email}{u.userType ? ` · ${u.userType}` : ''}</p>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

function HeadChip({ name, email, onRemove, busy }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 pl-2.5 pr-1 py-1 text-xs">
            <span className="text-zinc-700 dark:text-zinc-300">{name || email}</span>
            <button onClick={onRemove} disabled={busy} className="h-4 w-4 rounded-full hover:bg-red-100 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-500 flex items-center justify-center">
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </button>
        </span>
    );
}

export default function AccessManager() {
    const [data, setData] = useState(null);
    const [busyKey, setBusyKey] = useState(null);
    const [error, setError] = useState('');

    const load = async () => {
        try {
            const res = await fetch('/api/access');
            const d = res.ok ? await res.json() : null;
            setData(d);
        } catch {
            setData(null);
        }
    };
    useEffect(() => { load(); }, []);

    const mutate = async (method, payload, key) => {
        setBusyKey(key);
        setError('');
        try {
            const res = await fetch('/api/access', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Action failed');
            }
            await load();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusyKey(null);
        }
    };

    const assign = (payload, key) => mutate('POST', payload, key);
    const remove = (payload, key) => mutate('DELETE', payload, key);

    if (!data) {
        return <div className="flex items-center gap-2 text-sm text-zinc-400 py-10"><Loader2 className="h-4 w-4 animate-spin" /> Loading access…</div>;
    }

    const EntitySection = ({ title, icon: Icon, items, type, idKey }) => (
        <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <Icon className="h-4 w-4 text-zinc-400" /> {title}
            </h2>
            <div className="space-y-2">
                {items.map((it) => (
                    <div key={it._id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{it.name}</span>
                            <AddPicker
                                onPick={(u) => assign({ email: u.email, name: u.name, type, [idKey]: it._id }, `${type}-${it._id}-add`)}
                            />
                        </div>
                        {it.heads.length === 0 ? (
                            <p className="text-xs text-zinc-400">No one assigned yet.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {it.heads.map((h) => (
                                    <HeadChip
                                        key={h._id}
                                        name={h.name}
                                        email={h.email}
                                        busy={busyKey === `${type}-${h.email}`}
                                        onRemove={() => remove({ email: h.email, type }, `${type}-${h.email}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 max-w-3xl">
            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}

            <EntitySection title="Club Heads" icon={Users} items={data.clubs} type="club" idKey="clubId" />
            <EntitySection title="Clan Heads" icon={Flag} items={data.clans} type="clan" idKey="clanId" />

            {/* LX team */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-zinc-400" /> LX Team
                </h2>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-xs text-zinc-400">Members can review, approve, and see budgets.</span>
                        <AddPicker onPick={(u) => assign({ email: u.email, name: u.name, type: 'lx' }, 'lx-add')} />
                    </div>
                    {data.lxMembers.length === 0 ? (
                        <p className="text-xs text-zinc-400">No LX members yet.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {data.lxMembers.map((m) => (
                                <HeadChip
                                    key={m._id}
                                    name={m.name}
                                    email={m.email}
                                    busy={busyKey === `lx-${m.email}`}
                                    onRemove={() => remove({ email: m.email, type: 'lx' }, `lx-${m.email}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
