# Item CRUD Architecture

A unified design for creating, reading, updating, and deleting items across all 7 system types ([snippet, prompt, command, note, file, image, link](./item-types.md)).

## Goals

1. **One mutation surface** — every item write goes through a single Server Actions module. No per-type `createSnippet` / `createNote` duplication.
2. **Direct DB reads from server components** — queries live in `src/lib/db/*` and are called from server components without an API or Route Handler hop.
3. **One dynamic route** — `/items/[type]` renders all 7 type pages; the same form component handles create + edit for all types and adapts its fields to the type's `ContentType`.
4. **Type-specific logic in components, not actions.** Server actions accept a discriminated payload and persist what they're given. The decision of "this is a `TEXT` item, render a Markdown body and a language picker" lives in the form component.

## File structure

```
src/
├── app/
│   ├── (dashboard)/                          # auth-gated layout group (TBD)
│   │   ├── dashboard/page.tsx                # already exists
│   │   ├── items/
│   │   │   ├── [type]/
│   │   │   │   ├── page.tsx                  # list view per system type
│   │   │   │   ├── new/page.tsx              # create form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx              # detail / read view
│   │   │   │       └── edit/page.tsx         # edit form
│   │   │   └── page.tsx                      # optional: all-items overview
│   │   └── ...
│   └── api/                                  # only for things that MUST be HTTP
│       └── upload/                           # R2 presigned-URL endpoint (file/image)
│
├── lib/
│   ├── actions/
│   │   └── items.ts                          # createItem, updateItem, deleteItem,
│   │                                         # togglePin, toggleFavorite — "use server"
│   ├── db/
│   │   ├── items.ts                          # exists; will gain getItemsByType,
│   │   │                                     # getItemById, getItemsForCollection
│   │   ├── collections.ts                    # exists
│   │   └── tags.ts                           # new: upsertTagsByName
│   ├── validation/
│   │   └── items.ts                          # zod schemas: ItemCreate / ItemUpdate
│   │                                         # discriminated by contentType
│   └── constants/
│       └── item-types.ts                     # exists; ICON_MAP only
│
└── components/
    └── items/
        ├── item-card.tsx                     # exists (list cell)
        ├── item-list.tsx                     # grid wrapper, used by [type]/page
        ├── item-detail.tsx                   # adaptive read view
        ├── item-form.tsx                     # adaptive create+edit form (client)
        ├── item-actions-menu.tsx             # ⋯ menu: edit, pin, favorite, delete
        └── fields/                           # type-specific subcomponents
            ├── text-content-field.tsx        # snippet/prompt/command/note body
            ├── language-select.tsx           # snippet/command only
            ├── url-field.tsx                 # link only
            └── file-upload-field.tsx         # file/image only (Pro)
```

### Why server actions, not `/api/items` Route Handlers

Next.js 16 + React 19 server actions bind directly to forms (`<form action={createItem}>`), preserve progressive enhancement, run in the same request as the page that submitted them, and revalidate cache tags inline. They replace the `/api/items` REST surface for first-party UI mutations. The few things that **must** be HTTP — webhook receivers, third-party callbacks, R2 presigned-URL minting for client-side uploads — stay under `src/app/api/`.

## Routing: how `/items/[type]` works

The `[type]` segment is constrained at the page level to the 7 system type names; anything else 404s.

```ts
// src/app/(dashboard)/items/[type]/page.tsx
const SYSTEM_TYPES = ['snippets', 'prompts', 'commands', 'notes', 'files', 'images', 'links'] as const;
type SystemTypeSlug = (typeof SYSTEM_TYPES)[number];

// Plural URL slug ⇄ singular ItemType.name (the value seeded in prisma/seed.ts)
const SLUG_TO_TYPE: Record<SystemTypeSlug, string> = {
  snippets: 'snippet',
  prompts: 'prompt',
  commands: 'command',
  notes: 'note',
  files: 'file',
  images: 'image',
  links: 'link',
};

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!SYSTEM_TYPES.includes(type as SystemTypeSlug)) notFound();

  const typeName = SLUG_TO_TYPE[type as SystemTypeSlug];
  const items = await getItemsByType(typeName);
  return <ItemList items={items} typeName={typeName} />;
}
```

Optionally generate the segment statically:

```ts
export function generateStaticParams() {
  return SYSTEM_TYPES.map((type) => ({ type }));
}
```

The plural-vs-singular mapping is the only place type slugs are translated. Sidebar nav already links to plural slugs (`/items/snippets`, etc.), and the seed stores the singular in `ItemType.name`.

### Route ↔ render matrix

| Path                          | Renders                  | Data source                            |
| ----------------------------- | ------------------------ | -------------------------------------- |
| `/items/[type]`               | `<ItemList>` grid        | `getItemsByType(typeName)`             |
| `/items/[type]/new`           | `<ItemForm mode="new">`  | none (form is empty)                   |
| `/items/[type]/[id]`          | `<ItemDetail>`           | `getItemById(id)` (asserts ownership)  |
| `/items/[type]/[id]/edit`     | `<ItemForm mode="edit">` | `getItemById(id)` prefilled            |

