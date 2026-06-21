'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Star, Users, Flag, Search, Trophy, Maximize2, X } from 'lucide-react';

const CATEGORY_COLORS = {
    Academic:  'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    Sports:    'text-green-600 bg-green-50 dark:bg-green-950/30',
    Cultural:  'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
    Technical: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30',
    Social:    'text-orange-600 bg-orange-50 dark:bg-orange-950/30',
    Other:     'text-zinc-500 bg-zinc-50 dark:bg-zinc-800',
};

// Who "did" an achievement: its named participants, else the person who logged it.
function doersOf(a) {
    if (a.participants?.length) return a.participants;
    if (a.createdBy?.name) return [a.createdBy.name];
    return [];
}

export default function AchievementsFeed({ items }) {
    const [search, setSearch] = useState('');

    // Per-person achievement counts (for the "who did how many" tracker).
    const contributors = useMemo(() => {
        const counts = {};
        items.forEach(a => doersOf(a).forEach(name => {
            const key = name.trim();
            if (key) counts[key] = (counts[key] || 0) + 1;
        }));
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [items]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter(a => {
            const hay = [
                a.title, a.description, a.category,
                a.createdBy?.name, a.clubId?.name, a.clanId?.name,
                ...(a.participants || []),
            ].filter(Boolean).join(' ').toLowerCase();
            return hay.includes(q);
        });
    }, [items, search]);

    return (
        <div className="space-y-5">
            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by person, title, club…"
                    className="w-full h-10 pl-9 pr-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Contributors tracker */}
            {contributors.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                    <p className="text-xs font-medium text-zinc-500 mb-2.5 flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5" /> Achievements by person — tap a name to filter
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {contributors.map(([name, count]) => (
                            <button
                                key={name}
                                onClick={() => setSearch(name)}
                                className="flex items-center gap-1.5 text-xs rounded-full border border-zinc-200 dark:border-zinc-700 pl-2.5 pr-1.5 py-1 hover:border-primary/50 transition-colors"
                            >
                                <span className="text-zinc-700 dark:text-zinc-300">{name}</span>
                                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full px-1.5 font-medium">{count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Feed */}
            {filtered.length === 0 ? (
                <div className="text-center py-14 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No achievements match “{search}”.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {filtered.map(a => {
                        const catStyle = CATEGORY_COLORS[a.category] || CATEGORY_COLORS.Other;
                        const cover = a.images?.[0];
                        return (
                            <Link key={a._id} href={`/dashboard/achievements/${a._id}`}>
                                <div className="group h-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col">
                                    {cover && (
                                        <div className="relative w-full h-44 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                            <img src={cover} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60" />
                                            <img src={cover} alt={a.title} className="relative w-full h-full object-contain" />
                                            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Maximize2 className="h-3 w-3" /> Open
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-4 flex-1 flex flex-col">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${catStyle}`}>{a.category}</span>
                                            {a.status === 'PENDING' && (
                                                <span className="text-[10px] font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-0.5 rounded-full">pending</span>
                                            )}
                                            {a.status === 'REJECTED' && (
                                                <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">rejected</span>
                                            )}
                                            {a.points > 0 && (
                                                <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
                                                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />{a.points} pts
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">{a.title}</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 flex-1">{a.description}</p>
                                        <div className="mt-3 pt-3 border-t border-zinc-50 dark:border-zinc-800 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
                                            {a.clubId?.name && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{a.clubId.name}</span>}
                                            {a.clanId?.name && <span className="flex items-center gap-1"><Flag className="h-3 w-3" />{a.clanId.name}</span>}
                                            {a.createdBy?.name && <span>· {a.createdBy.name}</span>}
                                            {a.achievedDate && <span>· {new Date(a.achievedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
