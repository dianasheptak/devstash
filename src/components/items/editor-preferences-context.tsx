'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import {
  DEFAULT_EDITOR_PREFERENCES,
  type EditorPreferences,
} from '@/lib/validation/editor-preferences';

type EditorPreferencesContextValue = {
  prefs: EditorPreferences;
  setPrefs: (next: EditorPreferences) => void;
};

const EditorPreferencesContext = createContext<EditorPreferencesContextValue>({
  prefs: DEFAULT_EDITOR_PREFERENCES,
  setPrefs: () => {},
});

export function EditorPreferencesProvider({
  initialPrefs,
  children,
}: {
  initialPrefs: EditorPreferences;
  children: React.ReactNode;
}) {
  const [prefs, setPrefsState] = useState<EditorPreferences>(initialPrefs);
  const setPrefs = useCallback((next: EditorPreferences) => setPrefsState(next), []);
  return (
    <EditorPreferencesContext.Provider value={{ prefs, setPrefs }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext);
}
