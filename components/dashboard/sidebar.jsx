'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import {
    Calendar,
    CalendarDays,
    Users,
    Flag,
    Building2,
    Wallet,
    Trophy,
    BarChart3,
    Folder,
    CheckCircle,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    Newspaper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
    { name: 'Feed', href: '/dashboard/feed', icon: Newspaper, permission: null },
    { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar, permission: null },
    { name: 'Events', href: '/dashboard/events', icon: CalendarDays, permission: null },
    { name: 'Clubs', href: '/dashboard/clubs', icon: Users, permission: PERMISSIONS.VIEW_ALL_CLUBS },
    { name: 'Clans', href: '/dashboard/clans', icon: Flag, permission: null },
    { name: 'Rooms', href: '/dashboard/rooms', icon: Building2, permission: null },
    { name: 'Budget', href: '/dashboard/budget', icon: Wallet, permission: PERMISSIONS.VIEW_ALL_BUDGETS },
    { name: 'Achievements', href: '/dashboard/achievements', icon: Trophy, permission: null },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, permission: PERMISSIONS.VIEW_ANALYTICS },
    { name: 'Repository', href: '/dashboard/files', icon: Folder, permission: null },
    { name: 'Approvals', href: '/dashboard/approvals', icon: CheckCircle, permission: PERMISSIONS.APPROVE_EVENT },
];

export default function DashboardSidebar({ children }) {
    const pathname = usePathname();
    const { signOut } = useClerk();
    const { user: clerkUser } = useUser();
    const router = useRouter();
    const [userRole, setUserRole] = useState('GUEST');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const userName = clerkUser?.firstName && clerkUser?.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser?.firstName || 'User';
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || '';
    const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

    // Fetch user role from database
    useEffect(() => {
        const fetchUserRole = async () => {
            if (!userEmail) return;
            try {
                const response = await fetch(`/api/users/${encodeURIComponent(userEmail)}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserRole(data.role || 'GUEST');
                }
            } catch (error) {
                console.error('Failed to fetch user role:', error);
                setUserRole('GUEST');
            }
        };
        
        fetchUserRole();
    }, [userEmail]);

    // Filter navigation based on permissions
    const filteredNavigation = navigation.filter(item => {
        if (!item.permission) return true;
        return hasPermission(userRole, item.permission);
    });

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-20 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                        <div className="flex items-center space-x-3 text-primary">
                            <div className="h-10 w-10 bg-primary flex items-center justify-center rounded-xl shadow-lg shadow-primary/20">
                                <Building2 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-lg tracking-tight block leading-none">LX Platform</span>
                                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Rishihood University</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-zinc-500 hover:text-primary transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                        {filteredNavigation.map((item) => {
                            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-secondary hover:text-primary'
                                        }
                                    `}
                                >
                                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'group-hover:text-primary'}`} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section */}
                    <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                        <div className="flex items-center space-x-3 mb-4">
                            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                                <AvatarFallback className="bg-primary text-white text-xs font-bold">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">{userName}</p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate font-medium">{userEmail}</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold uppercase tracking-wider">
                                {userRole?.replace('_', ' ')}
                            </div>
                        </div>
                        <Button
                            onClick={handleSignOut}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Mobile header */}
                <header className="lg:hidden sticky top-0 z-30 flex items-center h-16 px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="mr-4"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center rounded-lg">
                            <Building2 className="h-3 w-3 text-white dark:text-zinc-900" />
                        </div>
                        <span className="font-semibold text-sm">LX Platform</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
