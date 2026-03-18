import { auth } from '@clerk/nextjs/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail } from 'lucide-react';

export default async function VerifyEmailPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-xl">Email Verification Required</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            Your Rishihood email address requires verification before you can access the application.
          </p>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Check your email for a verification link sent by Clerk. Click it to verify your email address.
            </p>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Once verified, you'll be able to access all features of LX Management OS.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
