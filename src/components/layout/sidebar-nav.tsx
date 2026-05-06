'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Star,
  LayoutGrid,
  Settings,
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link as LinkIcon,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { mockUser } from '@/lib/mock-data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { SidebarItemType } from '@/lib/db/items';
import type { SidebarCollection } from '@/lib/db/collections';

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

function NavItem({
  href,
  icon,
  label,
  collapsed,
  color,
  count,
  currentPath,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  color?: string;
  count?: number;
  currentPath: string;
}) {
  const isActive =
    currentPath === href ||
    (href !== '/dashboard' && currentPath.startsWith(href));

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-sm transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        isActive && 'bg-accent text-foreground font-medium',
        collapsed ? 'justify-center px-2 py-2' : 'px-3 py-1.5'
      )}
    >
      <span
        className="shrink-0 size-4 flex items-center justify-center"
        style={color ? { color } : undefined}
      >
        {icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {count !== undefined && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function SectionLabel({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (collapsed) return null;
  return (
    <p className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
      {label}
    </p>
  );
}

type Props = {
  collapsed: boolean;
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
};

export function SidebarNav({ collapsed, itemTypes, collections }: Props) {
  const pathname = usePathname();
  const [collectionsOpen, setCollectionsOpen] = useState(true);

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite).slice(0, 3);

  const initials = mockUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto py-2">
        {/* Quick Access */}
        <SectionLabel label="Quick Access" collapsed={collapsed} />
        <NavItem
          href="/dashboard/favorites"
          icon={<Star className="size-4" />}
          label="Favorites"
          collapsed={collapsed}
          currentPath={pathname}
        />

        {/* Types */}
        <SectionLabel label="Types" collapsed={collapsed} />
        <NavItem
          href="/dashboard"
          icon={<LayoutGrid className="size-4" />}
          label="All Items"
          collapsed={collapsed}
          currentPath={pathname}
        />
        {itemTypes.map((type) => {
          const Icon = ICON_MAP[type.icon];
          return (
            <NavItem
              key={type.id}
              href={`/items/${type.name}s`}
              icon={Icon ? <Icon className="size-4" /> : null}
              label={type.name.charAt(0).toUpperCase() + type.name.slice(1)}
              collapsed={collapsed}
              color={type.color}
              count={type.count}
              currentPath={pathname}
            />
          );
        })}

        {/* Collections (collapsible) */}
        {!collapsed ? (
          <button
            onClick={() => setCollectionsOpen(!collectionsOpen)}
            className="flex items-center gap-1 w-full px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn('size-3 transition-transform duration-200', !collectionsOpen && '-rotate-90')}
            />
            Collections
          </button>
        ) : null}

        {(collapsed || collectionsOpen) && (
          <>
            {favoriteCollections.length > 0 && (
              <>
                <SectionLabel label="Favorites" collapsed={collapsed} />
                {favoriteCollections.map((col) => (
                  <NavItem
                    key={col.id}
                    href={`/collections/${col.id}`}
                    icon={<Star className="size-4" />}
                    label={col.name}
                    collapsed={collapsed}
                    count={col.itemCount}
                    currentPath={pathname}
                  />
                ))}
              </>
            )}

            {recentCollections.length > 0 && (
              <>
                <SectionLabel label="Recent" collapsed={collapsed} />
                {recentCollections.map((col) => (
                  <NavItem
                    key={col.id}
                    href={`/collections/${col.id}`}
                    icon={
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: col.dominantColor }}
                      />
                    }
                    label={col.name}
                    collapsed={collapsed}
                    count={col.itemCount}
                    currentPath={pathname}
                  />
                ))}
              </>
            )}

            {!collapsed && (
              <Link
                href="/collections"
                className="block px-3 py-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View all collections →
              </Link>
            )}
          </>
        )}
      </div>

      {/* User area */}
      <div
        className={cn(
          'flex items-center gap-2.5 border-t border-border shrink-0',
          collapsed ? 'justify-center px-2 py-3' : 'px-3 py-3'
        )}
      >
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">
                {mockUser.name}
              </p>
              <p className="text-xs text-muted-foreground truncate leading-tight">
                {mockUser.email}
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Settings className="size-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
