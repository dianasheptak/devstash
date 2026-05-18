import { prisma } from '@/lib/prisma';
import type { CreateCollectionParsed, UpdateCollectionParsed } from '@/lib/validation/collection';
import type { ItemWithMeta } from '@/lib/db/items';

function toSlug(name: string): string {
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

// TODO: replace hardcoded email with session user after auth is set up
async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@devstash.io' },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function getRecentCollections(limit = 6): Promise<CollectionWithMeta[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const safeLimit = Math.min(Math.max(1, limit), 20);

  const collections = await prisma.collection.findMany({
    where: { userId },
    take: safeLimit,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    const itemTypes = col.items.map((ic) => ic.item.itemType);

    const uniqueTypes = Array.from(
      new Map(itemTypes.map((t) => [t.id, t])).values()
    );

    const typeCounts = itemTypes.reduce<Record<string, number>>((acc, t) => {
      acc[t.id] = (acc[t.id] ?? 0) + 1;
      return acc;
    }, {});

    const dominantTypeId = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const dominantColor =
      uniqueTypes.find((t) => t.id === dominantTypeId)?.color ?? '#4b5563';

    return {
      id: col.id,
      name: col.name,
      slug: toSlug(col.name),
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      types: uniqueTypes.map((t) => ({ name: t.name, icon: t.icon, color: t.color })),
      dominantColor,
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

export async function getSidebarCollections(limit = 20): Promise<SidebarCollection[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const safeLimit = Math.min(Math.max(1, limit), 50);

  const collections = await prisma.collection.findMany({
    where: { userId },
    take: safeLimit,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: { select: { id: true, color: true } } },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    const itemTypes = col.items.map((ic) => ic.item.itemType);
    const typeCounts = itemTypes.reduce<Record<string, { count: number; color: string }>>(
      (acc, t) => {
        if (!acc[t.id]) acc[t.id] = { count: 0, color: t.color };
        acc[t.id].count++;
        return acc;
      },
      {}
    );
    const dominantEntry = Object.values(typeCounts).sort((a, b) => b.count - a.count)[0];

    return {
      id: col.id,
      name: col.name,
      slug: toSlug(col.name),
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      dominantColor: dominantEntry?.color ?? '#4b5563',
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

export async function getCollectionsForPicker(): Promise<CollectionPickerItem[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  return prisma.collection.findMany({
    where: { userId },
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' },
  });
}

export async function getAllCollections(): Promise<CollectionWithMeta[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const collections = await prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          item: {
            include: { itemType: true },
          },
        },
      },
    },
  });

  return collections.map((col) => {
    const itemTypes = col.items.map((ic) => ic.item.itemType);
    const uniqueTypes = Array.from(new Map(itemTypes.map((t) => [t.id, t])).values());
    const typeCounts = itemTypes.reduce<Record<string, number>>((acc, t) => {
      acc[t.id] = (acc[t.id] ?? 0) + 1;
      return acc;
    }, {});
    const dominantTypeId = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const dominantColor =
      uniqueTypes.find((t) => t.id === dominantTypeId)?.color ?? '#4b5563';

    return {
      id: col.id,
      name: col.name,
      slug: toSlug(col.name),
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col.items.length,
      types: uniqueTypes.map((t) => ({ name: t.name, icon: t.icon, color: t.color })),
      dominantColor,
    };
  });
}

export type CollectionPage = CollectionWithMeta & {
  items: ItemWithMeta[];
};

export async function getCollectionBySlug(slug: string): Promise<CollectionPage | null> {
  const userId = await getDemoUserId();
  if (!userId) return null;

  const collections = await prisma.collection.findMany({
    where: { userId },
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

  const col = collections.find((c) => toSlug(c.name) === slug);
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
    slug: toSlug(col.name),
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
    data: { name: data.name, description: data.description },
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

export async function getCollectionStats(): Promise<{ total: number; favorites: number }> {
  const userId = await getDemoUserId();
  if (!userId) return { total: 0, favorites: 0 };

  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId } }),
    prisma.collection.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
