-- AlterTable: add slug nullable, backfill, then enforce NOT NULL
ALTER TABLE "collections" ADD COLUMN "slug" TEXT;

UPDATE "collections" SET "slug" = regexp_replace(
  regexp_replace(
    regexp_replace(
      regexp_replace(lower("name"), '\s+', '-', 'g'),
      '[^a-z0-9-]', '', 'g'
    ),
    '-+', '-', 'g'
  ),
  '^-|-$', '', 'g'
);

ALTER TABLE "collections" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE INDEX "collections_userId_slug_idx" ON "collections"("userId", "slug");
