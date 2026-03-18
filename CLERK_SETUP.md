# Clerk Authentication Setup

## Overview

Clerk has been integrated with college email verification to control access to the LX Management Platform.

### Authentication Flow

1. **Email Validation**
   - Only emails from allowed domains can sign up:
     - `@rishihood.edu.in` (requires verification)
     - `@nst.rishihood.edu.in` (requires verification)
     - `@lxos.edu` (admin exceptions, no verification needed)

2. **Email Verification**
   - College emails must be verified before accessing the dashboard
   - Verification link sent by Clerk to the registered email
   - Admin emails (@lxos.edu) skip verification

3. **Access Control**
   - Unauthenticated users → Sign-in page
   - Invalid email domain → Blocked page
   - Unverified college email → Verification page
   - Valid user → Dashboard

### File Structure

```
app/
├── layout.js                    # Root layout with ClerkProvider
├── sign-in/page.jsx             # Sign-in page (replaces old login)
├── blocked/page.jsx             # Access denied page
├── verify-email/page.jsx        # Email verification required page
├── api/auth/validate/route.ts   # Email validation endpoint

lib/
├── clerk-config.ts              # Email allowlist & config
├── clerk-helpers.ts             # Helper functions
├── use-clerk-validation.tsx     # React hook for validation
├── email-validation.ts          # Email validation utilities

components/
└── auth-guard.tsx               # Server component for protected routes

proxy.ts                          # Clerk middleware (at project root)
```

### Configuration

**Allowed Emails:** See `lib/clerk-config.ts`
- Domains: `rishihood.edu.in`, `nst.rishihood.edu.in`
- Admin exceptions: `admin@lxos.edu`, `lx@lxos.edu`, `clubhead@lxos.edu`, `finance@lxos.edu`

### Environment Variables

No setup needed for keyless mode! Clerk auto-generates temporary keys.

To connect to a production Clerk account, add:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

### Usage

#### Protect a page
```tsx
import { AuthGuard } from '@/components/auth-guard';

export default async function DashboardLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
```

#### Check auth in API routes
```tsx
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });
  
  // Your logic here
}
```

#### Use in client components
```tsx
'use client';
import { useAuth, useUser } from '@clerk/nextjs';

export default function MyComponent() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  
  return <div>{user?.primaryEmailAddress?.emailAddress}</div>;
}
```

### Disabled Pages

- `/login` - Replaced by Clerk sign-in modal
- NextAuth config still active but Clerk takes precedence

### Next Steps

1. Set Clerk publishable & secret keys in `.env.local` when ready for production
2. Update database to sync Clerk user IDs with your User model
3. Configure allowed emails in `lib/clerk-config.ts` based on actual RU data
4. Add organization-level access control if needed

### Testing

**Sign up flow:**
1. Click "Sign In" button
2. Enter college email (e.g., `student@rishihood.edu.in`)
3. Complete signup
4. Click verification link in email
5. Auto-redirected to dashboard

**Admin access:**
- Use `admin@lxos.edu` (no verification needed)
- Useful for local testing

**Blocked access:**
- Try signing in with non-allowed domain (e.g., `gmail.com`)
- Get redirected to `/blocked` page
