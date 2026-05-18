import { describe, it, expect } from 'vitest';
import {
  validateUpload,
  MAX_IMAGE_BYTES,
  MAX_FILE_BYTES,
} from './file-upload';

describe('validateUpload', () => {
  it('accepts a valid PNG image', () => {
    const r = validateUpload({
      kind: 'image',
      fileName: 'shot.png',
      size: 1024,
      mimeType: 'image/png',
    });
    expect(r.ok).toBe(true);
  });

  it('rejects an image over the 5 MB limit', () => {
    const r = validateUpload({
      kind: 'image',
      fileName: 'big.png',
      size: MAX_IMAGE_BYTES + 1,
      mimeType: 'image/png',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/5 MB/);
  });

  it('rejects an image with a disallowed extension', () => {
    const r = validateUpload({
      kind: 'image',
      fileName: 'bad.bmp',
      size: 1024,
      mimeType: 'image/bmp',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects an image whose MIME type is not allowed', () => {
    const r = validateUpload({
      kind: 'image',
      fileName: 'shot.png',
      size: 1024,
      mimeType: 'application/octet-stream',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects empty files', () => {
    const r = validateUpload({
      kind: 'file',
      fileName: 'empty.pdf',
      size: 0,
      mimeType: 'application/pdf',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/empty/i);
  });

  it('accepts a PDF up to 10 MB', () => {
    const r = validateUpload({
      kind: 'file',
      fileName: 'doc.pdf',
      size: MAX_FILE_BYTES,
      mimeType: 'application/pdf',
    });
    expect(r.ok).toBe(true);
  });

  it('rejects a file over the 10 MB limit', () => {
    const r = validateUpload({
      kind: 'file',
      fileName: 'huge.pdf',
      size: MAX_FILE_BYTES + 1,
      mimeType: 'application/pdf',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/10 MB/);
  });

  it('accepts an .ini file even though MIME is text/plain', () => {
    const r = validateUpload({
      kind: 'file',
      fileName: 'config.ini',
      size: 256,
      mimeType: 'text/plain',
    });
    expect(r.ok).toBe(true);
  });

  it('rejects an image kind passed as file', () => {
    const r = validateUpload({
      kind: 'file',
      fileName: 'shot.png',
      size: 1024,
      mimeType: 'image/png',
    });
    expect(r.ok).toBe(false);
  });
});
