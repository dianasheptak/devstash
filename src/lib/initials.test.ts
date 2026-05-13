import { describe, expect, it } from 'vitest';
import { getInitials } from './initials';

describe('getInitials', () => {
  it('returns "?" for null, undefined, empty, or whitespace-only', () => {
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
    expect(getInitials('')).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });

  it('returns a single uppercase initial for a one-word name', () => {
    expect(getInitials('madonna')).toBe('M');
    expect(getInitials('  Cher  ')).toBe('C');
  });

  it('combines first and last initials for multi-word names', () => {
    expect(getInitials('Brad Traversy')).toBe('BT');
    expect(getInitials('mary jane watson')).toBe('MW');
    expect(getInitials('  Ada   Lovelace  ')).toBe('AL');
  });
});
