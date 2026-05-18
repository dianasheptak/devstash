import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSearchableItems } from '@/lib/db/items';
import { getSearchableCollections } from '@/lib/db/collections';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [items, collections] = await Promise.all([
    getSearchableItems(session.user.id),
    getSearchableCollections(session.user.id),
  ]);

  return NextResponse.json({ items, collections });
}
