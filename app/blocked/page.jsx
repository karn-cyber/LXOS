import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default async function BlockedPage() {
  const { userId } = await auth();

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
            Only users with the following email domains are allowed:
          </p>
          <ul className="text-sm space-y-1 text-zinc-600 dark:text-zinc-400">
            <li>• @rishihood.edu.in</li>
            <li>• @nst.rishihood.edu.in</li>
            <li>• @lxos.edu (admins)</li>
          </ul>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 pt-2">
            If you believe this is an error, please contact the administrator.
          </p>
          <div className="flex gap-3 pt-4">
            <Link href="/login" className="flex-1">
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
