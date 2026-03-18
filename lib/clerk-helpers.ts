import { auth, clerkClient } from '@clerk/nextjs/server';
import { isEmailAllowed, isCollegeEmail } from './clerk-config';

/**
 * Verify user session and email eligibility
 * Used after sign-up/sign-in to validate access
 */
export async function verifyUserAccess() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { allowed: false, reason: 'Not authenticated' };
    }

    const user = await (await clerkClient()).users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!email) {
      return { allowed: false, reason: 'No email on account' };
    }

    // Check if email is allowed
    if (!isEmailAllowed(email)) {
      return {
        allowed: false,
        reason: 'Email not authorized. Only @rishihood.edu.in, @nst.rishihood.edu.in, or @lxos.edu emails are allowed.'
      };
    }

    // Check if college email requires additional verification
    if (isCollegeEmail(email) && (user.emailAddresses[0]?.verification?.status !== 'verified')) {
      return {
        allowed: false,
        reason: 'College emails require email verification. Please verify your email.',
        requiresVerification: true
      };
    }

    return { allowed: true, user, email };
  } catch (error) {
    console.error('Error verifying user access:', error);
    return { allowed: false, reason: 'Verification failed' };
  }
}

/**
 * Get user role from database based on email
 * Maps Clerk users to app roles
 */
export async function getUserRoleFromDatabase(email: string) {
  try {
    // Check if user exists in our database
    const { default: User } = await import('@/models/User');
    const user = await User.findOne({ email: email.toLowerCase() }).lean();

    if (user) {
      return {
        role: user.role,
        id: user._id.toString(),
        clubId: user.clubId?.toString() || null,
        clanId: user.clanId?.toString() || null,
      };
    }

    // If not in database, can create as regular user or deny
    return {
      role: 'GUEST',
      id: null,
      clubId: null,
      clanId: null,
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}
