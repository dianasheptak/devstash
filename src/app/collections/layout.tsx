export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getSidebarCollections } from '@/lib/db/collections';
import { getSystemItemTypes } from '@/lib/db/items';

export default async function CollectionsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/collections');

  const [itemTypes, collections] = await Promise.all([
    getSystemItemTypes(session.user.id),
    getSidebarCollections(),
  ]);

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };

  return (
    <DashboardLayout itemTypes={itemTypes} collections={collections} user={user}>
      {children}
    </DashboardLayout>
  );
}
