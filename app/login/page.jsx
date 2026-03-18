'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }
  
  // Redirect to Clerk's sign-in page
  redirect('/sign-in');
}
