'use client';

import { useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_EDITOR_PREFERENCES,
  EDITOR_FONT_SIZES,
  EDITOR_TAB_SIZES,
  EDITOR_THEMES,
  type EditorPreferences,
  type EditorTheme,
} from '@/lib/validation/editor-preferences';
import { updateEditorPreferences } from '@/actions/editor-preferences';
import { useEditorPreferences } from '@/components/items/editor-preferences-context';

const THEME_LABELS: Record<EditorTheme, string> = {
  'vs-dark': 'VS Dark',
  monokai: 'Monokai',
  'github-dark': 'GitHub Dark',
};

export function EditorPreferencesForm({ initial }: { initial: EditorPreferences }) {
  const { prefs, setPrefs } = useEditorPreferences();
  const [isPending, startTransition] = useTransition();

  // Sync from server snapshot once on mount via initial; thereafter context owns state.
  // (initial is used by the page render to seed the provider.)
  void initial;

  function persist(next: EditorPreferences) {
    setPrefs(next);
    startTransition(async () => {
      const result = await updateEditorPreferences(next);
      if (result.success) {
        toast.success('Preferences saved', { id: 'editor-prefs' });
      } else {
        toast.error(result.error, { id: 'editor-prefs' });
      }
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Font size">
          <Select
            value={String(prefs.fontSize)}
            onChange={(v) => persist({ ...prefs, fontSize: Number(v) })}
            disabled={isPending}
          >
            {EDITOR_FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Tab size">
          <Select
            value={String(prefs.tabSize)}
            onChange={(v) => persist({ ...prefs, tabSize: Number(v) })}
            disabled={isPending}
          >
            {EDITOR_TAB_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} spaces
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Theme">
          <Select
            value={prefs.theme}
            onChange={(v) => persist({ ...prefs, theme: v as EditorTheme })}
            disabled={isPending}
          >
            {EDITOR_THEMES.map((t) => (
              <option key={t} value={t}>
                {THEME_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <Toggle
          label="Word wrap"
          description="Wrap long lines instead of horizontal scrolling"
          checked={prefs.wordWrap}
          onChange={(v) => persist({ ...prefs, wordWrap: v })}
          disabled={isPending}
        />
        <Toggle
          label="Minimap"
          description="Show a small code overview on the right side"
          checked={prefs.minimap}
          onChange={(v) => persist({ ...prefs, minimap: v })}
          disabled={isPending}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Defaults: {DEFAULT_EDITOR_PREFERENCES.fontSize}px,{' '}
        {DEFAULT_EDITOR_PREFERENCES.tabSize}-space tabs, word wrap on, minimap off,{' '}
        {THEME_LABELS[DEFAULT_EDITOR_PREFERENCES.theme]}.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-9 text-sm cursor-pointer disabled:opacity-60"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-1 cursor-pointer">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 mt-1 cursor-pointer accent-primary"
      />
    </label>
  );
}
