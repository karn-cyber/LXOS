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
  const session = await auth();

  if (!session?.userId) {
    redirect('/sign-in');
  }

  try {
    let email = (session.sessionClaims as any)?.email || (session.sessionClaims as any)?.email_address;
    let displayName = (session.sessionClaims as any)?.name || '';
    let isVerified = Boolean((session.sessionClaims as any)?.email_verified);

    // Fallback to Clerk user lookup when session claims do not include email
    if (!email && session.userId) {
      const user = await (await clerkClient()).users.getUser(session.userId);
      const primaryEmail =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ||
        user.emailAddresses[0];

      email = primaryEmail?.emailAddress;
      isVerified = primaryEmail?.verification?.status === 'verified';
      displayName =
        displayName ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.username ||
        '';
    }

    console.log('[AuthGuard] User email:', email);

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

    console.log('[AuthGuard] Is college mail:', isCollegeMail);
    console.log('[AuthGuard] Is verified:', isVerified);

    if (isCollegeMail && !isVerified) {
      console.log('[AuthGuard] College email not verified, redirecting to verify-email');
      redirect('/verify-email');
    }

    await dbConnect();
    const dbUser = await User.findOne({ email: normalizedEmail }).lean();
    const mappedRole = getRoleFromRUData(normalizedEmail) || 'GUEST';

    if (!dbUser && !ADMIN_EXCEPTIONS.includes(normalizedEmail)) {
      try {
        console.log(`[AuthGuard] Creating user ${normalizedEmail} with role: ${mappedRole}`);
        
        await User.create({
          name: displayName || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          password: Math.random().toString(36).slice(-8),
          role: mappedRole,
          isActive: true,
        });
      } catch (err: any) {
        // Handle duplicate key error (user might have been created by another request)
        if (err.code !== 11000) {
          throw err;
        }
      }
    } else if (dbUser && dbUser.role !== mappedRole) {
      await User.updateOne({ email: normalizedEmail }, { $set: { role: mappedRole } });
    }

    return children;
  } catch (error: any) {
    // Let Next.js redirects pass through without converting to blocked page
    if (error?.digest?.startsWith?.('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Auth guard error:', error);
    redirect('/blocked');
  }
}
