import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isEmailAllowed, isCollegeEmail } from '@/lib/clerk-config';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ allowed: false, reason: 'Not authenticated' }, { status: 401 });
    }

    const user = await (await clerkClient()).users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return NextResponse.json({ allowed: false, reason: 'No email on account' }, { status: 400 });
    }

    // Check if email is in allowed list
    if (!isEmailAllowed(email)) {
      return NextResponse.json({
        allowed: false,
        reason: 'Email not authorized. Only @rishihood.edu.in, @nst.rishihood.edu.in, or @lxos.edu emails are allowed.',
        email
      }, { status: 403 });
    }

    // Check if college email is verified
    const isVerified = user.emailAddresses[0]?.verification?.status === 'verified';
    if (isCollegeEmail(email) && !isVerified) {
      return NextResponse.json({
        allowed: false,
        reason: 'College emails require email verification. Please verify your email address.',
        requiresVerification: true,
        email
      }, { status: 403 });
    }

    // Try to get user from database
    try {
      const { default: User } = await import('@/models/User');
      const dbUser = await User.findOne({ email: email.toLowerCase() }).lean();

      return NextResponse.json({
        allowed: true,
        user: {
          id: userId,
          email,
          verified: isVerified,
          role: dbUser?.role || 'GUEST',
          dbId: dbUser?._id?.toString() || null,
        }
      });
    } catch (dbError) {
      // Allow access even if database check fails, just won't have role info
      return NextResponse.json({
        allowed: true,
        user: {
          id: userId,
          email,
          verified: isVerified,
          role: 'GUEST'
        }
      });
    }
  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json({ allowed: false, reason: 'Validation failed' }, { status: 500 });
  }
}
