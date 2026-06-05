'use client';

import { SignInButton, Show } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight, Lock, CalendarDays, Users, Flag, Wallet, Trophy, BarChart3 } from 'lucide-react';

const features = [
  { icon: CalendarDays, label: 'Events' },
  { icon: Users, label: 'Clubs' },
  { icon: Flag, label: 'Clans' },
  { icon: Wallet, label: 'Budget' },
  { icon: Trophy, label: 'Achievements' },
  { icon: BarChart3, label: 'Analytics' },
];

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8 py-16">

        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">LX</span>
          </div>
          <div>
            <h1 className="font-display text-3xl text-zinc-900 dark:text-zinc-100 italic">
              LX Management OS
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Rishihood University</p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-2.5 py-1 rounded-full">
              <Icon className="h-3 w-3" />
              {label}
            </div>
          ))}
        </div>

        {/* Sign in card */}
        <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 space-y-4 bg-white dark:bg-zinc-900 shadow-sm">
          <div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">Sign in to continue</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Use your institutional email address.</p>
          </div>

          <Show when="signed-out">
            <SignInButton
              mode="modal"
              signUpForceRedirectUrl="/dashboard"
              forceRedirectUrl="/dashboard"
            >
              <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl flex items-center justify-center gap-2">
                <Mail className="h-4 w-4" />
                Sign in with College Email
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <Button asChild className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl">
              <Link href="/dashboard" className="flex items-center justify-center gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
          </Show>

          <div className="flex items-start gap-2 pt-1">
            <Lock className="h-3.5 w-3.5 text-zinc-300 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-snug">
              Access is restricted to{' '}
              <span className="font-mono text-zinc-500">@rishihood.edu.in</span> and{' '}
              <span className="font-mono text-zinc-500">@nst.rishihood.edu.in</span> addresses.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-300 dark:text-zinc-600">
          By signing in you agree to the platform terms.
        </p>
      </div>
    </div>
  );
}
