'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_HEIGHT = 500;
const MIN_HEIGHT = 300;

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = '',
}: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>(readOnly ? 'preview' : 'write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, MAX_HEIGHT)}px`;
  };

  return (
    <div className="rounded-md overflow-hidden border border-border">
      {/* Header bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#2d2d2d] border-b border-[#3c3c3c]">
        <span className="size-3 rounded-full bg-[#ff5f57] shrink-0" />
        <span className="size-3 rounded-full bg-[#febc2e] shrink-0" />
        <span className="size-3 rounded-full bg-[#28c840] shrink-0" />

        {!readOnly && (
          <div className="flex ml-3 gap-0.5">
            <button
              type="button"
              onClick={() => setTab('write')}
              className={cn(
                'text-xs px-2 py-0.5 rounded cursor-pointer transition-colors',
                tab === 'write'
                  ? 'bg-white/10 text-white'
                  : 'text-[#858585] hover:text-white'
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={cn(
                'text-xs px-2 py-0.5 rounded cursor-pointer transition-colors',
                tab === 'preview'
                  ? 'bg-white/10 text-white'
                  : 'text-[#858585] hover:text-white'
              )}
            >
              Preview
            </button>
          </div>
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

      {/* Content */}
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full bg-[#1e1e1e] text-[#d4d4d4] text-sm resize-none outline-none p-3 overflow-y-auto"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        />
      ) : (
        <div
          className="markdown-preview bg-[#1e1e1e] p-3 overflow-y-auto text-sm"
          style={{ minHeight: MIN_HEIGHT, maxHeight: MAX_HEIGHT }}
        >
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-[#858585] italic text-xs">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
