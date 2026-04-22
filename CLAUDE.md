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
```

No test framework is configured.

## Stack

- **Next.js 16.2.4** with App Router — see AGENTS.md warning about breaking changes
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS v4** via `@tailwindcss/postcss` — uses `@import "tailwindcss"` syntax, not `@tailwind` directives
