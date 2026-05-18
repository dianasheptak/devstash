import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  basePath: string;
  page: number;
  pageCount: number;
};

function buildPages(page: number, pageCount: number): (number | 'ellipsis')[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) pages.push('ellipsis');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < pageCount - 1) pages.push('ellipsis');
  pages.push(pageCount);
  return pages;
}

function href(basePath: string, page: number): string {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

export function Pagination({ basePath, page, pageCount }: Props) {
  if (pageCount <= 1) return null;

  const pages = buildPages(page, pageCount);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  const linkClass =
    'inline-flex items-center justify-center h-9 min-w-9 px-3 rounded-md border text-sm hover:bg-muted transition';
  const disabledClass = 'pointer-events-none opacity-50';
  const activeClass = 'bg-primary text-primary-foreground border-primary hover:bg-primary';

  return (
    <nav
      className="flex items-center justify-center gap-1 pt-4"
      aria-label="Pagination"
    >
      <Link
        href={href(basePath, page - 1)}
        aria-label="Previous page"
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={cn(linkClass, prevDisabled && disabledClass)}
      >
        <ChevronLeft className="size-4" />
      </Link>

      {pages.map((p, i) =>
        p === 'ellipsis' ? (
          <span
            key={`e-${i}`}
            className="inline-flex items-center justify-center h-9 min-w-9 px-2 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(basePath, p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(linkClass, p === page && activeClass)}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={href(basePath, page + 1)}
        aria-label="Next page"
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={cn(linkClass, nextDisabled && disabledClass)}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}
