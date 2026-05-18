'use client';

import {
  Download,
  Star,
  Pin,
  File as FileIcon,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useItemDrawer } from './item-drawer-context';
import { formatBytes } from '@/lib/format';
import type { ItemWithMeta } from '@/lib/db/items';

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function extOf(name: string | null): string {
  if (!name) return '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

const EXT_ICON: Record<string, LucideIcon> = {
  pdf: FileText,
  txt: FileText,
  md: FileText,
  rtf: FileText,
  doc: FileText,
  docx: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileImage,
  mp4: FileVideo,
  mov: FileVideo,
  webm: FileVideo,
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  zip: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
  json: FileCode,
  xml: FileCode,
  yml: FileCode,
  yaml: FileCode,
  ts: FileCode,
  tsx: FileCode,
  js: FileCode,
  jsx: FileCode,
  py: FileCode,
  rb: FileCode,
  go: FileCode,
  rs: FileCode,
  java: FileCode,
  sh: FileCode,
  ini: FileCode,
  csv: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
};

export function FileRow({ item }: { item: ItemWithMeta }) {
  const { open } = useItemDrawer();
  const ext = extOf(item.fileName);
  const Icon = EXT_ICON[ext] ?? FileIcon;
  const displayName = item.fileName ?? item.title;

  const onDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={() => open(item.id)}
      className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 border-b last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="size-9 shrink-0 grid place-items-center rounded-md bg-muted text-muted-foreground"
          style={{ color: item.itemType.color }}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
            {item.isFavorite && (
              <Star className="size-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
            {item.isPinned && (
              <Pin className="size-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>
          {displayName !== item.title && (
            <p className="text-xs text-muted-foreground truncate">{displayName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground sm:shrink-0 pl-12 sm:pl-0">
        <span className="w-20 text-left sm:text-right tabular-nums">
          {formatBytes(item.fileSize)}
        </span>
        <span className="w-24 text-left sm:text-right">
          {formatDate(item.createdAt)}
        </span>
        <a
          href={`/api/files/${item.id}?download=1`}
          onClick={onDownload}
          download
          aria-label="Download file"
          className="inline-flex size-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Download className="size-4" />
        </a>
      </div>
    </div>
  );
}
