/**
 * Update your existing NextAuth config to include Clerk validation
 * OR migrate entirely to Clerk
 * 
 * This file shows how to integrate Clerk email validation into existing auth flow
 */

import { isEmailAllowed, isCollegeEmail, ADMIN_EXCEPTIONS } from './clerk-config';

export async function validateEmailWithClerk(email: string) {
  if (!email) {
    return { valid: false, reason: 'No email provided' };
  }

  // Admin exceptions skip verification
  if (ADMIN_EXCEPTIONS.includes(email.toLowerCase())) {
    return { valid: true, reason: 'Admin exception' };
  }

  // Check allowed domains
  if (!isEmailAllowed(email)) {
    return {
      valid: false,
      reason: 'Email domain not allowed. Only @rishihood.edu.in, @nst.rishihood.edu.in, or @lxos.edu'
    };
  }

  // College emails need verification (enforced by Clerk)
  if (isCollegeEmail(email)) {
    return {
      valid: true,
      requiresVerification: true,
      reason: 'College email - verification required'
    };
  }

  return { valid: true, reason: 'Email validated' };
}
