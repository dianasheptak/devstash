import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link as LinkIcon,
  type LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image,
  Link: LinkIcon,
};

export const ITEM_TYPE_NAMES = [
  'snippet',
  'prompt',
  'command',
  'note',
  'file',
  'image',
  'link',
] as const;

export type ItemTypeName = (typeof ITEM_TYPE_NAMES)[number];

export function slugToTypeName(slug: string): ItemTypeName | null {
  const singular = slug.endsWith('s') ? slug.slice(0, -1) : slug;
  return (ITEM_TYPE_NAMES as readonly string[]).includes(singular)
    ? (singular as ItemTypeName)
    : null;
}
