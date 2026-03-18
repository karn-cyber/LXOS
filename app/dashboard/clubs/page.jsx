import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, TrendingDown, Plus } from 'lucide-react';
import Link from 'next/link';
import ClubActions from '@/components/clubs/club-actions';

async function getClubs() {
    await dbConnect();

    const clubs = await Club.find({ isActive: true })
        .sort({ name: 1 })
        .lean();

    // Deep serialization helper for Mongo objects
    const serialize = (obj) => {
        if (!obj) return null;
        return JSON.parse(JSON.stringify(obj));
    };

    return serialize(clubs);
}

export default async function ClubsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const clubs = await getClubs();

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-accent"></div>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Clubs</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
                        Explore the vibrant <span className="text-accent font-bold italic">Communities</span> and Societies.
                    </p>
                </div>
                {session.user.role === 'ADMIN' && (
                    <Link href="/dashboard/clubs/create">
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                            <Plus className="h-5 w-5 mr-3" />
                            Establish New Club
                        </Button>
                    </Link>
                )}
            </div>

            {/* Total Count Area */}
            <div className="flex items-center gap-3 ml-2">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{clubs.length} Active Organizations</span>
            </div>

            {/* Clubs Grid */}
            {clubs.length === 0 ? (
                <Card className="border-none bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl">
                    <CardContent className="flex flex-col items-center justify-center py-24">
                        <div className="bg-white dark:bg-zinc-800 h-20 w-20 rounded-3xl shadow-xl flex items-center justify-center mb-6">
                            <Users className="h-10 w-10 text-zinc-300" />
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-center mb-8 font-medium">
                            No organizations found in the directory.
                        </p>
                        {session.user.role === 'ADMIN' && (
                            <Link href="/dashboard/clubs/create">
                                <Button className="bg-primary text-white font-bold px-6 py-5 rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Club
                                </Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {clubs.map((club) => {
                        const budgetRemaining = club.budgetAllocated - club.budgetSpent;
                        const budgetUsedPercentage = club.budgetAllocated > 0
                            ? (club.budgetSpent / club.budgetAllocated) * 100
                            : 0;

                        return (
                            <Link key={club._id} href={`/dashboard/clubs/${club._id}`} className="group h-full">
                                <Card className="h-full border-none shadow-xl shadow-zinc-200/40 dark:shadow-none bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden hover:translate-y-[-8px] transition-all duration-300 relative">
                                    <div className="absolute top-4 right-4 z-10">
                                        {session.user.role === 'ADMIN' ? (
                                            <div className="flex items-center gap-2">
                                                <ClubActions clubId={club._id} clubName={club.name} />
                                            </div>
                                        ) : (
                                            <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                                                <Users className="h-4 w-4 text-zinc-400" />
                                            </div>
                                        )}
                                    </div>

                                    <CardHeader className="pt-8 px-8">
                                        <div className="flex flex-col gap-2">
                                            <div className="inline-flex items-center self-start px-2 py-0.5 rounded-lg bg-secondary text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                                                {club.category}
                                            </div>
                                            <CardTitle className="text-2xl font-black text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors leading-tight">
                                                {club.name}
                                            </CardTitle>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="px-8 pb-8 space-y-8">
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-3 leading-relaxed h-[4.5em]">
                                            {club.description}
                                        </p>

                                        {/* Budget Visualizer */}
                                        <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/40 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                            <div className="flex items-center justify-between">
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Spent</p>
                                                    <p className="text-sm font-black text-red-500">₹{club.budgetSpent.toLocaleString()}</p>
                                                </div>
                                                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700"></div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Balance</p>
                                                    <p className="text-sm font-black text-green-500">₹{Math.max(0, budgetRemaining).toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="h-2 bg-white dark:bg-zinc-900 rounded-full overflow-hidden shadow-inner flex items-center p-0.5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000
                                                            ${budgetUsedPercentage > 90
                                                                ? 'bg-red-500'
                                                                : budgetUsedPercentage > 70
                                                                    ? 'bg-yellow-500'
                                                                    : 'bg-primary'
                                                            }`}
                                                        style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center px-0.5">
                                                    <span className="text-[10px] font-bold text-zinc-400">Total: ₹{club.budgetAllocated.toLocaleString()}</span>
                                                    <span className="text-[10px] font-black text-primary">{budgetUsedPercentage.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {[1, 2, 3].map((i) => (
                                                    <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-zinc-500">
                                                        U{i}
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform">View Details →</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
