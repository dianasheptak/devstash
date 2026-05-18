'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ICON_MAP } from '@/lib/constants/item-types';
import { useItemDrawer } from '@/components/items/item-drawer-context';
import type { SearchableItem } from '@/lib/db/items';
import type { SearchableCollection } from '@/lib/db/collections';

type Ctx = {
  open: () => void;
};

const CommandPaletteCtx = createContext<Ctx | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteCtx);
  if (!ctx) throw new Error('useCommandPalette must be used inside CommandPaletteProvider');
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<SearchableItem[]>([]);
  const [collections, setCollections] = useState<SearchableCollection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { open: openItem } = useItemDrawer();

  const open = useCallback(() => setIsOpen(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!isOpen || loaded || loading) return;
    setLoading(true);
    fetch('/api/search')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        setCollections(data.collections ?? []);
        setLoaded(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, loaded, loading]);

  function selectItem(id: string) {
    setIsOpen(false);
    openItem(id);
  }

  function selectCollection(slug: string) {
    setIsOpen(false);
    router.push(`/collections/${slug}`);
  }

  return (
    <CommandPaletteCtx.Provider value={{ open }}>
      {children}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen} className="max-w-2xl">
        <Command>
        <CommandInput placeholder="Search items and collections..." />
        <CommandList>
          {loading && !loaded ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <>
              <CommandEmpty>No results found.</CommandEmpty>
              {items.length > 0 && (
                <CommandGroup heading="Items">
                  {items.map((item) => {
                    const Icon = ICON_MAP[item.icon];
                    return (
                      <CommandItem
                        key={item.id}
                        value={`item:${item.id} ${item.title} ${item.type} ${item.preview ?? ''}`}
                        onSelect={() => selectItem(item.id)}
                      >
                        {Icon ? (
                          <Icon className="size-4 shrink-0" style={{ color: item.color }} />
                        ) : null}
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{item.title}</span>
                          {item.preview && (
                            <span className="text-xs text-muted-foreground truncate">
                              {item.preview}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
              {collections.length > 0 && (
                <CommandGroup heading="Collections">
                  {collections.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`collection:${c.id} ${c.name}`}
                      onSelect={() => selectCollection(c.slug)}
                    >
                      <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {c.itemCount} {c.itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
        </Command>
      </CommandDialog>
    </CommandPaletteCtx.Provider>
  );
}
