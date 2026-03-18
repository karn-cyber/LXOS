import { AuthGuard } from '@/components/auth-guard';
import DashboardSidebar from '@/components/dashboard/sidebar';

export default async function DashboardLayout({ children }) {
    return (
        <AuthGuard>
            <DashboardSidebar>
                {children}
            </DashboardSidebar>
        </AuthGuard>
    );
}
