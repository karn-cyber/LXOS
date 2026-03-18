import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { isEmailAllowed, isCollegeEmail, ADMIN_EXCEPTIONS } from '@/lib/clerk-config';
import { getRoleFromRUData } from '@/lib/ru-data-mapper';

/**
 * This component enforces email-based access control
 * Place it in your protected layouts/pages
 */
export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  try {
    const user = await (await clerkClient()).users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      redirect('/blocked');
    }

    if (!isEmailAllowed(email)) {
      redirect('/blocked');
    }

    const isCollegeMail = isCollegeEmail(email);
    const isVerified = user.emailAddresses[0]?.verification?.status === 'verified';

    if (isCollegeMail && !isVerified) {
      redirect('/verify-email');
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: email.toLowerCase() }).lean();

    if (!dbUser && !ADMIN_EXCEPTIONS.includes(email)) {
      try {
        // Try to get role from RU data, default to GUEST if not found
        let userRole = getRoleFromRUData(email) || 'GUEST';
        console.log(`[AuthGuard] Creating user ${email} with role: ${userRole}`);
        
        await User.create({
          name: user.firstName || email.split('@')[0],
          email: email.toLowerCase(),
          password: Math.random().toString(36).slice(-8),
          role: userRole,
          isActive: true,
        });
      } catch (err: any) {
        // Handle duplicate key error (user might have been created by another request)
        if (err.code !== 11000) {
          throw err;
        }
      }
    }

    return children;
  } catch (error) {
    console.error('Auth guard error:', error);
    redirect('/blocked');
  }
}
