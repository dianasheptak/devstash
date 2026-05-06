import { prisma } from '@/lib/prisma';

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

export async function getPinnedItems(): Promise<ItemWithMeta[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    orderBy: { updatedAt: 'desc' },
    include: itemInclude,
  });

  return items.map(mapItem);
}

export async function getRecentItems(limit = 10): Promise<ItemWithMeta[]> {
  const userId = await getDemoUserId();
  if (!userId) return [];

  const items = await prisma.item.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: itemInclude,
  });

  return items.map(mapItem);
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
