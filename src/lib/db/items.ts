import { prisma } from '@/lib/prisma';

export type SidebarItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

const ITEM_TYPE_ORDER = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link'];

export async function getSystemItemTypes(): Promise<SidebarItemType[]> {
  const userId = await getDemoUserId();

  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: { id: true, name: true, icon: true, color: true },
    }),
    userId
      ? prisma.item.groupBy({
          by: ['itemTypeId'],
          where: { userId },
          _count: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.itemTypeId, c._count.id])
  );

  return types
    .sort((a, b) => ITEM_TYPE_ORDER.indexOf(a.name) - ITEM_TYPE_ORDER.indexOf(b.name))
    .map((t) => ({ ...t, count: countMap[t.id] ?? 0 }));
}

export type ItemWithMeta = {
  id: string;
  title: string;
  contentType: 'TEXT' | 'FILE' | 'URL';
  content: string | null;
  url: string | null;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  language: string | null;
  createdAt: Date;
  itemType: { name: string; icon: string; color: string };
  tags: string[];
};

// TODO: replace hardcoded email with session user after auth is set up
async function getDemoUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@devstash.io' },
    select: { id: true },
  });
  return user?.id ?? null;
}

function mapItem(item: {
  id: string;
  title: string;
  contentType: 'TEXT' | 'FILE' | 'URL';
  content: string | null;
  url: string | null;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  language: string | null;
  createdAt: Date;
  itemType: { name: string; icon: string; color: string };
  tags: { name: string }[];
}): ItemWithMeta {
  return {
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
    itemType: item.itemType,
    tags: item.tags.map((t) => t.name),
  };
}

const itemInclude = {
  itemType: { select: { name: true, icon: true, color: true } },
  tags: { select: { name: true } },
} as const;

export async function getPinnedItems(limit = 20): Promise<ItemWithMeta[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const safeLimit = Math.min(Math.max(1, limit), 50);

  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    take: safeLimit,
    orderBy: { updatedAt: 'desc' },
    include: itemInclude,
  });

  return items.map(mapItem);
}

export async function getRecentItems(limit = 10): Promise<ItemWithMeta[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const safeLimit = Math.min(Math.max(1, limit), 50);

  const items = await prisma.item.findMany({
    where: { userId },
    take: safeLimit,
    orderBy: { createdAt: 'desc' },
    include: itemInclude,
  });

  return items.map(mapItem);
}

export async function getItemsByType(typeName: string): Promise<ItemWithMeta[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const items = await prisma.item.findMany({
    where: { userId, itemType: { name: typeName, isSystem: true } },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: itemInclude,
  });

  return items.map(mapItem);
}

export type ItemDetail = ItemWithMeta & {
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  collections: { id: string; name: string }[];
};

export async function getItemDetailById(itemId: string): Promise<ItemDetail | null> {
  const userId = await getDemoUserId();
  if (!userId) return null;

  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      itemType: { select: { name: true, icon: true, color: true } },
      tags: { select: { name: true } },
      collections: {
        select: { collection: { select: { id: true, name: true } } },
      },
    },
  });
  if (!item) return null;

  return {
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
    itemType: item.itemType,
    tags: item.tags.map((t) => t.name),
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    collections: item.collections.map((c) => c.collection),
  };
}

export type UpdateItemInput = {
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
};

export async function updateItem(
  itemId: string,
  data: UpdateItemInput
): Promise<ItemDetail | null> {
  const userId = await getDemoUserId();
  if (!userId) return null;

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        set: [],
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  });

  return getItemDetailById(itemId);
}

export async function deleteItem(itemId: string): Promise<boolean> {
  const userId = await getDemoUserId();
  if (!userId) return false;

  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.item.delete({ where: { id: itemId } });
  return true;
}

export async function getItemStats(): Promise<{ total: number; favorites: number }> {
  const userId = await getDemoUserId();
  if (!userId) return { total: 0, favorites: 0 };

  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
