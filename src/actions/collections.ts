'use server';

import { auth } from '@/auth';
import { createCollection as createCollectionQuery } from '@/lib/db/collections';
import type { CollectionDetail } from '@/lib/db/collections';
import { createCollectionSchema, type CreateCollectionInput } from '@/lib/validation/collection';
import type { ActionResult } from '@/actions/items';

export async function createCollection(
  input: CreateCollectionInput
): Promise<ActionResult<CollectionDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createCollectionSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  try {
    const created = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: created };
  } catch {
    return { success: false, error: 'Failed to create collection' };
  }
}
