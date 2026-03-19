'use client';

import { SignInButton, Show } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Lock, Mail, ArrowRight, Zap, Users, Trophy } from 'lucide-react';

export default function LandingPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-none shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center rounded-2xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-red-700 to-red-900 bg-clip-text text-transparent mb-2">
              LX Management Platform
            </CardTitle>
            <CardDescription className="text-lg text-zinc-600 dark:text-zinc-400">
              Learner Experience Operating System
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Intro Text */}
          <p className="text-center text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Welcome to the LX Management Platform. Sign in with your college email to access clubs, clans, events, and more.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
              <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-2">
                <Building2 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Clubs & Clans</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Join communities</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
              <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2">
                <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Events</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Stay updated</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-2">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Community</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Connect with peers</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-2">
                <Trophy className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Achievements</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Track your wins</p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 rounded-lg p-4">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-red-700 dark:text-red-300 shrink-0 mt-0.5" />
              <div className="text-sm text-red-900 dark:text-red-50">
                <p className="font-semibold mb-1">College Email Required</p>
                <p className="text-xs">Only verified @rishihood.edu.in or @nst.rishihood.edu.in emails are allowed.</p>
              </div>
            </div>
          </div>

          {/* Primary Action */}
          <Show when="signed-out">
            <SignInButton mode="modal" signUpForceRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
              <Button
                className="w-full h-11 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200"
              >
                <Mail className="h-5 w-5" />
                Sign In Using College Mail ID
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Button asChild className="w-full h-11 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-200">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
          </Show>

          {/* Footer Text */}
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            By signing in, you agree to our platform terms and conditions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
