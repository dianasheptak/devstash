import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollection } from './collections';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
}));

import { auth } from '@/auth';
import { createCollection as createCollectionQuery } from '@/lib/db/collections';

const mockAuth = vi.mocked(auth);
const mockQuery = vi.mocked(createCollectionQuery);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createCollection action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createCollection({ name: 'Test' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Unauthorized');
  });

  it('returns validation error for empty name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    const result = await createCollection({ name: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/required/i);
  });

  it('returns success and collection data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    const fakeCollection = {
      id: 'c1',
      name: 'My Collection',
      description: null,
      isFavorite: false,
      createdAt: new Date(),
    };
    mockQuery.mockResolvedValue(fakeCollection);

    const result = await createCollection({ name: 'My Collection' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('c1');
      expect(result.data.name).toBe('My Collection');
    }
  });

  it('returns error on db exception', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockQuery.mockRejectedValue(new Error('DB error'));

    const result = await createCollection({ name: 'Test' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Failed to create collection');
  });
});
