import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Expense from '@/models/Expense';
import { getDashboardSession } from '@/lib/dashboard-session';

async function getBudgetData() {
    await dbConnect();
    const [clubs, clans, expenses] = await Promise.all([
        Club.find({ isActive: true }).select('name budgetAllocated budgetSpent category').lean(),
        Clan.find().select('name budgetAllocated budgetSpent color').lean(),
        Expense.find({ status: 'APPROVED' }).select('amount category').lean(),
    ]);

    const sum = (arr, key) => arr.reduce((a, x) => a + (x[key] || 0), 0);

    const expensesByCategory = expenses.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {});

    return {
        clubs: JSON.parse(JSON.stringify(clubs)),
        clans: JSON.parse(JSON.stringify(clans)),
        totals: {
            clubAllocated: sum(clubs, 'budgetAllocated'),
            clubSpent: sum(clubs, 'budgetSpent'),
            clanAllocated: sum(clans, 'budgetAllocated'),
            clanSpent: sum(clans, 'budgetSpent'),
            expenses: sum(expenses, 'amount'),
        },
        expensesByCategory,
    };
}

function Bar({ pct }) {
    return (
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
            />
        </div>
    );
}

function BudgetSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="grid gap-3 md:grid-cols-2">
                {[1,2].map(i => <div key={i} className="h-48 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

async function BudgetContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');
    if (!['ADMIN', 'FINANCE'].includes(session.user.role)) redirect('/dashboard');

    const { clubs, clans, totals, expensesByCategory } = await getBudgetData();

    const overallAllocated = totals.clubAllocated + totals.clanAllocated;
    const overallSpent = totals.clubSpent + totals.clanSpent;
    const overallPct = overallAllocated > 0 ? (overallSpent / overallAllocated) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Budget</h1>
                <p className="text-sm text-zinc-400 mt-1">
                    ₹{overallAllocated.toLocaleString()} total · {overallPct.toFixed(1)}% utilised
                </p>
            </div>

            {/* Summary strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total allocated', value: `₹${overallAllocated.toLocaleString()}` },
                    { label: 'Total spent', value: `₹${overallSpent.toLocaleString()}` },
                    { label: 'Remaining', value: `₹${(overallAllocated - overallSpent).toLocaleString()}` },
                    { label: 'Approved expenses', value: `₹${totals.expenses.toLocaleString()}` },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
                    </div>
                ))}
            </div>

            {/* Breakdown */}
            <div className="grid gap-5 md:grid-cols-2">
                {/* Clubs */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Clubs</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            ₹{totals.clubAllocated.toLocaleString()} allocated · ₹{totals.clubSpent.toLocaleString()} spent
                        </p>
                    </div>
                    <div className="space-y-4">
                        {clubs.map(club => {
                            const pct = club.budgetAllocated > 0 ? (club.budgetSpent / club.budgetAllocated) * 100 : 0;
                            const left = club.budgetAllocated - club.budgetSpent;
                            return (
                                <div key={club._id} className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{club.name}</span>
                                        <span className={left < 0 ? 'text-red-400' : 'text-zinc-400'}>
                                            ₹{Math.max(0, left).toLocaleString()} left · {pct.toFixed(0)}%
                                        </span>
                                    </div>
                                    <Bar pct={pct} />
                                </div>
                            );
                        })}
                        {clubs.length === 0 && <p className="text-xs text-zinc-400">No clubs.</p>}
                    </div>
                </div>

                {/* Clans */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Clans</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            ₹{totals.clanAllocated.toLocaleString()} allocated · ₹{totals.clanSpent.toLocaleString()} spent
                        </p>
                    </div>
                    <div className="space-y-4">
                        {clans.map(clan => {
                            const pct = clan.budgetAllocated > 0 ? (clan.budgetSpent / clan.budgetAllocated) * 100 : 0;
                            const left = clan.budgetAllocated - clan.budgetSpent;
                            return (
                                <div key={clan._id} className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${clan.color || 'bg-zinc-400'}`} />
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{clan.name}</span>
                                        </div>
                                        <span className={left < 0 ? 'text-red-400' : 'text-zinc-400'}>
                                            ₹{Math.max(0, left).toLocaleString()} · {pct.toFixed(0)}%
                                        </span>
                                    </div>
                                    <Bar pct={pct} />
                                </div>
                            );
                        })}
                        {clans.length === 0 && <p className="text-xs text-zinc-400">No clans.</p>}
                    </div>
                </div>
            </div>

            {/* Expense categories */}
            {Object.keys(expensesByCategory).length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Expenses by category</h2>
                        <p className="text-xs text-zinc-400 mt-0.5">Approved claims breakdown</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {Object.entries(expensesByCategory)
                            .sort(([, a], [, b]) => b - a)
                            .map(([cat, amount]) => {
                                const pct = totals.expenses > 0 ? (amount / totals.expenses) * 100 : 0;
                                return (
                                    <div key={cat} className="space-y-1.5">
                                        <div className="flex justify-between text-xs">
                                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{cat}</span>
                                            <span className="text-zinc-400">₹{amount.toLocaleString()} · {pct.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BudgetPage() {
    return (
        <Suspense fallback={<BudgetSkeleton />}>
            <BudgetContent />
        </Suspense>
    );
}
