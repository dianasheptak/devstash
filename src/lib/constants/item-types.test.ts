import { describe, expect, it } from 'vitest';
import { slugToTypeName } from './item-types';

describe('slugToTypeName', () => {
  it('maps plural slugs to singular type names', () => {
    expect(slugToTypeName('snippets')).toBe('snippet');
    expect(slugToTypeName('prompts')).toBe('prompt');
    expect(slugToTypeName('commands')).toBe('command');
    expect(slugToTypeName('notes')).toBe('note');
    expect(slugToTypeName('files')).toBe('file');
    expect(slugToTypeName('images')).toBe('image');
    expect(slugToTypeName('links')).toBe('link');
  });

  it('accepts already-singular forms', () => {
    expect(slugToTypeName('snippet')).toBe('snippet');
    expect(slugToTypeName('note')).toBe('note');
  });

  it('returns null for unknown slugs', () => {
    expect(slugToTypeName('unknown')).toBeNull();
    expect(slugToTypeName('')).toBeNull();
    expect(slugToTypeName('SNIPPETS')).toBeNull();
  });
});
