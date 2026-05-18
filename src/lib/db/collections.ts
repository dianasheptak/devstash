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

export async function getAllCollections(
  userId: string
): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
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

export type CollectionPage = CollectionWithMeta & {
  items: ItemWithMeta[];
};

export async function getCollectionBySlug(
  userId: string,
  slug: string
): Promise<CollectionPage | null> {
  const col = await prisma.collection.findFirst({
    where: { userId, slug },
    include: {
      items: {
        orderBy: [{ item: { isPinned: 'desc' } }, { addedAt: 'desc' }],
        include: {
          item: {
            include: {
              itemType: { select: { name: true, icon: true, color: true } },
              tags: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!col) return null;

  const rawItems = col.items.map((ic) => ic.item);
  const itemTypes = rawItems.map((item) => item.itemType);
  const uniqueTypes = Array.from(new Map(itemTypes.map((t) => [t.name, t])).values());
  const typeCounts = itemTypes.reduce<Record<string, number>>((acc, t) => {
    acc[t.name] = (acc[t.name] ?? 0) + 1;
    return acc;
  }, {});
  const dominantTypeName = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const dominantColor =
    uniqueTypes.find((t) => t.name === dominantTypeName)?.color ?? '#4b5563';

  return {
    id: col.id,
    name: col.name,
    slug: col.slug,
    description: col.description,
    isFavorite: col.isFavorite,
    itemCount: rawItems.length,
    types: uniqueTypes.map((t) => ({ name: t.name, icon: t.icon, color: t.color })),
    dominantColor,
    items: rawItems.map((item) => ({
      id: item.id,
      title: item.title,
      contentType: item.contentType,
      content: item.content,
      url: item.url,
      description: item.description,
      isFavorite: item.isFavorite,
      isPinned: item.isPinned,
      language: item.language,
      createdAt: item.createdAt,
      fileName: item.fileName,
      fileSize: item.fileSize,
      itemType: item.itemType,
      tags: item.tags.map((t) => t.name),
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

export async function getCollectionStats(
  userId: string
): Promise<{ total: number; favorites: number }> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
