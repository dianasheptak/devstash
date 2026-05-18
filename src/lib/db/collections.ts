import { prisma } from '@/lib/prisma';
import type { CreateCollectionParsed, UpdateCollectionParsed } from '@/lib/validation/collection';
import type { ItemWithMeta } from '@/lib/db/items';

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export type CollectionWithMeta = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  types: Array<{ name: string; icon: string; color: string }>;
  dominantColor: string;
};

type TypeMeta = { name: string; icon: string; color: string };

async function getTypeBreakdowns(
  collectionIds: string[]
): Promise<Map<string, { counts: Map<string, number>; types: Map<string, TypeMeta> }>> {
  const result = new Map<
    string,
    { counts: Map<string, number>; types: Map<string, TypeMeta> }
  >();
  if (collectionIds.length === 0) return result;

  const rows = await prisma.itemCollection.findMany({
    where: { collectionId: { in: collectionIds } },
    select: {
      collectionId: true,
      item: {
        select: {
          itemType: { select: { id: true, name: true, icon: true, color: true } },
        },
      },
    },
  });

  for (const row of rows) {
    let entry = result.get(row.collectionId);
    if (!entry) {
      entry = { counts: new Map(), types: new Map() };
      result.set(row.collectionId, entry);
    }
    const t = row.item.itemType;
    entry.counts.set(t.id, (entry.counts.get(t.id) ?? 0) + 1);
    if (!entry.types.has(t.id)) {
      entry.types.set(t.id, { name: t.name, icon: t.icon, color: t.color });
    }
  }
  return result;
}

function buildMeta(
  breakdown: { counts: Map<string, number>; types: Map<string, TypeMeta> } | undefined
): { types: TypeMeta[]; dominantColor: string; itemCount: number } {
  if (!breakdown) return { types: [], dominantColor: '#4b5563', itemCount: 0 };
  const itemCount = Array.from(breakdown.counts.values()).reduce((a, b) => a + b, 0);
  let dominantId: string | undefined;
  let dominantCount = -1;
  for (const [id, count] of breakdown.counts) {
    if (count > dominantCount) {
      dominantCount = count;
      dominantId = id;
    }
  }
  const dominantColor = dominantId
    ? breakdown.types.get(dominantId)?.color ?? '#4b5563'
    : '#4b5563';
  return { types: Array.from(breakdown.types.values()), dominantColor, itemCount };
}

export async function getRecentCollections(
  userId: string,
  limit = 6
): Promise<CollectionWithMeta[]> {
  const safeLimit = Math.min(Math.max(1, limit), 20);

  const collections = await prisma.collection.findMany({
    where: { userId },
    take: safeLimit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isFavorite: true,
    },
  });

  const breakdowns = await getTypeBreakdowns(collections.map((c) => c.id));

  return collections.map((col) => {
    const meta = buildMeta(breakdowns.get(col.id));
    return {
      id: col.id,
      name: col.name,
      slug: col.slug,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: meta.itemCount,
      types: meta.types,
      dominantColor: meta.dominantColor,
    };
  });
}

export type SidebarCollection = {
  id: string;
  name: string;
  slug: string;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string;
};

export async function getSidebarCollections(
  userId: string,
  limit = 20
): Promise<SidebarCollection[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50);

  const collections = await prisma.collection.findMany({
    where: { userId },
    take: safeLimit,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, slug: true, isFavorite: true },
  });

  const breakdowns = await getTypeBreakdowns(collections.map((c) => c.id));

  return collections.map((col) => {
    const meta = buildMeta(breakdowns.get(col.id));
    return {
      id: col.id,
      name: col.name,
      slug: col.slug,
      isFavorite: col.isFavorite,
      itemCount: meta.itemCount,
      dominantColor: meta.dominantColor,
    };
  });
}

export type CollectionDetail = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
};

export async function createCollection(
  userId: string,
  data: CreateCollectionParsed
): Promise<CollectionDetail> {
  return prisma.collection.create({
    data: {
      name: data.name,
      slug: toSlug(data.name),
      description: data.description,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
    },
  });
}

export type CollectionPickerItem = {
  id: string;
  name: string;
  description: string | null;
};

