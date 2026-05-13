# Item Types

DevStash organizes user content around seven **system item types**. Each type is a row in the `item_types` table (`isSystem = true`, `userId = null`) seeded by [`prisma/seed.ts`](../prisma/seed.ts) and rendered with the icon map in [`src/lib/constants/item-types.ts`](../src/lib/constants/item-types.ts).

A system type defines three things:
- **Visual identity** — Lucide icon name + hex color, used for sidebar nav, badges, card borders, and dominant-color computation.
- **Content classification** — drives which `ContentType` enum value (`TEXT` / `FILE` / `URL`) the item is created with, and therefore which fields on `Item` carry the payload.
- **Access tier** — `file` and `image` are Pro-only at launch; the other five are available on the free tier.

## Per-type reference

### Snippet
- **Icon:** `Code` (Lucide)
- **Color:** `#3b82f6` (blue)
- **Purpose:** Reusable code blocks — hooks, utilities, components, configs, Dockerfiles. The default "developer's first item type."
- **Content classification:** `TEXT`
- **Key `Item` fields:** `title`, `content` (the code body), `language` (e.g. `typescript`, `bash`, `dockerfile` — drives syntax highlighting), `description`, `tags`.
- **Route:** `/items/snippets`

### Prompt
- **Icon:** `Sparkles` (Lucide)
- **Color:** `#8b5cf6` (purple)
- **Purpose:** AI prompts, system messages, and reusable LLM templates (code review, refactor, doc-gen, etc.).
- **Content classification:** `TEXT`
- **Key `Item` fields:** `title`, `content` (the prompt body, often Markdown), `description`, `tags`. `language` is typically unset.
- **Route:** `/items/prompts`

### Command
- **Icon:** `Terminal` (Lucide)
- **Color:** `#f97316` (orange)
- **Purpose:** Shell commands and one-liners — git, docker, process management, package managers, deploy chains.
- **Content classification:** `TEXT`
- **Key `Item` fields:** `title`, `content` (the command or grouped commands), `language` (typically `bash`), `description`, `tags`.
- **Route:** `/items/commands`

### Note
- **Icon:** `StickyNote` (Lucide)
- **Color:** `#fde047` (yellow)
- **Purpose:** Free-form Markdown notes — explanations, course outlines, meeting notes, scratchpad thoughts.
- **Content classification:** `TEXT`
- **Key `Item` fields:** `title`, `content` (Markdown body), `description`, `tags`. `language` is typically unset.
- **Route:** `/items/notes`

### File (Pro)
- **Icon:** `File` (Lucide)
- **Color:** `#6b7280` (gray)
- **Purpose:** Arbitrary uploaded documents — context files, PDFs, archives, datasets. Stored in Cloudflare R2.
- **Content classification:** `FILE`
- **Key `Item` fields:** `title`, `fileUrl` (R2 URL), `fileName` (original filename), `fileSize` (bytes), `description`, `tags`. `content` is unset.
- **Route:** `/items/files`

### Image (Pro)
- **Icon:** `Image` (Lucide)
- **Color:** `#ec4899` (pink)
- **Purpose:** Screenshots, diagrams, design references, mockups. Same storage path as files but rendered with image previews.
- **Content classification:** `FILE`
- **Key `Item` fields:** `title`, `fileUrl`, `fileName`, `fileSize`, `description`, `tags`. `content` is unset.
- **Route:** `/items/images`

### Link
- **Icon:** `Link` (Lucide, imported as `LinkIcon` to avoid colliding with `next/link`)
- **Color:** `#10b981` (emerald)
- **Purpose:** Bookmarked URLs — docs, articles, tools, references.
- **Content classification:** `URL`
- **Key `Item` fields:** `title`, `url` (the target URL), `description`, `tags`. `content`, `fileUrl`, and `language` are unset.
- **Route:** `/items/links`

## Summary tables

### Content classification

| Type    | `ContentType` | Payload field(s)                  | Pro-only |
| ------- | ------------- | --------------------------------- | :------: |
| Snippet | `TEXT`        | `content` (+ `language`)          |          |
| Prompt  | `TEXT`        | `content`                         |          |
| Command | `TEXT`        | `content` (+ `language`)          |          |
| Note    | `TEXT`        | `content`                         |          |
| File    | `FILE`        | `fileUrl`, `fileName`, `fileSize` |    ✅    |
| Image   | `FILE`        | `fileUrl`, `fileName`, `fileSize` |    ✅    |
| Link    | `URL`         | `url`                             |          |

### Visual identity

| Type    | Lucide icon  | Hex color | Tailwind family | CSS variable        |
| ------- | ------------ | --------- | --------------- | ------------------- |
| Snippet | `Code`       | `#3b82f6` | blue-500        | `--color-snippet`   |
| Prompt  | `Sparkles`   | `#8b5cf6` | violet-500      | `--color-prompt`    |
| Command | `Terminal`   | `#f97316` | orange-500      | `--color-command`   |
| Note    | `StickyNote` | `#fde047` | yellow-300      | `--color-note`      |
| File    | `File`       | `#6b7280` | gray-500        | `--color-file`      |
| Image   | `Image`      | `#ec4899` | pink-500        | `--color-image`     |
| Link    | `Link`       | `#10b981` | emerald-500     | `--color-link`      |

## Shared properties (all types)

Every `Item` row, regardless of type, carries:

- **Identity & ownership** — `id` (cuid), `userId` (FK → `users`, cascade delete), `itemTypeId` (FK → `item_types`).
- **Display** — `title` (required), `description` (optional, `@db.Text`).
- **Organization** — `tags` (many-to-many via `Tag`), `collections` (many-to-many via `ItemCollection`), `isFavorite` (default `false`), `isPinned` (default `false`).
- **Timestamps** — `createdAt` (default `now()`), `updatedAt` (auto via `@updatedAt`).
- **Indexes** — on `userId`, `itemTypeId`, and `createdAt`.

The `contentType` enum (`TEXT` / `FILE` / `URL`) on `Item` is what actually determines which payload column is used at runtime; the system `ItemType` row provides the visual + classification metadata that callers map to that enum when creating items.

## Display differences

The current dashboard / sidebar implementation differentiates types in three ways:

1. **Icon + color in chrome.** `ICON_MAP` resolves the seeded `icon` string (`"Code"`, `"Sparkles"`, etc.) to a Lucide component. The `color` hex is applied as the icon stroke and as the `border-l-[3px]` accent on item cards. Sidebar nav items show per-type item counts on the right.
2. **Card body.** Text-content cards (snippet / prompt / command / note) render a clipped preview of `content` — for snippets and commands, with `language`-aware monospace styling. File / image cards show file metadata (name + size) and, for images, a thumbnail. Link cards show the URL host and `description`.
3. **Pro badge.** The sidebar nav renders a dimmed `PRO` badge next to the **Files** and **Images** entries (see [`src/components/layout/sidebar-nav.tsx`](../src/components/layout/sidebar-nav.tsx)). All other types render without a badge.

## Future: custom item types

The schema already supports user-owned types: `ItemType.userId` is nullable and the unique constraint is `@@unique([name, userId])`, so a user can define a type named `"snippet"` without colliding with the system one. The Pro tier feature comparison lists "Custom Types" as 🔜 — when shipped, custom types will reuse the same Lucide icon string + hex color contract as system types.
