'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Code, Sparkles, Terminal, StickyNote, Link as LinkIcon, type LucideIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createItem } from '@/actions/items';
import {
  CREATABLE_ITEM_TYPES,
  type CreatableItemType,
} from '@/lib/validation/item';
import { CodeEditor } from './code-editor';
import { MarkdownEditor } from './markdown-editor';
import { cn } from '@/lib/utils';

const TYPE_META: Record<CreatableItemType, { icon: LucideIcon; color: string; label: string }> = {
  snippet: { icon: Code, color: '#3b82f6', label: 'Snippet' },
  prompt: { icon: Sparkles, color: '#8b5cf6', label: 'Prompt' },
  command: { icon: Terminal, color: '#f97316', label: 'Command' },
  note: { icon: StickyNote, color: '#fde047', label: 'Note' },
  link: { icon: LinkIcon, color: '#10b981', label: 'Link' },
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: CreatableItemType;
};

export function CreateItemDialog({ open, onOpenChange, defaultType }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<CreatableItemType>(defaultType ?? 'snippet');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (open) setType(defaultType ?? 'snippet');
  }, [open, defaultType]);

  const reset = () => {
    setType(defaultType ?? 'snippet');
    setTitle('');
    setDescription('');
    setContent('');
    setUrl('');
    setLanguage('');
    setTags('');
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const showContent = type === 'snippet' || type === 'prompt' || type === 'command' || type === 'note';
  const showLanguage = type === 'snippet' || type === 'command';
  const showUrl = type === 'link';

  const canSubmit = title.trim().length > 0 && !pending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      const result = await createItem({
        type,
        title,
        description,
        content: showContent ? content : '',
        url: showUrl ? url : '',
        language: showLanguage ? language : '',
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      });

      if (result.success) {
        toast.success('Item created');
        reset();
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Item</DialogTitle>
          <DialogDescription>
            Save a snippet, prompt, command, note, or link.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {CREATABLE_ITEM_TYPES.map((t) => {
                const meta = TYPE_META[t];
                const Icon = meta.icon;
                const selected = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer transition-colors',
                      selected
                        ? 'border-foreground/40 bg-accent'
                        : 'border-border hover:bg-accent/50'
                    )}
                  >
                    <Icon className="size-3.5" style={{ color: meta.color }} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ci-title" className="text-xs font-medium text-muted-foreground">
              Title
            </label>
            <Input
              id="ci-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. useDebounce hook"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ci-description" className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <Textarea
              id="ci-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </div>

          {showLanguage && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ci-language" className="text-xs font-medium text-muted-foreground">
                Language
              </label>
              <Input
                id="ci-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. typescript, bash"
              />
            </div>
          )}

          {showContent && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Content
              </label>
              {showLanguage ? (
                <CodeEditor
                  value={content}
                  onChange={setContent}
                  language={language || undefined}
                />
              ) : (
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Write markdown content..."
                />
              )}
            </div>
          )}

          {showUrl && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ci-url" className="text-xs font-medium text-muted-foreground">
                URL
              </label>
              <Input
                id="ci-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ci-tags" className="text-xs font-medium text-muted-foreground">
              Tags
            </label>
            <Input
              id="ci-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} className="cursor-pointer">
              {pending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
