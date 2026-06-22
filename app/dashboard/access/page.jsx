import { redirect } from 'next/navigation';
import { getDashboardSession } from '@/lib/dashboard-session';
import AccessManager from '@/components/access/access-manager';

export default async function AccessPage() {
    const session = await getDashboardSession();
    if (!session) redirect('/login');
    if (session.user.role !== 'ADMIN') redirect('/dashboard');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-display text-2xl sm:text-3xl italic text-zinc-900 dark:text-zinc-100">Access Management</h1>
                <p className="text-sm text-zinc-400 mt-1">
                    Grant club / clan head and LX access by email. Search pulls from the RU directory.
                    A person can hold more than one role.
                </p>
            </div>
            <AccessManager />
        </div>
    );
}
