# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Context Files
Read the following to get the full context of the project:
- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run test     # Run Vitest in watch mode
npm run test:run # Run Vitest once (CI mode)
```

**Testing scope:** Vitest covers **server actions and utilities only** (`src/**/*.test.ts`). React components are intentionally **not** unit-tested — `.test.tsx` files are excluded by `vitest.config.ts`. Co-locate test files next to the module under test (e.g., `src/lib/initials.test.ts`).

## Neon Database

When using the Neon MCP tools, always use:
- **Project:** `devstash` (ID: `floral-scene-91409912`)
- **Branch:** `development` (ID: `br-solitary-queen-amhu8vr9`)

Never query or modify the `production` branch unless explicitly told to do so.

## Stack

- **Next.js 16.2.4** with App Router — see AGENTS.md warning about breaking changes
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS v4** via `@tailwindcss/postcss` — uses `@import "tailwindcss"` syntax, not `@tailwind` directives
