import { auth, clerkClient } from '@clerk/nextjs/server';
import { ShieldX, Building2, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function BlockedPage() {
  const { userId } = await auth();

  let userEmail = null;
  let verificationStatus = null;

  if (userId) {
    try {
      const user = await (await clerkClient()).users.getUser(userId);
      userEmail = user.emailAddresses[0]?.emailAddress || null;
      verificationStatus = user.emailAddresses[0]?.verification?.status || null;
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none p-10 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <ShieldX className="h-10 w-10 text-red-600" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Access Denied</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed">
              Your email address is not authorized to access the LX Management Platform.
            </p>
          </div>

          {/* Reason box */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 text-left space-y-1.5">
            <p className="text-sm font-bold text-red-800 dark:text-red-300">Why was I blocked?</p>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
              <li className="font-medium">· Your email is not in the institutional RU records</li>
              <li className="font-medium">· Only <span className="font-mono text-xs">@rishihood.edu.in</span> addresses are permitted</li>
              <li className="font-medium">· Or <span className="font-mono text-xs">@nst.rishihood.edu.in</span> addresses</li>
            </ul>
          </div>

          {/* User info if available */}
          {userEmail && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 text-left border border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Attempted Account</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-zinc-400" />
                <p className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 truncate">{userEmail}</p>
              </div>
              {verificationStatus && (
                <p className="text-xs text-zinc-400 mt-1">Verification: {verificationStatus}</p>
              )}
            </div>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            If you believe this is an error, contact your LX administrator with your institutional email address.
          </p>

          <Link href="/sign-in">
            <Button variant="outline" className="w-full rounded-xl font-bold flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Try a Different Account
            </Button>
          </Link>
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mt-6 opacity-60">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">LX Management OS · Rishihood University</span>
        </div>
      </div>
    </div>
  );
}
