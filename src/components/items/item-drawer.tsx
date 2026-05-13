'use client';

import { useEffect, useState } from 'react';
import { Copy, Star, Pin, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ICON_MAP } from '@/lib/constants/item-types';
import { useItemDrawer } from './item-drawer-context';
import type { ItemDetail } from '@/lib/db/items';

export function ItemDrawer() {
  const { openItemId, close } = useItemDrawer();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!openItemId) {
      setItem(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setItem(null);
    fetch(`/api/items/${openItemId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setItem(data.item);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load item');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openItemId]);

  const handleCopy = async () => {
    if (!item) return;
    const text =
      item.contentType === 'URL'
        ? item.url ?? ''
        : item.contentType === 'FILE'
        ? item.fileUrl ?? ''
        : item.content ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Sheet open={!!openItemId} onOpenChange={(o) => !o && close()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md! md:max-w-lg! lg:max-w-xl! p-0 overflow-y-auto"
      >
        {loading || !item ? (
          <DrawerSkeleton />
        ) : (
          <DrawerBody item={item} onCopy={handleCopy} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  item,
  onCopy,
}: {
  item: ItemDetail;
  onCopy: () => void;
}) {
  const Icon = ICON_MAP[item.itemType.icon];

  return (
    <div className="flex flex-col">
      <SheetHeader className="border-b">
        <div className="flex items-center gap-2 pr-8">
          {Icon && (
            <span className="size-5 shrink-0" style={{ color: item.itemType.color }}>
              <Icon className="size-5" />
            </span>
          )}
          <SheetTitle className="truncate flex-1">{item.title}</SheetTitle>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge
            variant="secondary"
            className="capitalize"
            style={{ color: item.itemType.color }}
          >
            {item.itemType.name}
          </Badge>
          {item.language && (
            <Badge variant="outline" className="text-muted-foreground">
              {item.language}
            </Badge>
          )}
        </div>
      </SheetHeader>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b">
        <Button size="sm" variant="ghost" onClick={onCopy}>
          <Copy className="size-3.5" />
          Copy
        </Button>
        <Button size="sm" variant="ghost">
          <Star
            className={
              item.isFavorite
                ? 'size-3.5 fill-yellow-400 text-yellow-400'
                : 'size-3.5'
            }
          />
          {item.isFavorite ? 'Favorited' : 'Favorite'}
        </Button>
        <Button size="sm" variant="ghost">
          <Pin
            className={item.isPinned ? 'size-3.5 text-foreground' : 'size-3.5'}
          />
          {item.isPinned ? 'Pinned' : 'Pin'}
        </Button>
        <Button size="sm" variant="ghost">
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>

      {/* Body sections */}
      <div className="flex flex-col gap-5 p-4">
        {item.description && (
          <Section label="Description">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {item.description}
            </p>
          </Section>
        )}

        {item.contentType === 'TEXT' && item.content && (
          <Section label="Content">
            <pre className="text-xs font-mono bg-muted/40 rounded p-3 overflow-x-auto whitespace-pre-wrap">
              {item.content}
            </pre>
          </Section>
        )}

        {item.contentType === 'URL' && item.url && (
          <Section label="URL">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline break-all"
            >
              {item.url}
            </a>
          </Section>
        )}

        {item.contentType === 'FILE' && (
          <Section label="File">
            <div className="text-sm text-muted-foreground">
              {item.fileName ?? 'Unnamed file'}
              {item.fileSize != null && (
                <span className="ml-2 text-xs">
                  ({formatBytes(item.fileSize)})
                </span>
              )}
            </div>
          </Section>
        )}

        {item.tags.length > 0 && (
          <Section label="Tags">
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {item.collections.length > 0 && (
          <Section label="Collections">
            <div className="flex flex-wrap gap-1">
              {item.collections.map((c) => (
                <Badge key={c.id} variant="outline">
                  {c.name}
                </Badge>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </h3>
      {children}
    </section>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
      <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
      <div className="h-8 w-full rounded bg-muted animate-pulse" />
      <div className="h-24 w-full rounded bg-muted animate-pulse" />
      <div className="h-16 w-full rounded bg-muted animate-pulse" />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
