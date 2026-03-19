import { auth } from '@clerk/nextjs/server';
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
  const session = await auth();

  if (!session?.userId) {
    redirect('/sign-in');
  }

  try {
    // Get email from session claims (Clerk provides this)
    const email = session.sessionClaims?.email;

    console.log('[AuthGuard] User email:', email);
    console.log('[AuthGuard] Session claims:', session.sessionClaims);

    if (!email) {
      console.log('[AuthGuard] No email found');
      redirect('/blocked');
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('[AuthGuard] Normalized email:', normalizedEmail);
    console.log('[AuthGuard] isEmailAllowed result:', isEmailAllowed(normalizedEmail));

    if (!isEmailAllowed(normalizedEmail)) {
      console.log('[AuthGuard] Email not allowed:', normalizedEmail);
      redirect('/blocked');
    }

    const isCollegeMail = isCollegeEmail(normalizedEmail);
    const isVerified = session.sessionClaims?.email_verified || false;

    console.log('[AuthGuard] Is college mail:', isCollegeMail);
    console.log('[AuthGuard] Is verified:', isVerified);

    if (isCollegeMail && !isVerified) {
      console.log('[AuthGuard] College email not verified, redirecting to verify-email');
      redirect('/verify-email');
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: normalizedEmail }).lean();

    if (!dbUser && !ADMIN_EXCEPTIONS.includes(email)) {
      try {
        // Try to get role from RU data, default to GUEST if not found
        let userRole = getRoleFromRUData(normalizedEmail) || 'GUEST';
        console.log(`[AuthGuard] Creating user ${normalizedEmail} with role: ${userRole}`);
        
        await User.create({
          name: session.sessionClaims?.name || normalizedEmail.split('@')[0],
          email: normalizedEmail,
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
