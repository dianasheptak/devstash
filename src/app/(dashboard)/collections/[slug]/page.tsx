export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getCollectionBySlug } from '@/lib/db/collections';
import { ITEMS_PER_PAGE, parsePageParam } from '@/lib/constants/pagination';
import { ItemCard } from '@/components/items/item-card';
import { CollectionActions } from '@/components/collections/collection-actions';
import { Pagination } from '@/components/shared/pagination';

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/collections');
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const collection = await getCollectionBySlug(session.user.id, slug, {
    page,
    perPage: ITEMS_PER_PAGE,
  });
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
          <span className="text-sm text-muted-foreground ml-1">
            {collection.itemCount} {collection.itemCount === 1 ? 'item' : 'items'}
          </span>
          <div className="ml-auto">
            <CollectionActions
              collection={{
                id: collection.id,
                name: collection.name,
                description: collection.description,
                isFavorite: collection.isFavorite,
              }}
            />
          </div>
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

      <Pagination
        basePath={`/collections/${slug}`}
        page={collection.page}
        pageCount={collection.pageCount}
      />
    </div>
  );
}