The `[type]` segment is preserved on detail/edit pages purely for nice URLs — the server still reads `Item.itemType.name` for authoritative type info, so a mismatched slug (e.g. `/items/notes/<a-snippet-id>`) can either redirect to the canonical URL or 404.

## Reads: `lib/db/items.ts`

All reads stay in [`src/lib/db/items.ts`](../src/lib/db/items.ts) and are called **directly** from server components. No tRPC, no `/api/items/list` fetch, no React Query. The existing `mapItem` + `itemInclude` shape is the canonical projection.

Functions to add (or extend) to support the CRUD UI:

| Function                                                | Purpose                                                |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `getItemsByType(typeName, opts?)`                       | List view for `/items/[type]`                          |
| `getItemById(id)`                                       | Detail + edit-form prefill (asserts session ownership) |
| `getItemsForCollection(collectionId, opts?)`            | Collection detail page                                 |
| `searchItems(query, opts?)`                             | Header search                                          |
| `getRecentItems`, `getPinnedItems`, `getItemStats`      | Already exist — consumed by the dashboard              |

`opts` covers pagination (`take`, `cursor`), sort (`createdAt | updatedAt | title`), and optional filters (`isFavorite`, `tag`). Every query scopes to the session user — when auth is wired in, the temporary `getDemoUserId()` shim in `lib/db/items.ts` is replaced with `auth()` (one place to change).

## Writes: `lib/actions/items.ts`

A single Server Actions module. Each action:

1. Calls `auth()` and resolves `session.user.id` (or returns `{ error: "UNAUTHENTICATED" }`).
2. Validates input through a `zod` schema in `lib/validation/items.ts`.
3. Asserts ownership for update/delete by re-reading the row and matching `userId`.
4. Performs the Prisma write.
5. Calls `revalidatePath` / `revalidateTag` for the list, the dashboard, and (for updates) the detail page.
6. Returns `{ ok: true, item }` or `{ ok: false, error, fieldErrors? }`.

```ts
// src/lib/actions/items.ts
'use server';

export async function createItem(input: ItemCreateInput) { /* ... */ }
export async function updateItem(id: string, input: ItemUpdateInput) { /* ... */ }
export async function deleteItem(id: string) { /* ... */ }
export async function togglePin(id: string) { /* ... */ }
export async function toggleFavorite(id: string) { /* ... */ }
export async function setItemCollections(id: string, collectionIds: string[]) { /* ... */ }
```

### Validation: one discriminated schema for all types

`lib/validation/items.ts` exports a discriminated union keyed on `contentType`, so the action doesn't need a `switch (typeName)` — invalid combinations (e.g. a `LINK` item with a `content` body) are rejected at the schema boundary.

```ts
const TextItem = z.object({
  contentType: z.literal('TEXT'),
  content: z.string().min(1).max(50_000),
  language: z.string().nullable().optional(),
});

const FileItem = z.object({
  contentType: z.literal('FILE'),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().int().positive(),
});

const UrlItem = z.object({
  contentType: z.literal('URL'),
  url: z.string().url(),
});

const Common = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2_000).nullable().optional(),
  itemTypeId: z.string().cuid(),
  tags: z.array(z.string().min(1).max(40)).max(20).optional(),
  collectionIds: z.array(z.string().cuid()).max(50).optional(),
  isFavorite: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

export const ItemCreate = z.discriminatedUnion('contentType', [
  Common.merge(TextItem),
  Common.merge(FileItem),
  Common.merge(UrlItem),
]);
```

The form component is responsible for sending the right `contentType` for the active item type — it's not the action's job to derive it.

### Tags

Tags are global (`Tag.name @unique`). The action upserts each name and connects via the `ItemTags` relation. Encapsulate this in `lib/db/tags.ts#connectOrCreateTags(names)` so the items action reads cleanly.

### Cache invalidation

After any successful write, revalidate:

- `revalidatePath('/items/[type]', 'page')` for the list
- `revalidatePath('/items/[type]/[id]', 'page')` for updates
- `revalidatePath('/dashboard')` because the dashboard shows recent + pinned + counts
- `revalidatePath('/collections/[id]')` for any affected collection (on `setItemCollections` / `deleteItem`)

Prefer **tag-based** revalidation if multiple unrelated routes consume the same data — e.g. `revalidateTag(\`items:${userId}\`)` from the action and `unstable_cache(..., { tags: [\`items:${userId}\`] })` in the DB layer.

## Type-specific logic lives in components

The form is the only place that knows which fields to render per type. The action takes whatever the form sends.

