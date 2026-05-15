import "server-only";
import { prisma } from "@/lib/prisma";

export const FREE_LIMITS = {
  items: 50,
  collections: 3,
} as const;

export type LimitResult =
  | { allowed: true }
  | { allowed: false; reason: string };

const PRO_TYPES = new Set(["file", "image"]);

export function isProType(type: string): boolean {
  return PRO_TYPES.has(type);
}

export async function canCreateItem(userId: string): Promise<LimitResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  if (!user) return { allowed: false, reason: "User not found" };
  if (user.isPro) return { allowed: true };

  const count = await prisma.item.count({ where: { userId } });
  if (count >= FREE_LIMITS.items) {
    return {
      allowed: false,
      reason: `Free plan is limited to ${FREE_LIMITS.items} items. Upgrade to Pro for unlimited items.`,
    };
  }
  return { allowed: true };
}

export async function canCreateCollection(userId: string): Promise<LimitResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });
  if (!user) return { allowed: false, reason: "User not found" };
  if (user.isPro) return { allowed: true };

  const count = await prisma.collection.count({ where: { userId } });
  if (count >= FREE_LIMITS.collections) {
    return {
      allowed: false,
      reason: `Free plan is limited to ${FREE_LIMITS.collections} collections. Upgrade to Pro for unlimited collections.`,
    };
  }
  return { allowed: true };
}
