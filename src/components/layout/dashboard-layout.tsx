'use client';

import { useState } from 'react';
import { Menu, PanelLeftClose, PanelLeftOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SidebarNav } from './sidebar-nav';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="relative flex items-center px-4 h-14 border-b border-border shrink-0">
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
          <span className="text-lg font-semibold tracking-tight">DevStash</span>
        </div>

        {/* Center: search */}
        <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9" />
          </div>
        </div>

        {/* Right: new item button */}
        <div className="ml-auto shrink-0">
          <Button size="sm">
            <Plus className="size-4" />
            New Item
          </Button>
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
                Navigationnow
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
            <SidebarNav collapsed={collapsed} />
          </div>
        </aside>

        {/* Mobile drawer */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 flex flex-col">
            <SidebarNav collapsed={false} />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
