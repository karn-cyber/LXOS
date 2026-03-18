import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import DashboardSidebar from '@/components/dashboard/sidebar';

export default async function DashboardLayout({ children }) {
    const session = await auth();

    return (
        <SessionProvider session={session}>
            <DashboardSidebar>
                {children}
            </DashboardSidebar>
        </SessionProvider>
    );
}
