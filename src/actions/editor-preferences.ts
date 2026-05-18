'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  editorPreferencesSchema,
  type EditorPreferences,
} from '@/lib/validation/editor-preferences';
import type { ActionResult } from '@/actions/items';

export async function updateEditorPreferences(
  input: EditorPreferences
): Promise<ActionResult<EditorPreferences>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = editorPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? 'Invalid input' };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { editorPreferences: parsed.data },
    });
    return { success: true, data: parsed.data };
  } catch {
    return { success: false, error: 'Failed to save preferences' };
  }
}
