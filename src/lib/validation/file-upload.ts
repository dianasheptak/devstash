export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

export const FILE_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/x-yaml',
  'text/yaml',
  'application/xml',
  'text/xml',
  'text/csv',
  'application/toml',
] as const;

export const IMAGE_EXTENSIONS = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
] as const;

export const FILE_EXTENSIONS = [
  '.pdf',
  '.txt',
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.xml',
  '.csv',
  '.toml',
  '.ini',
] as const;

export type UploadKind = 'image' | 'file';

export type UploadValidationResult =
  | { ok: true; mimeType: string }
  | { ok: false; error: string };

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx).toLowerCase();
}

export function validateUpload(params: {
  kind: UploadKind;
  fileName: string;
  size: number;
  mimeType: string;
}): UploadValidationResult {
  const { kind, fileName, size, mimeType } = params;
  const ext = getExtension(fileName);

  const allowedExts = kind === 'image' ? IMAGE_EXTENSIONS : FILE_EXTENSIONS;
  const allowedMimes: readonly string[] =
    kind === 'image' ? IMAGE_MIME_TYPES : FILE_MIME_TYPES;
  const maxBytes = kind === 'image' ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  const maxMb = maxBytes / (1024 * 1024);

  if (!fileName.trim()) return { ok: false, error: 'Filename is required' };
  if (size <= 0) return { ok: false, error: 'File is empty' };
  if (size > maxBytes) {
    return { ok: false, error: `File exceeds ${maxMb} MB limit` };
  }

  if (!(allowedExts as readonly string[]).includes(ext)) {
    return {
      ok: false,
      error: `Extension ${ext || '(none)'} is not allowed for ${kind}s`,
    };
  }

  // .ini files report text/plain; allow it for the file kind.
  const effectiveMime =
    kind === 'file' && ext === '.ini' ? 'text/plain' : mimeType;

  if (!allowedMimes.includes(effectiveMime)) {
    return { ok: false, error: `MIME type ${mimeType} is not allowed` };
  }

  return { ok: true, mimeType: effectiveMime };
}
