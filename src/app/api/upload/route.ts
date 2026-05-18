import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildObjectKey, uploadToR2 } from '@/lib/r2';
import {
  validateUpload,
  MAX_IMAGE_BYTES,
  MAX_FILE_BYTES,
} from '@/lib/validation/file-upload';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.user.isPro) {
    return NextResponse.json(
      { error: 'File uploads require a Pro plan.' },
      { status: 403 }
    );
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  const kindRaw = formData.get('kind');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required' }, { status: 400 });
  }
  if (kindRaw !== 'image' && kindRaw !== 'file') {
    return NextResponse.json({ error: 'Invalid upload kind' }, { status: 400 });
  }
  const kind = kindRaw as 'image' | 'file';

  const hardCap = kind === 'image' ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (file.size > hardCap) {
    return NextResponse.json(
      { error: `File exceeds ${hardCap / (1024 * 1024)} MB limit` },
      { status: 413 }
    );
  }

  const result = validateUpload({
    kind,
    fileName: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const key = buildObjectKey(session.user.id, file.name);
  const arrayBuffer = await file.arrayBuffer();
  try {
    await uploadToR2({
      key,
      body: Buffer.from(arrayBuffer),
      contentType: result.mimeType,
    });
  } catch (err) {
    console.error('R2 upload failed', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({
    fileUrl: `r2://${key}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: result.mimeType,
  });
}
