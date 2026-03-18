import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import Clan from '@/models/Clan';
import Event from '@/models/Event';
import Expense from '@/models/Expense';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

async function getBudgetData() {
    await dbConnect();

    // Get all clubs with budget info
    const clubs = await Club.find({ isActive: true })
        .select('name budgetAllocated budgetSpent category')
        .lean();

    // Get all clans with budget info
    const clans = await Clan.find()
        .select('name budgetAllocated budgetSpent color')
        .lean();

    // Get total event budgets
    const events = await Event.find({ status: { $in: ['APPROVED', 'COMPLETED'] } })
        .select('budgetAllocated budgetSpent type')
        .lean();

    // Get total expenses
    const expenses = await Expense.find({ status: 'APPROVED' })
        .select('amount category')
        .lean();

    // Calculate totals
    const clubsTotal = clubs.reduce((acc, club) => ({
        allocated: acc.allocated + club.budgetAllocated,
        spent: acc.spent + club.budgetSpent,
    }), { allocated: 0, spent: 0 });

    const clansTotal = clans.reduce((acc, clan) => ({
        allocated: acc.allocated + clan.budgetAllocated,
        spent: acc.spent + clan.budgetSpent,
    }), { allocated: 0, spent: 0 });

    const eventsTotal = events.reduce((acc, event) => ({
        allocated: acc.allocated + event.budgetAllocated,
        spent: acc.spent + event.budgetSpent,
    }), { allocated: 0, spent: 0 });

    const expensesTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    return {
        clubs: clubs.map(c => ({ ...c, _id: c._id.toString() })),
        clans: clans.map(c => ({ ...c, _id: c._id.toString() })),
        totals: {
            clubs: clubsTotal,
            clans: clansTotal,
            events: eventsTotal,
            expenses: expensesTotal,
            overall: {
                allocated: clubsTotal.allocated + clansTotal.allocated,
                spent: clubsTotal.spent + clansTotal.spent,
            },
        },
        expensesByCategory,
    };
}

export default async function BudgetPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    // Only admin and finance can view budget dashboard
    if (session.user.role !== 'ADMIN' && session.user.role !== 'FINANCE') {
        redirect('/dashboard');
    }

    const budgetData = await getBudgetData();
    const { totals, clubs, clans, expensesByCategory } = budgetData;

    const overallRemaining = totals.overall.allocated - totals.overall.spent;
    const overallPercentage = totals.overall.allocated > 0
        ? (totals.overall.spent / totals.overall.allocated) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Budget Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Global budget overview and financial tracking
                </p>
            </div>

            {/* Overall Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
                        <DollarSign className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totals.overall.allocated.toLocaleString()}</div>
                        <p className="text-xs text-zinc-500 mt-1">Across all clubs and clans</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            ₹{totals.overall.spent.toLocaleString()}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{overallPercentage.toFixed(1)}% of total</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            ₹{overallRemaining.toLocaleString()}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{(100 - overallPercentage).toFixed(1)}% available</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <AlertCircle className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totals.expenses.toLocaleString()}</div>
                        <p className="text-xs text-zinc-500 mt-1">Approved expenses</p>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Breakdown */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Clubs Budget */}
                <Card>
                    <CardHeader>
                        <CardTitle>Clubs Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                                <span className="font-medium">Total</span>
                                <div className="text-right">
                                    <div className="font-bold">₹{totals.clubs.allocated.toLocaleString()}</div>
                                    <div className="text-sm text-red-600 dark:text-red-400">
                                        -₹{totals.clubs.spent.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {clubs.map((club) => {
                                    const remaining = club.budgetAllocated - club.budgetSpent;
                                    const percentage = club.budgetAllocated > 0
                                        ? (club.budgetSpent / club.budgetAllocated) * 100
                                        : 0;

                                    return (
                                        <div key={club._id} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{club.name}</span>
                                                <span className="text-zinc-500">
                                                    ₹{remaining.toLocaleString()} left
                                                </span>
                                            </div>
                                            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${percentage > 90 ? 'bg-red-500' :
                                                            percentage > 70 ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-500">{percentage.toFixed(1)}% used</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Clans Budget */}
                <Card>
                    <CardHeader>
                        <CardTitle>Clans Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                                <span className="font-medium">Total</span>
                                <div className="text-right">
                                    <div className="font-bold">₹{totals.clans.allocated.toLocaleString()}</div>
                                    <div className="text-sm text-red-600 dark:text-red-400">
                                        -₹{totals.clans.spent.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {clans.map((clan) => {
                                    const remaining = clan.budgetAllocated - clan.budgetSpent;
                                    const percentage = clan.budgetAllocated > 0
                                        ? (clan.budgetSpent / clan.budgetAllocated) * 100
                                        : 0;

                                    return (
                                        <div key={clan._id} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-3 w-3 rounded-lg"
                                                        style={{ backgroundColor: clan.color }}
                                                    />
                                                    <span className="font-medium">{clan.name}</span>
                                                </div>
                                                <span className="text-zinc-500">
                                                    ₹{remaining.toLocaleString()} left
                                                </span>
                                            </div>
                                            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
                                                <div
                                                    className="h-full transition-all"
                                                    style={{
                                                        width: `${Math.min(percentage, 100)}%`,
                                                        backgroundColor: clan.color,
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-500">{percentage.toFixed(1)}% used</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses by Category */}
            {Object.keys(expensesByCategory).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Expenses by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {Object.entries(expensesByCategory)
                                .sort(([, a], [, b]) => b - a)
                                .map(([category, amount]) => {
                                    const percentage = (amount / totals.expenses) * 100;
                                    return (
                                        <div key={category} className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{category}</span>
                                                <span className="text-zinc-500">
                                                    ₹{amount.toLocaleString()} ({percentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
