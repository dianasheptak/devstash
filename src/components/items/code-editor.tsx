'use client';

import { useState, useRef, useEffect } from 'react';
import Editor, { type OnMount, loader } from '@monaco-editor/react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useEditorPreferences } from './editor-preferences-context';

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 80;

// Monokai theme definition for Monaco
const MONOKAI_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '75715E', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'F92672' },
    { token: 'string', foreground: 'E6DB74' },
    { token: 'number', foreground: 'AE81FF' },
    { token: 'type', foreground: '66D9EF', fontStyle: 'italic' },
    { token: 'function', foreground: 'A6E22E' },
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#F8F8F2',
    'editor.lineHighlightBackground': '#3E3D32',
    'editor.selectionBackground': '#49483E',
    'editorCursor.foreground': '#F8F8F0',
  },
};

const GITHUB_DARK_THEME = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'FF7B72' },
    { token: 'string', foreground: 'A5D6FF' },
    { token: 'number', foreground: '79C0FF' },
    { token: 'type', foreground: 'FFA657' },
    { token: 'function', foreground: 'D2A8FF' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#c9d1d9',
    'editor.lineHighlightBackground': '#161b22',
    'editor.selectionBackground': '#264F78',
    'editorCursor.foreground': '#c9d1d9',
  },
};

let customThemesRegistered = false;
function registerCustomThemes() {
  if (customThemesRegistered) return;
  customThemesRegistered = true;
  loader.init().then((monaco) => {
    monaco.editor.defineTheme('monokai', MONOKAI_THEME);
    monaco.editor.defineTheme('github-dark', GITHUB_DARK_THEME);
  });
}

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: CodeEditorProps) {
  const { prefs } = useEditorPreferences();
  const [height, setHeight] = useState(MIN_HEIGHT);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const resolvedLanguage = language?.trim().toLowerCase() || 'plaintext';

  useEffect(() => {
    registerCustomThemes();
  }, []);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    const updateHeight = () => {
      const contentHeight = editor.getContentHeight();
      setHeight(Math.max(MIN_HEIGHT, Math.min(contentHeight, MAX_HEIGHT)));
    };

    updateHeight();
    editor.onDidContentSizeChange(updateHeight);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {/* macOS window bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#1e1e1e] border-b border-[#3c3c3c]">
        <span className="size-3 rounded-full bg-[#ff5f57] shrink-0" />
        <span className="size-3 rounded-full bg-[#febc2e] shrink-0" />
        <span className="size-3 rounded-full bg-[#28c840] shrink-0" />
        {resolvedLanguage !== 'plaintext' && (
          <span className="ml-3 text-xs text-[#858585] select-none">
            {resolvedLanguage}
          </span>
        )}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleCopy}
          className="ml-auto h-6 w-6 text-[#858585] hover:text-white hover:bg-white/10 cursor-pointer"
          title="Copy"
        >
          <Copy className="size-3" />
        </Button>
      </div>

      {/* Editor */}
      <Editor
        height={height}
        value={value}
        language={resolvedLanguage}
        theme={prefs.theme}
        onMount={handleMount}
        onChange={readOnly ? undefined : (v) => onChange?.(v ?? '')}
        loading={
          <div
            className="w-full animate-pulse bg-[#1e1e1e]"
            style={{ height: MIN_HEIGHT }}
          />
        }
        options={{
          readOnly,
          minimap: { enabled: prefs.minimap },
          scrollBeyondLastLine: false,
          fontSize: prefs.fontSize,
          tabSize: prefs.tabSize,
          lineNumbers: 'on',
          automaticLayout: true,
          wordWrap: prefs.wordWrap ? 'on' : 'off',
          padding: { top: 12, bottom: 12 },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}
