'use server';

import { auth } from '@/auth';
import {
  updateItem as updateItemQuery,
  deleteItem as deleteItemQuery,
  createItem as createItemQuery,
} from '@/lib/db/items';
import type { ItemDetail } from '@/lib/db/items';
import {
  updateItemSchema,
  type UpdateItemInput,
  createItemSchema,
  type CreateItemInput,
} from '@/lib/validation/item';
import { canCreateItem, isProType } from '@/lib/billing/limits';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createItem(
  input: CreateItemInput
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  const limit = await canCreateItem(session.user.id);
  if (!limit.allowed) {
    return { success: false, error: limit.reason };
  }

  if (isProType(parsed.data.type) && !session.user.isPro) {
    return {
      success: false,
      error: 'File and image items require a Pro plan.',
    };
  }

  try {
    const created = await createItemQuery(session.user.id, parsed.data);
    if (!created) {
      return { success: false, error: 'Failed to create item' };
    }
    return { success: true, data: created };
  } catch {
    return { success: false, error: 'Failed to create item' };
  }
}

export async function updateItem(
  itemId: string,
  input: UpdateItemInput
): Promise<ActionResult<ItemDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!itemId || typeof itemId !== 'string') {
    return { success: false, error: 'Invalid item id' };
  }

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  try {
    const updated = await updateItemQuery(session.user.id, itemId, parsed.data);
    if (!updated) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update item' };
  }
}

export async function deleteItem(
  itemId: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!itemId || typeof itemId !== 'string') {
    return { success: false, error: 'Invalid item id' };
  }

  try {
    const deleted = await deleteItemQuery(session.user.id, itemId);
    if (!deleted) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: { id: itemId } };
  } catch {
    return { success: false, error: 'Failed to delete item' };
  }
}
