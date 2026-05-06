# Current Feature

<!-- Feature Name -->

## Dashboard Collections — Real Data

## Status

<!-- Not Started|In Progress|Completed -->

In Progress

## Goals

<!-- Goals & requirements -->

- Replace mock collection data in the dashboard main area with real data from Neon via Prisma
- Create `src/lib/db/collections.ts` with data fetching functions
- Fetch collections directly in a server component
- Collection card border color derived from the most-used content type in that collection
- Show small icons of all item types present in that collection
- Keep the current design (6 recent collection cards)
- Do NOT add items underneath — that comes later

## Notes

<!-- Any extra notes -->

Reference: @context/features/dashboard-collections-spec.md

## History

<!-- Keep this updated. Earliest to latest -->

### 2026-04-22 — Initial Next.js Setup
- Created Next.js 15 project with App Router, TypeScript, Tailwind CSS v4
- Added CLAUDE.md, AGENTS.md, and context files (project-overview, coding-standards, ai-interaction, current-feature)
- Removed default Next.js placeholder SVGs
- Pushed to GitHub: https://github.com/dianasheptak/devstash

### 2026-04-24 — Dashboard UI Phase 1
- Initialized shadcn/ui with Nova preset (Lucide + Geist), Button and Input components
- Added dark mode by default via `dark` class on `<html>`
- Created `/dashboard` route with layout: top bar (logo, search, New Item button) and sidebar/main placeholders
- Updated app metadata title to "DevStash"

### 2026-05-05 — Dashboard UI Phase 2
- Added collapsible desktop sidebar with `PanelLeftClose`/`PanelLeftOpen` toggle
- Added item type nav links (`/items/snippets`, `/items/prompts`, etc.) with type colors
- Favorite and recent collections in sidebar
- User avatar area at the bottom of the sidebar with name, email, and settings link
- Mobile drawer via shadcn Sheet component (hamburger in top bar)
- "Navigation" label left of the collapse icon in the sidebar toggle bar
- Centered search input in the header
- Favorite collections moved inside a collapsible "Collections" folder in the sidebar

### 2026-05-05 — Dashboard UI Phase 3
- Added 4 stats cards at the top (total items, collections, favorite items, favorite collections)
- Recent collections grid with favorite indicator and item count
- Pinned items section (conditional — renders only when pinned items exist)
- 10 most recent items grid with type icon/color, description, code preview, and tags
- Added shadcn Card and Badge components

### 2026-05-05 — Seed Data
- Installed bcryptjs for password hashing
- Rewrote prisma/seed.ts with demo user (demo@devstash.io, bcrypt 12 rounds) and 5 collections
- React Patterns: 3 TypeScript snippets (useDebounce, Context provider, utility functions)
- AI Workflows: 3 prompts (code review, documentation generator, refactoring assistant)
- DevOps: 1 snippet (Dockerfile), 1 command (deploy chain), 2 links (Docker, GitHub Actions)
- Terminal Commands: 4 commands (git, docker, process management, npm utilities)
- Design Resources: 4 links (Tailwind, shadcn/ui, Radix UI, Lucide)
- Seed is idempotent — cleans demo user data before recreating

### 2026-05-05 — Prisma + Neon PostgreSQL Setup
- Installed Prisma 7, `@prisma/adapter-pg`, `pg`, `dotenv`, `tsx`
- Created `prisma/schema.prisma` with Prisma 7 generator (`prisma-client`, mandatory output) and full schema: User, Item, ItemType, Collection, ItemCollection, Tag, and NextAuth models
- Created `prisma.config.ts` with datasource URL, migrations path, and seed command (Prisma 7 pattern)
- Created `src/lib/prisma.ts` singleton using `PrismaPg` driver adapter (required in Prisma 7)
- Created `prisma/seed.ts` to seed 7 system item types
- Created migration `20260505160854_init` and applied to Neon dev branch
- Seeded system item types successfully