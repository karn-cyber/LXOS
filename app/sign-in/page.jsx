'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SignInButton, SignUpButton, Show } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center rounded-lg">
              <Building2 className="h-6 w-6 text-white dark:text-zinc-900" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">LX Management Platform</CardTitle>
          <CardDescription>
            Learner Experience Operating System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Info */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">College Email Required</p>
                <p className="text-xs">Only @rishihood.edu.in or @nst.rishihood.edu.in emails are allowed. Verification required.</p>
              </div>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-3">
            <SignInButton mode="modal">
              <Button className="w-full" size="lg">
                <Mail className="h-4 w-4 mr-2" />
                Sign In with Email
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button variant="outline" className="w-full" size="lg">
                Create Account
              </Button>
            </SignUpButton>
          </div>

          {/* Info Box */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">How it works:</p>
            <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 list-decimal list-inside">
              <li>Sign in or create an account with your college email</li>
              <li>Verify your email address</li>
              <li>Access the LX Management platform</li>
            </ol>
          </div>

          {/* Support */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 dark:text-amber-100">
                Having trouble? Contact the administrator at admin@lxos.edu
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
