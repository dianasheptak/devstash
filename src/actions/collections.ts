'use server';

import { auth } from '@/auth';
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
} from '@/lib/db/collections';
import type { CollectionDetail } from '@/lib/db/collections';
import {
  createCollectionSchema,
  updateCollectionSchema,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from '@/lib/validation/collection';
import type { ActionResult } from '@/actions/items';
import { canCreateCollection } from '@/lib/billing/limits';

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

  const limit = await canCreateCollection(session.user.id);
  if (!limit.allowed) {
    return { success: false, error: limit.reason };
  }

  try {
    const created = await createCollectionQuery(session.user.id, parsed.data);
    return { success: true, data: created };
  } catch {
    return { success: false, error: 'Failed to create collection' };
  }
}

export async function updateCollection(
  collectionId: string,
  input: UpdateCollectionInput
): Promise<ActionResult<CollectionDetail>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!collectionId) {
    return { success: false, error: 'Invalid collection ID' };
  }

  const parsed = updateCollectionSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  try {
    const updated = await updateCollectionQuery(collectionId, session.user.id, parsed.data);
    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to update collection' };
  }
}

export async function deleteCollection(
  collectionId: string
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!collectionId) {
    return { success: false, error: 'Invalid collection ID' };
  }

  try {
    await deleteCollectionQuery(collectionId, session.user.id);
    return { success: true, data: { id: collectionId } };
  } catch {
    return { success: false, error: 'Failed to delete collection' };
  }
}
