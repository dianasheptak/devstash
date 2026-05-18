import { describe, expect, it } from 'vitest';
import { updateItemSchema, createItemSchema } from './item';

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

describe('createItemSchema', () => {
  const baseSnippet = {
    type: 'snippet' as const,
    title: 'My Snippet',
    description: '',
    content: 'const x = 1;',
    url: '',
    language: 'typescript',
    tags: [],
  };

  it('accepts a valid snippet payload', () => {
    const result = createItemSchema.safeParse(baseSnippet);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('snippet');
      expect(result.data.content).toBe('const x = 1;');
      expect(result.data.url).toBeNull();
    }
  });

  it('rejects unknown type', () => {
    const result = createItemSchema.safeParse({ ...baseSnippet, type: 'bogus' });
    expect(result.success).toBe(false);
  });

  it('requires a file payload for file/image types', () => {
    const result = createItemSchema.safeParse({
      type: 'file',
      title: 'A doc',
      description: '',
      content: '',
      url: '',
      language: '',
      tags: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['file']);
    }
  });

  it('accepts a file type with file payload', () => {
    const result = createItemSchema.safeParse({
      type: 'image',
      title: 'A pic',
      description: '',
      content: '',
      url: '',
      language: '',
      tags: [],
      file: {
        fileUrl: 'r2://users/u1/abc.png',
        fileName: 'abc.png',
        fileSize: 1234,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.file?.fileName).toBe('abc.png');
    }
  });

  it('rejects missing title', () => {
    const result = createItemSchema.safeParse({ ...baseSnippet, title: '   ' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/title/i);
    }
  });

  it('requires content for non-link types', () => {
    const result = createItemSchema.safeParse({ ...baseSnippet, content: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['content']);
    }
  });

  it('requires URL for link type', () => {
    const result = createItemSchema.safeParse({
      type: 'link',
      title: 'A link',
      description: '',
      content: '',
      url: '',
      language: '',
      tags: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['url']);
    }
  });

  it('accepts a valid link with URL and ignores content requirement', () => {
    const result = createItemSchema.safeParse({
      type: 'link',
      title: 'Docs',
      description: '',
      content: '',
      url: 'https://example.com',
      language: '',
      tags: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed link URL', () => {
    const result = createItemSchema.safeParse({
      type: 'link',
      title: 'Bad',
      description: '',
      content: '',
      url: 'notaurl',
      language: '',
      tags: [],
    });
    expect(result.success).toBe(false);
  });

  it('normalizes tags', () => {
    const result = createItemSchema.safeParse({
      ...baseSnippet,
      tags: ['react', '  hooks  ', '', 'ts'],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual(['react', 'hooks', 'ts']);
    }
  });
});