```tsx
// src/components/items/item-form.tsx (sketch)
'use client';

export function ItemForm({ mode, type, initial }: ItemFormProps) {
  const { contentType } = type; // 'TEXT' | 'FILE' | 'URL'
  return (
    <form action={mode === 'new' ? createItem : updateItem.bind(null, initial!.id)}>
      <input type="hidden" name="itemTypeId" value={type.id} />
      <input type="hidden" name="contentType" value={contentType} />

      <TitleField defaultValue={initial?.title} />
      <DescriptionField defaultValue={initial?.description} />

      {contentType === 'TEXT' && (
        <>
          <TextContentField defaultValue={initial?.content} />
          {(type.name === 'snippet' || type.name === 'command') && (
            <LanguageSelect defaultValue={initial?.language} />
          )}
        </>
      )}

      {contentType === 'URL' && <UrlField defaultValue={initial?.url} />}

      {contentType === 'FILE' && (
        <FileUploadField
          defaultValue={initial && {
            fileUrl: initial.fileUrl,
            fileName: initial.fileName,
            fileSize: initial.fileSize,
          }}
        />
      )}

      <TagsField defaultValue={initial?.tags} />
      <CollectionsField defaultValue={initial?.collectionIds} />
      <SubmitButton />
    </form>
  );
}
```

Why this split works:

- **Field-by-type rules** (e.g. "snippets and commands get a language picker, prompts and notes don't") are presentation rules. They belong in the form, where they can change without redeploying any DB-side code.
- **Action stays generic.** Adding `language` to prompts later is a one-line form change. Removing `language` from notes is a one-line form change. The action validates whatever a `TEXT` payload contains.
- **Files vs. text vs. URL** is the only structural split, and it's already encoded in `ContentType`. The form switches on `contentType`; the validation schema discriminates on `contentType`; the action persists exactly the columns that matter for that branch.

## Component responsibilities

| Component                              | Responsibility                                                                                  | Boundary       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------- |
| `ItemList`                             | Grid layout + empty state for `/items/[type]` and search results                                | server         |
| `ItemCard` (exists)                    | Single-row preview: icon, title, description, content/url preview, tags, favorite/pin glyphs    | server         |
| `ItemDetail`                           | Read view: header (icon + title + actions menu), body (content/file viewer/url), tags, metadata | server         |
| `ItemForm`                             | Create + edit form. Reads `type.contentType` and renders fields. Submits to action.             | client         |
| `ItemActionsMenu`                      | ⋯ menu invoking `togglePin`, `toggleFavorite`, `deleteItem` server actions                      | client         |
| `fields/text-content-field`            | Markdown / code editor for `TEXT` types                                                         | client         |
| `fields/language-select`               | Language picker (snippets / commands)                                                           | client         |
| `fields/url-field`                     | URL input + on-blur validation                                                                  | client         |
| `fields/file-upload-field`             | R2 presigned-URL upload, progress, sets `fileUrl/fileName/fileSize`. Pro-gated.                 | client         |
| `fields/tags-field`                    | Tag combobox with create-on-enter                                                               | client         |
| `fields/collections-field`             | Multi-select of user's collections                                                              | client         |

Cards/lists/details are **server components** — they render from `lib/db` reads and do not need interactivity beyond `<Link>` navigation. Forms and the actions menu are **client components** because they own form state and call server actions on submit.

## Auth & ownership

Every read in `lib/db/items.ts` and every action in `lib/actions/items.ts` resolves the user via `auth()` from [`src/auth.ts`](../src/auth.ts) and includes `userId` in the `where` clause. The current `getDemoUserId()` placeholder in `lib/db/items.ts` is the single point of replacement when items CRUD lands behind auth — list/detail/dashboard queries all flow through it.

For `updateItem` / `deleteItem`, after `auth()` returns a session, the action does a guarded read first:

```ts
const existing = await prisma.item.findFirst({
  where: { id, userId: session.user.id },
  select: { id: true },
});
if (!existing) return { ok: false, error: 'NOT_FOUND' };
```

This avoids using just `id` in the update/delete `where`, which would let an attacker who knows a cuid mutate someone else's row.

## Pro gating

`file` and `image` types are Pro-only. Two enforcement points:

1. **Form** hides those types from the "create new" picker for non-Pro users.
2. **Action** re-checks `session.user.isPro` before persisting any item with `contentType === 'FILE'`. Bypasses the form, blocks API/automation abuse.

The list page (`/items/files`, `/items/images`) renders an upgrade-prompt empty state for non-Pro users instead of 404 — discoverable, not punitive.

## Open follow-ups

These don't block the design but should be tracked:

- **Custom item types** (`ItemType.userId != null`): the action already accepts an `itemTypeId`, so once the UI lets users create a type, mutations work without changes. Reads need a "system + my custom types" union in the sidebar query.
- **Bulk actions** (multi-select delete, multi-select add-to-collection): one extra action — `bulkDeleteItems(ids)` / `bulkAddToCollection(ids, collectionId)` — keyed off the same ownership guard.
- **Optimistic UI**: card-level pin/favorite toggles benefit from `useOptimistic` against the server action so the UI feels instant on slow networks.
- **R2 upload action**: presigned URLs minted from `app/api/upload/route.ts` (or a server action; either works in v16). The client posts the file directly to R2, then submits the form with the resulting `fileUrl`.
