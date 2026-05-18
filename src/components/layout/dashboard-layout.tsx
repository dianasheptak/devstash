'use client';

import { useState } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav';
import { ItemDrawerProvider } from '@/components/items/item-drawer-context';
import { ItemDrawer } from '@/components/items/item-drawer';
import { CreateItemProvider, useCreateItem } from '@/components/items/create-item-context';
import { CreateCollectionProvider, useCreateCollection } from '@/components/collections/create-collection-context';
import { CommandPaletteProvider, useCommandPalette } from '@/components/layout/command-palette';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { SidebarItemType } from '@/lib/db/items';
import type { SidebarCollection } from '@/lib/db/collections';

type SidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isPro?: boolean;
};

type Props = {
  children: React.ReactNode;
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: SidebarUser;
};

export function DashboardLayout({ children, itemTypes, collections, user }: Props) {
  return (
    <ItemDrawerProvider>
      <CommandPaletteProvider>
        <CreateItemProvider isPro={!!user.isPro}>
          <CreateCollectionProvider>
            <DashboardLayoutInner itemTypes={itemTypes} collections={collections} user={user}>
              {children}
            </DashboardLayoutInner>
          </CreateCollectionProvider>
        </CreateItemProvider>
      </CommandPaletteProvider>
    </ItemDrawerProvider>
  );
}

function DashboardLayoutInner({ children, itemTypes, collections, user }: Props) {
  const { open: openCreate } = useCreateItem();
  const { open: openCreateCollection } = useCreateCollection();
  const { open: openPalette } = useCommandPalette();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border shrink-0">
        {/* Main row */}
        <div className="relative flex items-center px-4 h-14">
          {/* Left: mobile hamburger + logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden size-8"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <Link href={'/'} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="text-xl text-blue-400">⬡</span>
              <span>DevStash</span>
            </Link>
          </div>

          {/* Center: search — desktop only */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
            <button
              type="button"
              onClick={openPalette}
              className="relative w-full h-9 rounded-md border border-input bg-transparent pl-9 pr-2 text-left text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors cursor-pointer flex items-center"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" />
              <span>Search items and collections...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right: action buttons */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {!user.isPro && (
              <Link href="/upgrade">
                <Button size="sm" variant="ghost" className="cursor-pointer text-muted-foreground hover:text-foreground">
                  <Sparkles className="size-4" />
                  <span className="hidden sm:inline">Upgrade</span>
                </Button>
              </Link>
            )}
            <Button size="sm" variant="outline" onClick={() => openCreateCollection()} className="cursor-pointer">
              <Plus className="size-4" />
              <span className="hidden sm:inline">New Collection</span>
            </Button>
            <Button size="sm" onClick={() => openCreate()} className="cursor-pointer">
              <Plus className="size-4" />
              <span className="hidden sm:inline">New Item</span>
            </Button>
          </div>
        </div>

        {/* Search row — mobile only */}
        <div className="lg:hidden px-4 pb-3">
          <button
            type="button"
            onClick={openPalette}
            className="relative w-full h-9 rounded-md border border-input bg-transparent pl-9 pr-2 text-left text-sm text-muted-foreground hover:bg-accent/40 hover:text-foreground transition-colors cursor-pointer flex items-center"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" />
            <span>Search...</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            'hidden lg:flex flex-col border-r border-border bg-sidebar shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out',
            collapsed ? 'w-14' : 'w-56'
          )}
        >
          {/* Sidebar toggle */}
          <div className={cn(
            'flex items-center px-2 h-9 border-b border-border shrink-0',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            {!collapsed && (
              <span className="px-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Navigation
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-3.5" />
              ) : (
                <PanelLeftClose className="size-3.5" />
              )}
            </Button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <SidebarNav collapsed={collapsed} itemTypes={itemTypes} collections={collections} user={user} />
          </div>
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 flex flex-col">
            <SidebarNav collapsed={false} itemTypes={itemTypes} collections={collections} user={user} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <ItemDrawer />
    </div>
  );
}
