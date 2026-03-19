import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default async function BlockedPage() {
  const { userId } = await auth();

  let userEmail = 'Unknown';
  let verificationStatus = 'Unknown';

  if (userId) {
    try {
      const user = await (await clerkClient()).users.getUser(userId);
      userEmail = user.emailAddresses[0]?.emailAddress || 'No email';
      verificationStatus = user.emailAddresses[0]?.verification?.status || 'Not verified';
      console.log('[BlockedPage] User email:', userEmail);
      console.log('[BlockedPage] Verification status:', verificationStatus);
    } catch (error) {
      console.error('[BlockedPage] Error fetching user:', error);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            Your email address is not authorized to access this application.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Access is allowed only for emails that exist in institutional RU data.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            If your email is present in RU records and you still see this page, contact support.
          </p>
          
          {userId && (
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3 text-xs space-y-1 font-mono">
              <p><span className="font-semibold">Email:</span> {userEmail}</p>
              <p><span className="font-semibold">Verification:</span> {verificationStatus}</p>
            </div>
          )}
          
          <p className="text-xs text-zinc-500 dark:text-zinc-500 pt-2">
            If you believe this is an error, please contact the administrator.
          </p>
          <div className="flex gap-3 pt-4">
            <Link href="/sign-in" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
