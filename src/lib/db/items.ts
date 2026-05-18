import { prisma } from '@/lib/prisma';
import { deleteFromR2, objectKeyFromUrl } from '@/lib/r2';

export type SidebarItemType = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

const ITEM_TYPE_ORDER = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link'];

export async function getSystemItemTypes(userId: string): Promise<SidebarItemType[]> {
  const [types, counts] = await Promise.all([
    prisma.itemType.findMany({
      where: { isSystem: true },
      select: { id: true, name: true, icon: true, color: true },
    }),
    prisma.item.groupBy({
      by: ['itemTypeId'],
      where: { userId },
      _count: { id: true },
    }),
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
  fileName: string | null;
  fileSize: number | null;
  itemType: { name: string; icon: string; color: string };
  tags: string[];
};

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
  fileName: string | null;
  fileSize: number | null;
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
    fileName: item.fileName,
    fileSize: item.fileSize,
    itemType: item.itemType,
    tags: item.tags.map((t) => t.name),
  };
}

const itemInclude = {
  itemType: { select: { name: true, icon: true, color: true } },
  tags: { select: { name: true } },
} as const;

export async function getPinnedItems(userId: string, limit = 20): Promise<ItemWithMeta[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50);

  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    take: safeLimit,
    orderBy: { updatedAt: 'desc' },
    include: itemInclude,
  });

  return items.map(mapItem);
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithMeta[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50);

  const items = await prisma.item.findMany({
    where: { userId },
    take: safeLimit,
    orderBy: { createdAt: 'desc' },
    include: itemInclude,
  });

  return items.map(mapItem);
}

export async function getItemsByType(userId: string, typeName: string): Promise<ItemWithMeta[]> {
  const items = await prisma.item.findMany({
    where: { userId, itemType: { name: typeName, isSystem: true } },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: itemInclude,
  });

  return items.map(mapItem);
}

export type ItemDetail = ItemWithMeta & {
  fileUrl: string | null;
  collections: { id: string; name: string }[];
};

export async function getItemDetailById(userId: string, itemId: string): Promise<ItemDetail | null> {
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
  collectionIds: string[];
};

export async function updateItem(
  userId: string,
  itemId: string,
  data: UpdateItemInput
): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  if (data.collectionIds.length > 0) {
    const owned = await prisma.collection.findMany({
      where: { id: { in: data.collectionIds }, userId },
      select: { id: true },
    });
    if (owned.length !== data.collectionIds.length) return null;
  }

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
      collections: {
        deleteMany: {},
        create: data.collectionIds.map((collectionId) => ({ collectionId })),
      },
    },
  });

  return getItemDetailById(userId, itemId);
}

export type CreatableType =
  | 'snippet'
  | 'prompt'
  | 'command'
  | 'note'
  | 'link'
  | 'file'
  | 'image';

export type CreateItemData = {
  type: CreatableType;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  tags: string[];
  collectionIds: string[];
  file: { fileUrl: string; fileName: string; fileSize: number } | null;
};

export async function createItem(userId: string, data: CreateItemData): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.type, isSystem: true },
    select: { id: true },
  });
  if (!itemType) return null;

  if (data.collectionIds.length > 0) {
    const owned = await prisma.collection.findMany({
      where: { id: { in: data.collectionIds }, userId },
      select: { id: true },
    });
    if (owned.length !== data.collectionIds.length) return null;
  }

  const isFileType = data.type === 'file' || data.type === 'image';
  const contentType = data.type === 'link' ? 'URL' : isFileType ? 'FILE' : 'TEXT';

  const created = await prisma.item.create({
    data: {
      userId,
      itemTypeId: itemType.id,
      contentType,
      title: data.title,
      description: data.description,
      content: isFileType || data.type === 'link' ? null : data.content,
      url: data.type === 'link' ? data.url : null,
      language: data.type === 'snippet' || data.type === 'command' ? data.language : null,
      fileUrl: isFileType ? data.file?.fileUrl ?? null : null,
      fileName: isFileType ? data.file?.fileName ?? null : null,
      fileSize: isFileType ? data.file?.fileSize ?? null : null,
      tags: {
        connectOrCreate: data.tags.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
      collections: data.collectionIds.length > 0
        ? { create: data.collectionIds.map((collectionId) => ({ collectionId })) }
        : undefined,
    },
    select: { id: true },
  });

  return getItemDetailById(userId, created.id);
}

export async function deleteItem(userId: string, itemId: string): Promise<boolean> {
  const existing = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { id: true, fileUrl: true },
  });
  if (!existing) return false;

  await prisma.item.delete({ where: { id: itemId } });

  if (existing.fileUrl) {
    const key = objectKeyFromUrl(existing.fileUrl);
    if (key) {
      deleteFromR2(key).catch((err) => {
        console.error('Failed to delete R2 object', { key, err });
      });
    }
  }

  return true;
}

export type SearchableItem = {
  id: string;
  title: string;
  type: string;
  icon: string;
  color: string;
  preview: string | null;
};

export async function getSearchableItems(userId: string): Promise<SearchableItem[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      url: true,
      description: true,
      itemType: { select: { name: true, icon: true, color: true } },
    },
  });

  return items.map((i) => {
    const raw = i.description ?? i.content ?? i.url ?? '';
    const preview = raw ? raw.replace(/\s+/g, ' ').trim().slice(0, 120) : null;
    return {
      id: i.id,
      title: i.title,
      type: i.itemType.name,
      icon: i.itemType.icon,
      color: i.itemType.color,
      preview,
    };
  });
}

export async function getItemStats(userId: string): Promise<{ total: number; favorites: number }> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ]);

  return { total, favorites };
}
