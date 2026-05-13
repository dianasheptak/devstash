import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCollection, updateCollection, deleteCollection } from './collections';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  deleteCollection: vi.fn(),
}));

import { auth } from '@/auth';
import {
  createCollection as createCollectionQuery,
  updateCollection as updateCollectionQuery,
  deleteCollection as deleteCollectionQuery,
} from '@/lib/db/collections';

const mockAuth = vi.mocked(auth);
const mockQuery = vi.mocked(createCollectionQuery);
const mockUpdateQuery = vi.mocked(updateCollectionQuery);
const mockDeleteQuery = vi.mocked(deleteCollectionQuery);

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

describe('updateCollection action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateCollection('c1', { name: 'Updated' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Unauthorized');
  });

  it('returns validation error for empty name', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    const result = await updateCollection('c1', { name: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/required/i);
  });

  it('returns success with updated data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    const fake = { id: 'c1', name: 'Updated', description: null, isFavorite: false, createdAt: new Date() };
    mockUpdateQuery.mockResolvedValue(fake);

    const result = await updateCollection('c1', { name: 'Updated' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('Updated');
  });

  it('returns error on db exception', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockUpdateQuery.mockRejectedValue(new Error('DB error'));

    const result = await updateCollection('c1', { name: 'Test' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Failed to update collection');
  });
});

describe('deleteCollection action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await deleteCollection('c1');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Unauthorized');
  });

  it('returns success on delete', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockDeleteQuery.mockResolvedValue(undefined);

    const result = await deleteCollection('c1');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.id).toBe('c1');
  });

  it('returns error on db exception', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } } as never);
    mockDeleteQuery.mockRejectedValue(new Error('DB error'));

    const result = await deleteCollection('c1');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Failed to delete collection');
  });
});
