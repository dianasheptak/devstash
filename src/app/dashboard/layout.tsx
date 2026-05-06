export const dynamic = 'force-dynamic';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { getSidebarCollections } from '@/lib/db/collections';
import { getSystemItemTypes } from '@/lib/db/items';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [itemTypes, collections] = await Promise.all([
    getSystemItemTypes(),
    getSidebarCollections(),
  ]);

  return (
    <DashboardLayout itemTypes={itemTypes} collections={collections}>
      {children}
    </DashboardLayout>
  );
}
