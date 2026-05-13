export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { getCollectionBySlug } from '@/lib/db/collections';
import { ItemCard } from '@/components/items/item-card';

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <div
            className="size-3 rounded-full shrink-0"
            style={{ backgroundColor: collection.dominantColor }}
          />
          <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
          {collection.isFavorite && (
            <Star className="size-4 fill-yellow-400 text-yellow-400 shrink-0" />
          )}
          <span className="text-sm text-muted-foreground ml-1">
            {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        {collection.description && (
          <p className="text-sm text-muted-foreground pl-6">{collection.description}</p>
        )}
      </header>

      {collection.items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No items in this collection yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {collection.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
