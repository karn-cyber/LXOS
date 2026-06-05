import { Mail, Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none p-10 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                <Mail className="h-10 w-10 text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-black">!</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Verify Your Email</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed">
              Your Rishihood email address requires verification before you can access the LX Platform.
            </p>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 text-left space-y-2">
            <p className="text-sm font-bold text-blue-800 dark:text-blue-300">How to verify:</p>
            <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1.5 list-decimal list-inside">
              <li className="font-medium">Check your college email inbox</li>
              <li className="font-medium">Find the verification email from Clerk</li>
              <li className="font-medium">Click the verification link</li>
              <li className="font-medium">Return here and sign in</li>
            </ol>
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Once verified, you will have full access to all LX Platform features.
          </p>

          <Link href="/">
            <Button variant="outline" className="w-full rounded-xl font-bold flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
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
