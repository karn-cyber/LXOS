import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { getDashboardSession } from '@/lib/dashboard-session';

async function getExpenses() {
    await dbConnect();
    const expenses = await Expense.find()
        .sort({ createdAt: -1 })
        .populate('eventId', 'title type')
        .populate('submittedBy', 'name email')
        .lean();
    return JSON.parse(JSON.stringify(expenses));
}

const STATUS_STYLES = {
    APPROVED: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    PENDING:  'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30',
    REJECTED: 'text-red-500 bg-red-50 dark:bg-red-950/30',
};

function ExpensesSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
            <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-16 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

async function ExpensesContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    const expenses = await getExpenses();

    const filteredExpenses = session.user.role === 'CLUB_HEAD'
        ? expenses.filter(e => e.submittedBy?._id === session.user.id)
        : expenses;

    const canCreateExpense = ['ADMIN', 'LX_TEAM', 'CLUB_HEAD'].includes(session.user.role);

    const totals = filteredExpenses.reduce((acc, e) => {
        acc[e.status] = (acc[e.status] || 0) + e.amount;
        acc.total += e.amount;
        return acc;
    }, { PENDING: 0, APPROVED: 0, REJECTED: 0, total: 0 });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Expenses</h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        {filteredExpenses.length} entries · ₹{totals.total.toLocaleString()} total
                    </p>
                </div>
                {canCreateExpense && (
                    <Link href="/dashboard/expenses/create">
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl font-medium flex items-center gap-1.5 h-9">
                            <Plus className="h-3.5 w-3.5" />
                            Log Expense
                        </Button>
                    </Link>
                )}
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total volume', value: `₹${totals.total.toLocaleString()}` },
                    { label: 'Pending', value: `₹${totals.PENDING.toLocaleString()}` },
                    { label: 'Approved', value: `₹${totals.APPROVED.toLocaleString()}` },
                    { label: 'Rejected', value: `₹${totals.REJECTED.toLocaleString()}` },
                ].map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4">
                        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{label}</div>
                    </div>
                ))}
            </div>

            {/* List */}
            {filteredExpenses.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No expenses logged yet.
                    {canCreateExpense && (
                        <Link href="/dashboard/expenses/create" className="block mt-2 text-primary text-xs hover:underline">
                            Log the first expense →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-50 dark:divide-zinc-800">
                    {filteredExpenses.map(expense => {
                        const statusStyle = STATUS_STYLES[expense.status] || STATUS_STYLES.PENDING;
                        return (
                            <Link
                                key={expense._id}
                                href={`/dashboard/expenses/${expense._id}`}
                                className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{expense.title}</p>
                                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                        {expense.submittedBy?.name || '—'}
                                        {expense.eventId && ` · ${expense.eventId.title}`}
                                        {expense.category && ` · ${expense.category}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusStyle}`}>
                                        {expense.status.toLowerCase()}
                                    </span>
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        ₹{expense.amount.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-zinc-400">
                                        {new Date(expense.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ExpensesPage() {
    return (
        <Suspense fallback={<ExpensesSkeleton />}>
            <ExpensesContent />
        </Suspense>
    );
}
