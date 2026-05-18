'use client';

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Copy, Star, Pin, Pencil, Trash2, Download, FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ICON_MAP } from '@/lib/constants/item-types';
import { useItemDrawer } from './item-drawer-context';
import { updateItem, deleteItem } from '@/actions/items';
import { CodeEditor } from './code-editor';
import { MarkdownEditor } from './markdown-editor';
import { CollectionPicker, type CollectionOption } from './collection-picker';
import { formatBytes } from '@/lib/format';
import type { ItemDetail } from '@/lib/db/items';

const CODE_TYPES = ['snippet', 'command'] as const;
type CodeType = (typeof CODE_TYPES)[number];
const isCodeType = (name: string): name is CodeType =>
  (CODE_TYPES as readonly string[]).includes(name);

export function ItemDrawer() {
  const router = useRouter();
  const { openItemId, close } = useItemDrawer();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (!openItemId) {
      setItem(null);
      setIsEditing(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setItem(null);
    setIsEditing(false);
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

  const handleDelete = () => {
    if (!item) return;
    const id = item.id;
    startDeleteTransition(async () => {
      const result = await deleteItem(id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Item deleted');
      setConfirmDelete(false);
      close();
      router.refresh();
    });
  };

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
        ) : isEditing ? (
          <DrawerEdit
            item={item}
            onCancel={() => setIsEditing(false)}
            onSaved={(updated) => {
              setItem(updated);
              setIsEditing(false);
            }}
          />
        ) : (
          <DrawerBody
            item={item}
            onCopy={handleCopy}
            onEdit={() => setIsEditing(true)}
            onDelete={() => setConfirmDelete(true)}
          />
        )}
      </SheetContent>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {item
                ? `"${item.title}" will be permanently deleted. This action cannot be undone.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}

function DrawerBody({
  item,
  onCopy,
  onEdit,
  onDelete,
}: {
  item: ItemDetail;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
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
        <Button size="sm" variant="ghost" onClick={onCopy} className="cursor-pointer">
          <Copy className="size-3.5" />
          Copy
        </Button>
        <Button size="sm" variant="ghost" className="cursor-pointer">
          <Star
            className={
              item.isFavorite
                ? 'size-3.5 fill-yellow-400 text-yellow-400'
                : 'size-3.5'
            }
          />
          {item.isFavorite ? 'Favorited' : 'Favorite'}
        </Button>
        <Button size="sm" variant="ghost" className="cursor-pointer">
          <Pin
            className={item.isPinned ? 'size-3.5 text-foreground' : 'size-3.5'}
          />
          {item.isPinned ? 'Pinned' : 'Pin'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit} className="cursor-pointer">
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="ml-auto text-destructive hover:text-destructive cursor-pointer"
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
            {isCodeType(item.itemType.name) ? (
              <CodeEditor
                value={item.content}
                language={item.language ?? undefined}
                readOnly
              />
            ) : (
              <MarkdownEditor value={item.content} readOnly />
            )}
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

        {item.contentType === 'FILE' && item.fileUrl && (
          <Section label={item.itemType.name === 'image' ? 'Image' : 'File'}>
            {item.itemType.name === 'image' ? (
              <div className="relative w-full h-96 rounded border bg-muted overflow-hidden">
                <Image
                  src={`/api/files/${item.id}`}
                  alt={item.fileName ?? item.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 576px"
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-md border bg-muted/30 p-3">
                <div className="flex size-10 items-center justify-center rounded border bg-background">
                  <FileIcon className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.fileName ?? 'Unnamed file'}
                  </p>
                  {item.fileSize != null && (
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.fileSize)}
                    </p>
                  )}
                </div>
              </div>
            )}
            <a
              href={`/api/files/${item.id}?download=1`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Download className="size-3.5" />
              Download
            </a>
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

function DrawerEdit({
  item,
  onCancel,
  onSaved,
}: {
  item: ItemDetail;
  onCancel: () => void;
  onSaved: (updated: ItemDetail) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const Icon = ICON_MAP[item.itemType.icon];

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [content, setContent] = useState(item.content ?? '');
  const [language, setLanguage] = useState(item.language ?? '');
  const [url, setUrl] = useState(item.url ?? '');
  const [tagsCsv, setTagsCsv] = useState(item.tags.join(', '));
  const [collectionIds, setCollectionIds] = useState<string[]>(
    item.collections.map((c) => c.id)
  );
  const [collections, setCollections] = useState<CollectionOption[]>([]);

  useEffect(() => {
    fetch('/api/collections')
      .then((r) => r.json())
      .then((d) => setCollections(d.collections ?? []))
      .catch(() => {});
  }, []);

  const typeName = item.itemType.name;
  const showContent = ['snippet', 'prompt', 'command', 'note'].includes(typeName);
  const showLanguage = ['snippet', 'command'].includes(typeName);
  const showUrl = typeName === 'link';

  const titleEmpty = title.trim().length === 0;

  const handleSave = () => {
    startTransition(async () => {
      const tags = tagsCsv
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const result = await updateItem(item.id, {
        title,
        description,
        content: showContent ? content : '',
        language: showLanguage ? language : '',
        url: showUrl ? url : '',
        tags,
        collectionIds,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Item updated');
      onSaved(result.data);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col">
      <SheetHeader className="border-b">
        <div className="flex items-center gap-2 pr-8">
          {Icon && (
            <span className="size-5 shrink-0" style={{ color: item.itemType.color }}>
              <Icon className="size-5" />
            </span>
          )}
          <SheetTitle className="truncate flex-1">Editing item</SheetTitle>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge
            variant="secondary"
            className="capitalize"
            style={{ color: item.itemType.color }}
          >
            {item.itemType.name}
          </Badge>
        </div>
      </SheetHeader>

      {/* Edit action bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={titleEmpty || isPending}
          className="cursor-pointer"
        >
          {isPending ? 'Saving...' : 'Save'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
          className="cursor-pointer"
        >
          Cancel
        </Button>
      </div>

      {/* Edit form */}
      <div className="flex flex-col gap-5 p-4">
        <Section label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item title"
            required
          />
        </Section>

        <Section label="Description">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
          />
        </Section>

        {showContent && (
          <Section label="Content">
            {isCodeType(typeName) ? (
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
          </Section>
        )}

        {showLanguage && (
          <Section label="Language">
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. typescript"
            />
          </Section>
        )}

        {showUrl && (
          <Section label="URL">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </Section>
        )}

        <Section label="Tags">
          <Input
            value={tagsCsv}
            onChange={(e) => setTagsCsv(e.target.value)}
            placeholder="comma, separated, tags"
          />
        </Section>

        <Section label="Collections">
          <CollectionPicker
            collections={collections}
            selectedIds={collectionIds}
            onChange={setCollectionIds}
          />
        </Section>
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