export async function getCollectionsForPicker(
  userId: string
): Promise<CollectionPickerItem[]> {
  return prisma.collection.findMany({
    where: { userId },
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' },
  });
}

export type PaginatedCollections = {
  collections: CollectionWithMeta[];
  total: number;
  pageCount: number;
  page: number;
};

export async function getAllCollections(
  userId: string,
  { page, perPage }: { page: number; perPage: number }
): Promise<PaginatedCollections> {
  const where = { userId };
  const total = await prisma.collection.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const collections = await prisma.collection.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * perPage,
    take: perPage,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isFavorite: true,
    },
  });

  const breakdowns = await getTypeBreakdowns(collections.map((c) => c.id));

  return {
    collections: collections.map((col) => {
      const meta = buildMeta(breakdowns.get(col.id));
      return {
        id: col.id,
        name: col.name,
        slug: col.slug,
        description: col.description,
        isFavorite: col.isFavorite,
        itemCount: meta.itemCount,
        types: meta.types,
        dominantColor: meta.dominantColor,
      };
    }),
    total,
    pageCount,
    page: safePage,
  };
}

export type CollectionPage = CollectionWithMeta & {
  items: ItemWithMeta[];
  pageCount: number;
  page: number;
};

export async function getCollectionBySlug(
  userId: string,
  slug: string,
  { page, perPage }: { page: number; perPage: number }
): Promise<CollectionPage | null> {
  const col = await prisma.collection.findFirst({
    where: { userId, slug },
    select: { id: true, name: true, slug: true, description: true, isFavorite: true },
  });
  if (!col) return null;

  const breakdowns = await getTypeBreakdowns([col.id]);
  const meta = buildMeta(breakdowns.get(col.id));

  const pageCount = Math.max(1, Math.ceil(meta.itemCount / perPage));
  const safePage = Math.min(Math.max(1, page), pageCount);

  const rows = await prisma.itemCollection.findMany({
    where: { collectionId: col.id },
    orderBy: [{ item: { isPinned: 'desc' } }, { addedAt: 'desc' }],
    skip: (safePage - 1) * perPage,
    take: perPage,
    include: {
      item: {
        include: {
          itemType: { select: { name: true, icon: true, color: true } },
          tags: { select: { name: true } },
        },
      },
    },
  });

  return {
    id: col.id,
    name: col.name,
    slug: col.slug,
    description: col.description,
    isFavorite: col.isFavorite,
    itemCount: meta.itemCount,
    types: meta.types,
    dominantColor: meta.dominantColor,
    pageCount,
    page: safePage,
    items: rows.map((ic) => ({
      id: ic.item.id,
      title: ic.item.title,
      contentType: ic.item.contentType,
      content: ic.item.content,
      url: ic.item.url,
      description: ic.item.description,
      isFavorite: ic.item.isFavorite,
      isPinned: ic.item.isPinned,
      language: ic.item.language,
      createdAt: ic.item.createdAt,
      fileName: ic.item.fileName,
      fileSize: ic.item.fileSize,
      itemType: ic.item.itemType,
      tags: ic.item.tags.map((t) => t.name),
    })),
  };
}

export async function updateCollection(
  collectionId: string,
  userId: string,
  data: UpdateCollectionParsed
): Promise<CollectionDetail> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  });
  if (!existing) throw new Error('Not found');

  return prisma.collection.update({
    where: { id: collectionId },
    data: { name: data.name, slug: toSlug(data.name), description: data.description },
    select: { id: true, name: true, description: true, isFavorite: true, createdAt: true },
  });
}

export async function deleteCollection(
  collectionId: string,
  userId: string
): Promise<void> {
  const existing = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
  });
  if (!existing) throw new Error('Not found');

  await prisma.collection.delete({ where: { id: collectionId } });
}

export type SearchableCollection = {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
};

export async function getSearchableCollections(
  userId: string
): Promise<SearchableCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { items: true } },
    },
  });

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    itemCount: c._count.items,
  }));
}

export async function getCollectionStats(
  userId: string
): Promise<{ total: number; favorites: number }> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
