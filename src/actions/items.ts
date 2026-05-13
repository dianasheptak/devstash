'use server';

import { auth } from '@/auth';
import { updateItem as updateItemQuery } from '@/lib/db/items';
import type { ItemDetail } from '@/lib/db/items';
import { updateItemSchema, type UpdateItemInput } from '@/lib/validation/item';

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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
    const updated = await updateItemQuery(itemId, parsed.data);
    if (!updated) {
      return { success: false, error: 'Item not found' };
    }
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update item' };
  }
}
