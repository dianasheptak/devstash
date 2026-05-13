import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/items', () => ({
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

import { deleteItem } from './items';
import { auth } from '@/auth';
import { deleteItem as deleteItemQuery } from '@/lib/db/items';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockDeleteQuery = deleteItemQuery as unknown as ReturnType<typeof vi.fn>;

describe('deleteItem action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns Unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await deleteItem('item-1');
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockDeleteQuery).not.toHaveBeenCalled();
  });

  it('returns Invalid item id when itemId is empty', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const result = await deleteItem('');
    expect(result).toEqual({ success: false, error: 'Invalid item id' });
    expect(mockDeleteQuery).not.toHaveBeenCalled();
  });

  it('returns Item not found when query returns false', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockDeleteQuery.mockResolvedValue(false);
    const result = await deleteItem('missing');
    expect(result).toEqual({ success: false, error: 'Item not found' });
  });

  it('returns success with id when delete succeeds', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockDeleteQuery.mockResolvedValue(true);
    const result = await deleteItem('item-1');
    expect(result).toEqual({ success: true, data: { id: 'item-1' } });
    expect(mockDeleteQuery).toHaveBeenCalledWith('item-1');
  });

  it('returns Failed to delete on query exception', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockDeleteQuery.mockRejectedValue(new Error('db down'));
    const result = await deleteItem('item-1');
    expect(result).toEqual({ success: false, error: 'Failed to delete item' });
  });
});
