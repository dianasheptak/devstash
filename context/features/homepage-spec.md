# Homepage Spec

## Overview

Convert the marketing mockup at `prototypes/homepage/` into the actual Next.js app homepage at `/` (the root `app/page.tsx`). Authenticated users should be redirected to `/dashboard`. Unauthenticated users see this page.

## Route & Auth

- `src/app/page.tsx` — server component
- Call `auth()` at the top; if a session exists, `redirect('/dashboard')`
- No layout wrapping needed (homepage has its own nav/footer)

## Component Breakdown

### Server Components (in `src/components/homepage/`)

| Component | Notes |
|---|---|
| `homepage-nav.tsx` | Logo, nav links, Sign In + Get Started buttons |
| `hero-section.tsx` | Text content + visual shell (passes no data) |
| `features-section.tsx` | 6 feature cards, static content |
| `ai-section.tsx` | Pro badge, checklist, code mockup (static) |
| `pricing-section.tsx` | Pricing cards layout; billing toggle is a client island |
| `cta-section.tsx` | Single CTA block |
| `homepage-footer.tsx` | Logo, link columns, copyright |

### Client Components (islands)

| Component | Notes |
|---|---|
| `chaos-canvas.tsx` | Canvas animation from `script.js` — `"use client"`, `useEffect` for rAF loop, mouse repel |
| `mobile-nav.tsx` | Hamburger + slide-down mobile menu state |
| `pricing-toggle.tsx` | Monthly/yearly switch; owns `isYearly` state, updates price display |
| `scroll-fade.tsx` | `IntersectionObserver` wrapper that adds `visible` class to children; wraps sections |
| `navbar-scroll.tsx` | Adds `scrolled` class to nav on scroll > 20px |

## Sections

### Navbar
- Sticky, gets `bg-background/90 backdrop-blur border-b` when scrolled (replaces prototype CSS)
- Logo: hex icon + "DevStash" text
- Links: Features (`#features`), Pricing (`#pricing`)
- Actions: Sign In → `/sign-in`, Get Started → `/register`
- Mobile: hamburger toggles slide-down menu with same links

### Hero
- Headline + subtext (left column)
- Hero visual (right column): chaos canvas box → arrow → dashboard preview mockup
- CTA: "Get Started Free" → `/register`, "See Features" → `#features`
- Dashboard preview mockup is static JSX (sidebar dots + cards) — no canvas needed

### Features
- Section ID `features` for anchor nav
- 6 cards: Code Snippets, AI Prompts, Commands, Notes, Files & Docs (Pro badge), Collections
- Each card has icon, title, description, and a `--accent` color for the glow effect via inline style or Tailwind arbitrary value
- Use Lucide icons (matching the project's icon system) instead of inline SVGs

### AI Section
- Pro badge, checklist of 4 AI features with descriptions
- Code mockup block: macOS dots + file title header + syntax-highlighted code + AI tags row
- "Upgrade to Pro" → `/register`
- Code mockup is static JSX (no Monaco); use `<pre>` with Tailwind for styling

### Pricing
- Section ID `pricing`
- Monthly/yearly toggle: client component, default monthly
- Free card: static, "Get Started Free" → `/register`
- Pro card: price updates with toggle ($8/mo or $72/yr), "Upgrade to Pro" → `/register`
- "Most Popular" badge on Pro card

### CTA
- "Get Started Free" → `/register`

### Footer
- Logo + tagline
- 3 link columns: Product (Features, Pricing, Changelog), Resources (Documentation, Blog, GitHub), Company (About, Privacy, Terms)
- Non-functional links (no pages yet) use `href="#"` 
- Copyright year: rendered server-side via `new Date().getFullYear()`

## Styling

- Use Tailwind v4 throughout (no custom CSS file) — this replaces `styles.css`
- Dark background matching the rest of the app (`bg-background`)
- Gradient text on hero headline: `bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent`
- Feature card glow: `shadow-[0_0_24px_var(--accent)]` via inline style with CSS var
- Use shadcn `Badge` for Pro badges
- Button variants from shadcn: primary actions use `<Button>`, ghost/outline where appropriate
- Scroll fade-in: CSS class `fade-in` with `opacity-0 translate-y-4 transition-all` toggling to `visible` (`opacity-100 translate-y-0`) via `IntersectionObserver`

## References

- `prototypes/homepage/index.html` — structure and content
- `prototypes/homepage/script.js` — animation and interactivity logic to port
- `prototypes/homepage/styles.css` — visual reference only; reimplement in Tailwind
- `context/project-overview.md` — pricing tiers and feature list
