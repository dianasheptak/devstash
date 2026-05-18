export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { Star, LayoutGrid, FolderOpen } from 'lucide-react';
import { auth } from '@/auth';
import { getRecentCollections, getCollectionStats } from '@/lib/db/collections';
import { getPinnedItems, getRecentItems, getItemStats } from '@/lib/db/items';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SectionHeading } from '@/components/shared/section-heading';
import { ItemCard } from '@/components/items/item-card';
import { CollectionCard } from '@/components/collections/collection-card';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/dashboard');
  const userId = session.user.id;

  const [recentCollections, collectionStats, pinnedItems, recentItems, itemStats] =
    await Promise.all([
      getRecentCollections(userId),
      getCollectionStats(userId),
      getPinnedItems(userId),
      getRecentItems(userId),
      getItemStats(userId),
    ]);

  const stats = [
    { label: 'Total Items', value: itemStats.total, icon: LayoutGrid },
    { label: 'Collections', value: collectionStats.total, icon: FolderOpen },
    { label: 'Favorite Items', value: itemStats.favorites, icon: Star },
    { label: 'Favorite Collections', value: collectionStats.favorites, icon: Star },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>{label}</CardDescription>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Recent Collections */}
      <section>
        <SectionHeading>Recent Collections</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {recentCollections.map((col) => (
            <CollectionCard key={col.id} col={col} />
          ))}
        </div>
      </section>

      {/* Pinned Items */}
      {pinnedItems.length > 0 && (
        <section>
          <SectionHeading>Pinned Items</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section>
        <SectionHeading>Recent Items</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
