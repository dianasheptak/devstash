import { describe, expect, it } from 'vitest';
import { updateItemSchema } from './item';

describe('updateItemSchema', () => {
  const base = {
    title: 'My Title',
    description: '',
    content: '',
    url: '',
    language: '',
    tags: [],
  };

  it('parses a minimal valid payload and nulls empty strings', () => {
    const result = updateItemSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('My Title');
      expect(result.data.description).toBeNull();
      expect(result.data.content).toBeNull();
      expect(result.data.url).toBeNull();
      expect(result.data.language).toBeNull();
      expect(result.data.tags).toEqual([]);
    }
  });

  it('rejects an empty/whitespace title', () => {
    const result = updateItemSchema.safeParse({ ...base, title: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/title/i);
    }
  });

  it('trims tags and drops empty entries', () => {
    const result = updateItemSchema.safeParse({
      ...base,
      tags: ['react', '  hooks  ', '', '   ', 'typescript'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(['react', 'hooks', 'typescript']);
    }
  });

  it('accepts a valid URL', () => {
    const result = updateItemSchema.safeParse({
      ...base,
      url: 'https://example.com/path',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe('https://example.com/path');
    }
  });

  it('rejects a malformed URL', () => {
    const result = updateItemSchema.safeParse({ ...base, url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('treats whitespace-only URL as null', () => {
    const result = updateItemSchema.safeParse({ ...base, url: '   ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.url).toBeNull();
  });

  it('trims the title', () => {
    const result = updateItemSchema.safeParse({ ...base, title: '  Hello  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe('Hello');
  });
});
