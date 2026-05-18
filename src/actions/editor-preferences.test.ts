import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateEditorPreferences } from './editor-preferences';
import { DEFAULT_EDITOR_PREFERENCES } from '@/lib/validation/editor-preferences';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const mockAuth = vi.mocked(auth);
const mockUpdate = vi.mocked(prisma.user.update);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateEditorPreferences', () => {
  it('rejects unauthenticated callers', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateEditorPreferences(DEFAULT_EDITOR_PREFERENCES);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Unauthorized');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('rejects invalid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    const result = await updateEditorPreferences({
      ...DEFAULT_EDITOR_PREFERENCES,
      // @ts-expect-error testing invalid value
      theme: 'solarized',
    });
    expect(result.success).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('writes preferences for an authed user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockUpdate.mockResolvedValue({} as never);
    const result = await updateEditorPreferences(DEFAULT_EDITOR_PREFERENCES);
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { editorPreferences: DEFAULT_EDITOR_PREFERENCES },
    });
  });

  it('returns an error when the db throws', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockUpdate.mockRejectedValue(new Error('boom'));
    const result = await updateEditorPreferences(DEFAULT_EDITOR_PREFERENCES);
    expect(result.success).toBe(false);
  });
});
