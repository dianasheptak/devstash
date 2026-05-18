export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import { auth } from '@/auth';
import { getAllCollections } from '@/lib/db/collections';
import { COLLECTIONS_PER_PAGE, parsePageParam } from '@/lib/constants/pagination';
import { CollectionCard } from '@/components/collections/collection-card';
import { Pagination } from '@/components/shared/pagination';

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in?callbackUrl=/collections');

  const { page: pageParam } = await searchParams;
  const page = parsePageParam(pageParam);

  const { collections, total, pageCount, page: currentPage } = await getAllCollections(
    session.user.id,
    { page, perPage: COLLECTIONS_PER_PAGE }
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex items-center gap-3">
        <FolderOpen className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
        <span className="text-sm text-muted-foreground">
          {total} {total === 1 ? 'collection' : 'collections'}
        </span>
      </header>

      {collections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No collections yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <CollectionCard key={col.id} col={col} />
          ))}
        </div>
      )}

      <Pagination basePath="/collections" page={currentPage} pageCount={pageCount} />
    </div>
  );
}
