import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getItemDetailById } from '@/lib/db/items';
import { getFromR2, objectKeyFromUrl } from '@/lib/r2';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId } = await params;
  const item = await getItemDetailById(session.user.id, itemId);
  if (!item || !item.fileUrl) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const key = objectKeyFromUrl(item.fileUrl);
  if (!key) {
    return NextResponse.json({ error: 'Invalid file reference' }, { status: 404 });
  }

  let object;
  try {
    object = await getFromR2(key);
  } catch (err) {
    console.error('R2 fetch failed', err);
    return NextResponse.json({ error: 'File fetch failed' }, { status: 502 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get('download') === '1';
  const disposition = download ? 'attachment' : 'inline';
  const rawName = item.fileName ?? 'file';
  // ASCII fallback: strip control + header-special chars, collapse non-printable
  const asciiName = rawName.replace(/[^\x20-\x7E]/g, '_').replace(/["\r\n;,\\]/g, '_');
  // RFC 6266 extended filename* for full UTF-8 support
  const utf8Name = encodeURIComponent(rawName).replace(
    /['()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );

  const headers = new Headers({
    'Content-Type': object.contentType ?? 'application/octet-stream',
    'Content-Disposition': `${disposition}; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`,
    'Cache-Control': 'private, max-age=0, no-store',
  });
  if (object.contentLength != null) {
    headers.set('Content-Length', String(object.contentLength));
  }

  return new Response(object.body, { headers });
}
