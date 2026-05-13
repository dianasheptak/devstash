'use client';

import { useState, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const MAX_HEIGHT = 400;
const MIN_HEIGHT = 80;

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
  const [height, setHeight] = useState(MIN_HEIGHT);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const resolvedLanguage = language?.trim().toLowerCase() || 'plaintext';

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
        theme="vs-dark"
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
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 12,
          lineNumbers: 'on',
          automaticLayout: true,
          wordWrap: 'on',
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
