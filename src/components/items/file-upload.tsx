'use client';

import { useRef, useState } from 'react';
import { UploadCloud, X, FileIcon, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  IMAGE_EXTENSIONS,
  FILE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  MAX_FILE_BYTES,
} from '@/lib/validation/file-upload';

export type UploadedFile = {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  // Local preview URL for images (object URL); not persisted.
  previewUrl?: string;
};

type Props = {
  kind: 'image' | 'file';
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
};

export function FileUpload({ kind, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptList = (kind === 'image' ? IMAGE_EXTENSIONS : FILE_EXTENSIONS).join(',');
  const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  const maxMb = maxBytes / (1024 * 1024);

  const uploading = progress !== null;

  const handleUpload = (file: File) => {
    if (file.size > maxBytes) {
      toast.error(`File exceeds ${maxMb} MB limit`);
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadedFile;
          const previewUrl =
            kind === 'image' ? URL.createObjectURL(file) : undefined;
          onChange({ ...data, previewUrl });
          toast.success('Upload complete');
        } catch {
          toast.error('Upload response could not be parsed');
        }
      } else {
        let message = 'Upload failed';
        try {
          const data = JSON.parse(xhr.responseText) as { error?: string };
          if (data.error) message = data.error;
        } catch {}
        toast.error(message);
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      toast.error('Upload failed');
    };
    setProgress(0);
    xhr.send(fd);
  };

  const onPick = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const clear = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
  };

  if (value && !uploading) {
    return (
      <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
        {kind === 'image' && value.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.previewUrl}
            alt={value.fileName}
            className="size-16 rounded object-cover border"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded border bg-background">
            {kind === 'image' ? (
              <ImageIcon className="size-6 text-muted-foreground" />
            ) : (
              <FileIcon className="size-6 text-muted-foreground" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium">{value.fileName}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(value.fileSize)}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={clear}
          className="cursor-pointer"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20',
        uploading && 'opacity-70'
      )}
    >
      <UploadCloud className="size-8 text-muted-foreground" />
      {uploading ? (
        <div className="w-full max-w-xs">
          <div className="h-2 w-full rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Uploading… {progress}%
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Drag &amp; drop, or click to choose a {kind}
          </p>
          <p className="text-xs text-muted-foreground">
            Up to {maxMb} MB — {acceptList}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onPick}
            className="cursor-pointer mt-1"
          >
            Choose {kind}
          </Button>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={acceptList}
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
