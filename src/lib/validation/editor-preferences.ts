import { z } from 'zod';

export const EDITOR_FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20] as const;
export const EDITOR_TAB_SIZES = [2, 4, 8] as const;
export const EDITOR_THEMES = ['vs-dark', 'monokai', 'github-dark'] as const;

export type EditorTheme = (typeof EDITOR_THEMES)[number];

export const editorPreferencesSchema = z.object({
  fontSize: z.number().int().refine((v) => (EDITOR_FONT_SIZES as readonly number[]).includes(v), {
    message: 'Invalid font size',
  }),
  tabSize: z.number().int().refine((v) => (EDITOR_TAB_SIZES as readonly number[]).includes(v), {
    message: 'Invalid tab size',
  }),
  wordWrap: z.boolean(),
  minimap: z.boolean(),
  theme: z.enum(EDITOR_THEMES),
});

export type EditorPreferences = z.output<typeof editorPreferencesSchema>;

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  fontSize: 12,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: 'vs-dark',
};

export function parseEditorPreferences(value: unknown): EditorPreferences {
  const parsed = editorPreferencesSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  // Merge partial stored value with defaults so missing keys fall back cleanly.
  if (value && typeof value === 'object') {
    const merged = { ...DEFAULT_EDITOR_PREFERENCES, ...(value as Record<string, unknown>) };
    const second = editorPreferencesSchema.safeParse(merged);
    if (second.success) return second.data;
  }
  return DEFAULT_EDITOR_PREFERENCES;
}
