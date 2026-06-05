import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import dbConnect from '@/lib/db';
import Club from '@/models/Club';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ClubActions from '@/components/clubs/club-actions';
import { getDashboardSession } from '@/lib/dashboard-session';

async function getClubs() {
    await dbConnect();
    const clubs = await Club.find({ isActive: true }).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(clubs));
}

function ProgressBar({ pct, critical }) {
    return (
        <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all ${critical ? 'bg-red-400' : pct > 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
            />
        </div>
    );
}

function ClubsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {[1,2,3].map(i => <div key={i} className="h-40 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800" />)}
            </div>
        </div>
    );
}

async function ClubsContent() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');

    const clubs = await getClubs();
    const isAdmin = session.user.role === 'ADMIN';

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl italic text-zinc-900 dark:text-zinc-100">Clubs</h1>
                    <p className="text-sm text-zinc-400 mt-1">{clubs.length} active organisations</p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/clubs/create">
                        <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-xl font-medium flex items-center gap-1.5 h-9">
                            <Plus className="h-3.5 w-3.5" />
                            New Club
                        </Button>
                    </Link>
                )}
            </div>

            {clubs.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                    No clubs yet.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clubs.map((club) => {
                        const pct = club.budgetAllocated > 0
                            ? (club.budgetSpent / club.budgetAllocated) * 100
                            : 0;
                        const remaining = club.budgetAllocated - club.budgetSpent;

                        return (
                            <Link key={club._id} href={`/dashboard/clubs/${club._id}`} className="group block">
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors h-full relative">
                                    {isAdmin && (
                                        <div className="absolute top-4 right-4" onClick={e => e.preventDefault()}>
                                            <ClubActions clubId={club._id} clubName={club.name} />
                                        </div>
                                    )}
                                    <div className="pr-8">
                                        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">{club.category}</span>
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1 group-hover:text-primary transition-colors">
                                            {club.name}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">{club.description}</p>
                                    </div>

                                    <div className="mt-4 space-y-1.5">
                                        <ProgressBar pct={pct} critical={pct > 90} />
                                        <div className="flex justify-between text-[11px] text-zinc-400">
                                            <span>₹{club.budgetSpent.toLocaleString()} spent</span>
                                            <span className={remaining < 0 ? 'text-red-400' : 'text-zinc-500'}>
                                                ₹{Math.max(0, remaining).toLocaleString()} left
                                            </span>
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

export default function ClubsPage() {
    return (
        <Suspense fallback={<ClubsSkeleton />}>
            <ClubsContent />
        </Suspense>
    );
}
