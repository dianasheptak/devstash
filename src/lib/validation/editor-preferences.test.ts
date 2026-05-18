import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EDITOR_PREFERENCES,
  editorPreferencesSchema,
  parseEditorPreferences,
} from './editor-preferences';

describe('editorPreferencesSchema', () => {
  it('accepts a fully valid object', () => {
    const result = editorPreferencesSchema.safeParse({
      fontSize: 14,
      tabSize: 4,
      wordWrap: false,
      minimap: true,
      theme: 'monokai',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unsupported font size', () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      fontSize: 9,
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported theme', () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      theme: 'solarized',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unsupported tab size', () => {
    const result = editorPreferencesSchema.safeParse({
      ...DEFAULT_EDITOR_PREFERENCES,
      tabSize: 3,
    });
    expect(result.success).toBe(false);
  });
});

describe('parseEditorPreferences', () => {
  it('returns defaults for null', () => {
    expect(parseEditorPreferences(null)).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it('returns defaults for garbage', () => {
    expect(parseEditorPreferences('nope')).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });

  it('fills missing keys with defaults', () => {
    const parsed = parseEditorPreferences({ theme: 'github-dark' });
    expect(parsed.theme).toBe('github-dark');
    expect(parsed.fontSize).toBe(DEFAULT_EDITOR_PREFERENCES.fontSize);
    expect(parsed.minimap).toBe(DEFAULT_EDITOR_PREFERENCES.minimap);
  });

  it('falls back to defaults when a stored value is invalid', () => {
    const parsed = parseEditorPreferences({
      fontSize: 14,
      tabSize: 4,
      wordWrap: true,
      minimap: false,
      theme: 'bogus',
    });
    expect(parsed).toEqual(DEFAULT_EDITOR_PREFERENCES);
  });
});
