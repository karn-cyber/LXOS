import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Expense from '@/models/Expense';
import Event from '@/models/Event';
import User from '@/models/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

async function getExpenses() {
    await dbConnect();

    const expenses = await Expense.find()
        .sort({ createdAt: -1 })
        .populate('eventId', 'title type')
        .populate('submittedBy', 'name email')
        .populate('verifiedBy', 'name email')
        .lean();

    // Deep serialization helper for Mongo objects
    const serialize = (obj) => {
        if (!obj) return null;
        return JSON.parse(JSON.stringify(obj));
    };

    return serialize(expenses);
}

export default async function ExpensesPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const expenses = await getExpenses();

    // Filter based on role
    const filteredExpenses = session.user.role === 'CLUB_HEAD'
        ? expenses.filter(e => e.submittedBy?._id === session.user.id)
        : expenses;

    const canCreateExpense = ['ADMIN', 'LX_TEAM', 'CLUB_HEAD'].includes(session.user.role);
    const canVerify = ['ADMIN', 'FINANCE'].includes(session.user.role);

    // Calculate totals
    const totals = filteredExpenses.reduce((acc, expense) => {
        acc[expense.status] = (acc[expense.status] || 0) + expense.amount;
        acc.total += expense.amount;
        return acc;
    }, { PENDING: 0, APPROVED: 0, REJECTED: 0, total: 0 });

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Expenses</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Track and audit the <span className="text-blue-600 font-bold italic">Financial</span> Flow of all events.
                    </p>
                </div>
                {canCreateExpense && (
                    <Link href="/dashboard/expenses/create">
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Plus className="h-5 w-5 mr-3" />
                            Log New Expense
                        </Button>
                    </Link>
                )}
            </div>

            {/* Stats Area */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="border-none shadow-xl shadow-zinc-200/40 dark:shadow-none bg-white dark:bg-zinc-900 overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-zinc-500">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Volume</p>
                                <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">₹{totals.total.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-zinc-400 border-t border-zinc-50 dark:border-zinc-800 pt-4">
                            Across {filteredExpenses.length} entries
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-zinc-200/40 dark:shadow-none bg-white dark:bg-zinc-900 overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-2xl text-yellow-600">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Awaiting</p>
                                <p className="text-2xl font-black text-yellow-600">₹{totals.PENDING.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-zinc-400 border-t border-zinc-50 dark:border-zinc-800 pt-4">
                            {filteredExpenses.filter(e => e.status === 'PENDING').length} pending review
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-zinc-200/40 dark:shadow-none bg-white dark:bg-zinc-900 overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-2xl text-green-600">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Settled</p>
                                <p className="text-2xl font-black text-green-600">₹{totals.APPROVED.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-zinc-400 border-t border-zinc-50 dark:border-zinc-800 pt-4">
                            {filteredExpenses.filter(e => e.status === 'APPROVED').length} approved claims
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-zinc-200/40 dark:shadow-none bg-white dark:bg-zinc-900 overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl text-red-600">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rejected</p>
                                <p className="text-2xl font-black text-red-600">₹{totals.REJECTED.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-zinc-400 border-t border-zinc-50 dark:border-zinc-800 pt-4">
                            {filteredExpenses.filter(e => e.status === 'REJECTED').length} denied entries
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expenses Directory */}
            {filteredExpenses.length === 0 ? (
                <Card className="border-none bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center py-24">
                        <div className="bg-white dark:bg-zinc-800 h-20 w-20 rounded-3xl shadow-xl flex items-center justify-center mb-6">
                            <FileText className="h-10 w-10 text-zinc-300" />
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8 font-medium">
                            No financial records found in the directory.
                        </p>
                        {canCreateExpense && (
                            <Link href="/dashboard/expenses/create">
                                <Button className="bg-primary text-white font-bold px-6 py-5 rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Log First Expense
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-none shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-910">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-800 pb-6 px-8 pt-8">
                        <div>
                            <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
                            <p className="text-xs text-zinc-400 font-medium mt-1">Audit log of all event expenditures</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                            {filteredExpenses.map((expense) => (
                                <Link
                                    key={expense._id}
                                    href={`/dashboard/expenses/${expense._id}`}
                                    className="flex items-center justify-between p-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-all duration-200 group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg
                                            ${expense.status === 'APPROVED' ? 'bg-green-100 text-green-600' : ''}
                                            ${expense.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' : ''}
                                            ${expense.status === 'REJECTED' ? 'bg-red-100 text-red-600' : ''}
                                        `}>
                                            {expense.status === 'APPROVED' && <CheckCircle className="h-6 w-6" />}
                                            {expense.status === 'PENDING' && <Clock className="h-6 w-6" />}
                                            {expense.status === 'REJECTED' && <XCircle className="h-6 w-6" />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-primary transition-colors">{expense.title}</h3>
                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase tracking-tighter border border-zinc-200 dark:border-zinc-700">
                                                    {expense.category}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-zinc-500 truncate">
                                                    {expense.eventId?.title || 'General Expense'}
                                                </span>
                                                <span className="text-zinc-300">•</span>
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                                    {expense.submittedBy?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 ml-4">
                                        <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 group-hover:scale-105 transition-transform">
                                            ₹{expense.amount.toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {expense.bills?.length > 0 && (
                                                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                                    {expense.bills.length} Bill{expense.bills.length > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <span className="text-[10px] font-medium text-zinc-400">
                                                {new Date(expense.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
