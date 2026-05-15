import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/db/items', () => ({
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  createItem: vi.fn(),
}));

import { deleteItem, createItem } from './items';
import { auth } from '@/auth';
import {
  deleteItem as deleteItemQuery,
  createItem as createItemQuery,
} from '@/lib/db/items';

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockDeleteQuery = deleteItemQuery as unknown as ReturnType<typeof vi.fn>;
const mockCreateQuery = createItemQuery as unknown as ReturnType<typeof vi.fn>;

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
    expect(mockDeleteQuery).toHaveBeenCalledWith('u1', 'item-1');
  });

  it('returns Failed to delete on query exception', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockDeleteQuery.mockRejectedValue(new Error('db down'));
    const result = await deleteItem('item-1');
    expect(result).toEqual({ success: false, error: 'Failed to delete item' });
  });
});

describe('createItem action', () => {
  const validSnippet = {
    type: 'snippet' as const,
    title: 'My Snippet',
    description: '',
    content: 'const x = 1;',
    url: '',
    language: 'typescript',
    tags: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns Unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null);
    const result = await createItem(validSnippet);
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockCreateQuery).not.toHaveBeenCalled();
  });

  it('returns validation error for missing title', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const result = await createItem({ ...validSnippet, title: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/title/i);
    expect(mockCreateQuery).not.toHaveBeenCalled();
  });

  it('returns validation error when link is missing URL', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const result = await createItem({
      ...validSnippet,
      type: 'link',
      content: '',
      url: '',
    });
    expect(result.success).toBe(false);
    expect(mockCreateQuery).not.toHaveBeenCalled();
  });

  it('returns success when query resolves to a created item', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    const fake = { id: 'item-new', title: 'My Snippet' };
    mockCreateQuery.mockResolvedValue(fake);
    const result = await createItem(validSnippet);
    expect(result).toEqual({ success: true, data: fake });
    expect(mockCreateQuery).toHaveBeenCalledOnce();
  });

  it('returns failure when query returns null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCreateQuery.mockResolvedValue(null);
    const result = await createItem(validSnippet);
    expect(result).toEqual({ success: false, error: 'Failed to create item' });
  });

  it('returns Failed to create on query exception', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u1' } });
    mockCreateQuery.mockRejectedValue(new Error('db down'));
    const result = await createItem(validSnippet);
    expect(result).toEqual({ success: false, error: 'Failed to create item' });
  });
});
