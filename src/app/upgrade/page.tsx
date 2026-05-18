export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PricingCards } from '@/components/billing/pricing-cards';

export const metadata = {
  title: 'Upgrade · DevStash',
};

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/upgrade');
  if (session.user.isPro) redirect('/profile');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10">
      <header className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Upgrade to Pro
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Unlock unlimited items, files &amp; images, and AI features.
        </p>
      </header>
      <PricingCards />
    </div>
  );
}
