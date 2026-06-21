'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useClerk, useUser } from '@clerk/nextjs';
import {
  Calendar, CalendarDays, Users, Flag, Building2, Wallet,
  Trophy, BarChart3, Folder, CheckCircle, LogOut, Menu, X,
  LayoutDashboard, Newspaper, ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import RouteProgress from '@/components/ui/route-progress';

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
  { name: 'Reimbursements', href: '/dashboard/files', icon: Folder, permission: null },
  { name: 'Approvals', href: '/dashboard/approvals', icon: CheckCircle, permission: PERMISSIONS.APPROVE_EVENT },
];

const ROLE_META = {
  ADMIN:     { label: 'Admin' },
  LX_TEAM:   { label: 'LX Team' },
  CLUB_HEAD: { label: 'Club Head' },
  CLAN_HEAD: { label: 'Clan Head' },
  FINANCE:   { label: 'Finance' },
  GUEST:     { label: 'General Access' },
};

export default function DashboardSidebar({ children }) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState('GUEST');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

  const userName = clerkUser?.firstName && clerkUser?.lastName
    ? `${clerkUser.firstName} ${clerkUser.lastName}`
    : clerkUser?.firstName || 'User';
  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || '';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  useEffect(() => {
    if (!userEmail) return;
    setRoleLoading(true);
    const fetchRole = async () => {
      try {
        const ruRes = await fetch(`/api/ru-users/${encodeURIComponent(userEmail)}`);
        if (ruRes.ok) {
          const ruData = await ruRes.json();
          if (ruData.found && ruData.role) { setUserRole(ruData.role); return; }
        }
        const dbRes = await fetch(`/api/users/${encodeURIComponent(userEmail)}`);
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setUserRole(dbData.role || 'GUEST');
        }
      } catch {
        setUserRole('GUEST');
      } finally {
        setRoleLoading(false);
      }
    };
    fetchRole();
  }, [userEmail]);

  const filteredNav = navigation.filter(item =>
    !item.permission || hasPermission(userRole, item.permission)
  );

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const roleMeta = ROLE_META[userRole] || ROLE_META.GUEST;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <RouteProgress />
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-60
        bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800
        flex flex-col transition-transform duration-200 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">LX Platform</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href ||
              (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-100
                  ${isActive
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }
                `}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-primary text-white text-[10px] font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-zinc-400 truncate leading-tight mt-0.5">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 rounded-md">
              {roleLoading ? '—' : roleMeta.label}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-500 transition-colors px-1.5 py-1 rounded"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-60 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center h-12 px-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-3 p-1 text-zinc-500 hover:text-zinc-700 rounded-md hover:bg-zinc-50 transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-primary rounded-md flex items-center justify-center">
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">LX Platform</span>
          </div>
          <span className="ml-auto text-[10px] text-zinc-400 font-medium">{roleMeta.label}</span>
        </header>

        <main className="p-4 sm:p-5 lg:p-8 max-w-[1400px] w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
