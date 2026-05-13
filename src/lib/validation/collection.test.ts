import { describe, it, expect } from 'vitest';
import { createCollectionSchema } from './collection';

describe('createCollectionSchema', () => {
  it('accepts a valid name', () => {
    const result = createCollectionSchema.safeParse({ name: 'React Patterns' });
    expect(result.success).toBe(true);
  });

  it('trims name whitespace', () => {
    const result = createCollectionSchema.safeParse({ name: '  My Collection  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('My Collection');
  });

  it('rejects an empty name', () => {
    const result = createCollectionSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a name over 100 characters', () => {
    const result = createCollectionSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('coerces empty description to null', () => {
    const result = createCollectionSchema.safeParse({ name: 'Test', description: '' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });

  it('trims and keeps non-empty description', () => {
    const result = createCollectionSchema.safeParse({ name: 'Test', description: '  my desc  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBe('my desc');
  });

  it('accepts missing description as null', () => {
    const result = createCollectionSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.description).toBeNull();
  });
});
