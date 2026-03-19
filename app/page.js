import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LandingPageContent from '@/components/landing-page-content';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/dashboard');
  }

  // Not signed in, show landing page
  return <LandingPageContent />;
}
