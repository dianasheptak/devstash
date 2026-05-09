import { prisma } from '@/lib/prisma';

const ITEM_TYPE_ORDER = ['snippet', 'prompt', 'command', 'note', 'file', 'image', 'link'];

export type ProfileTypeBreakdown = {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
};

export type ProfileData = {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    createdAt: Date;
    hasPassword: boolean;
  };
  totals: {
    items: number;
    collections: number;
  };
  breakdown: ProfileTypeBreakdown[];
};

export async function getProfileData(userId: string): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      password: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const [items, collections, types, counts] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
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

  const countMap = Object.fromEntries(counts.map((c) => [c.itemTypeId, c._count.id]));

  const breakdown = types
    .sort((a, b) => ITEM_TYPE_ORDER.indexOf(a.name) - ITEM_TYPE_ORDER.indexOf(b.name))
    .map((t) => ({ ...t, count: countMap[t.id] ?? 0 }));

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: user.createdAt,
      hasPassword: user.password !== null,
    },
    totals: { items, collections },
    breakdown,
  };
}
