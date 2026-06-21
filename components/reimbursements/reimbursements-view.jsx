'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
    Receipt, ImageIcon, Search, ArrowUpDown, ArrowUp, ArrowDown,
    LayoutGrid, Table as TableIcon, X,
} from 'lucide-react';

const STATUS_STYLES = {
    APPROVED:  'text-green-600 bg-green-50 dark:bg-green-950/30',
    PENDING:   'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
    REJECTED:  'text-red-500 bg-red-50 dark:bg-red-950/30',
    PROCESSED: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
};

const STATUSES = ['PENDING', 'APPROVED', 'PROCESSED', 'REJECTED'];

function formatAmount(n) {
    return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// What the claim is grouped under: a linked event, else free-text purpose.
function groupOf(r) {
    return r.eventId?.title || r.purpose || 'General';
}

function personOf(r) {
    return r.submittedBy?.name || r.submittedBy?.email || 'Unknown';
}

export default function ReimbursementsView({ items, isReviewer }) {
    const [view, setView] = useState(isReviewer ? 'table' : 'list');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [groupFilter, setGroupFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [sortKey, setSortKey] = useState('date');
    const [sortDir, setSortDir] = useState('desc');

    const groups = useMemo(
        () => Array.from(new Set(items.map(groupOf))).sort((a, b) => a.localeCompare(b)),
        [items]
    );
    const categories = useMemo(
        () => Array.from(new Set(items.map(r => r.category).filter(Boolean))).sort(),
        [items]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let rows = items.filter(r => {
            if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
            if (groupFilter !== 'ALL' && groupOf(r) !== groupFilter) return false;
            if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
            if (q) {
                const haystack = [
                    personOf(r), r.title, r.purpose, r.eventId?.title,
                    r.category, r.bankDetails?.accountHolderName,
                ].filter(Boolean).join(' ').toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });

        const dir = sortDir === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) => {
            let av, bv;
            switch (sortKey) {
                case 'amount': av = a.amount; bv = b.amount; break;
                case 'person': av = personOf(a).toLowerCase(); bv = personOf(b).toLowerCase(); break;
                case 'title': av = (a.title || '').toLowerCase(); bv = (b.title || '').toLowerCase(); break;
                case 'group': av = groupOf(a).toLowerCase(); bv = groupOf(b).toLowerCase(); break;
                case 'status': av = a.status; bv = b.status; break;
                case 'date':
                default: av = new Date(a.expenseDate).getTime(); bv = new Date(b.expenseDate).getTime(); break;
            }
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
        });
        return rows;
    }, [items, search, statusFilter, groupFilter, categoryFilter, sortKey, sortDir]);

    const totalAmount = useMemo(() => filtered.reduce((s, r) => s + (r.amount || 0), 0), [filtered]);

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir(key === 'date' || key === 'amount' ? 'desc' : 'asc');
        }
    };

    const SortHeader = ({ label, k, className = '' }) => (
        <th className={`px-3 py-2 text-left font-medium text-zinc-500 select-none ${className}`}>
            <button onClick={() => toggleSort(k)} className="inline-flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200">
                {label}
                {sortKey === k
                    ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
                    : <ArrowUpDown className="h-3 w-3 opacity-40" />}
            </button>
        </th>
    );

    const hasFilters = statusFilter !== 'ALL' || groupFilter !== 'ALL' || categoryFilter !== 'ALL' || search.trim();

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={isReviewer ? 'Search by person, event, title…' : 'Search your requests…'}
                            className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                        />
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <button
                            onClick={() => setView('table')}
                            className={`flex items-center gap-1.5 px-3 h-9 text-xs font-medium ${view === 'table' ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-900 text-zinc-500'}`}
                        >
                            <TableIcon className="h-3.5 w-3.5" /> Table
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`flex items-center gap-1.5 px-3 h-9 text-xs font-medium ${view === 'list' ? 'bg-primary text-white' : 'bg-white dark:bg-zinc-900 text-zinc-500'}`}
                        >
                            <LayoutGrid className="h-3.5 w-3.5" /> List
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm">
                        <option value="ALL">All events / purposes</option>
                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm">
                        <option value="ALL">All statuses</option>
                        {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                    </select>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 text-sm">
                        <option value="ALL">All categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {hasFilters && (
                        <button
                            onClick={() => { setStatusFilter('ALL'); setGroupFilter('ALL'); setCategoryFilter('ALL'); setSearch(''); }}
                            className="h-9 px-2.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1"
                        >
                            <X className="h-3.5 w-3.5" /> Clear
                        </button>
                    )}
                    <span className="ml-auto text-xs text-zinc-400">
                        {filtered.length} of {items.length} · {formatAmount(totalAmount)}
                    </span>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-14 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No reimbursements match these filters.
                </div>
            ) : view === 'table' ? (
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-x-auto bg-white dark:bg-zinc-900">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs">
                            <tr>
                                {isReviewer && <SortHeader label="Person" k="person" />}
                                <SortHeader label="Title" k="title" />
                                <SortHeader label="Event / Purpose" k="group" />
                                <th className="px-3 py-2 text-left font-medium text-zinc-500">Category</th>
                                <SortHeader label="Date" k="date" />
                                <SortHeader label="Amount" k="amount" className="text-right" />
                                <SortHeader label="Status" k="status" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {filtered.map(r => (
                                <tr key={r._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                    {isReviewer && (
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <Link href={`/dashboard/files/${r._id}`} className="font-medium text-zinc-800 dark:text-zinc-200 hover:text-primary">
                                                {personOf(r)}
                                            </Link>
                                        </td>
                                    )}
                                    <td className="px-3 py-2.5 max-w-[220px]">
                                        <Link href={`/dashboard/files/${r._id}`} className="text-zinc-700 dark:text-zinc-300 hover:text-primary block truncate">
                                            {r.title}
                                            {r.bills?.length > 0 && (
                                                <span className="inline-flex items-center gap-0.5 ml-1 text-[10px] text-zinc-400">
                                                    <ImageIcon className="h-2.5 w-2.5" />{r.bills.length}
                                                </span>
                                            )}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-zinc-500">{groupOf(r)}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-zinc-500">{r.category}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-zinc-500">{formatDate(r.expenseDate)}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap text-right font-semibold text-zinc-900 dark:text-zinc-100">{formatAmount(r.amount)}</td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_STYLES[r.status]}`}>
                                            {r.status.toLowerCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-50 dark:divide-zinc-800">
                    {filtered.map(r => (
                        <Link key={r._id} href={`/dashboard/files/${r._id}`}>
                            <div className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <Receipt className="h-4 w-4 text-zinc-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{r.title}</p>
                                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                                        {isReviewer ? `${personOf(r)} · ` : ''}
                                        {groupOf(r)} · {r.category} · {formatDate(r.expenseDate)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${STATUS_STYLES[r.status]}`}>
                                        {r.status.toLowerCase()}
                                    </span>
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{formatAmount(r.amount)}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
