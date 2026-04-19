# BuyWiseIsrael — Claude Code Context

Property discovery platform for English-speaking international buyers in Israel. Aggregates listings (Yad2, Madlan, agencies), market data for 30+ cities, tax/cost calculators, agent matching. Three audiences: buyers, agents/agencies (dashboards + import pipeline), developers (projects).

## Workflow

Built primarily in **Lovable**; this local clone exists so Claude Code can edit real code. Lovable ↔ GitHub is auto-synced. Local ↔ GitHub via `git pull` / `git push`. Both sides mirror — Lovable picks up pushes within seconds.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui (full Radix suite)
- **Backend**: Supabase (auth, Postgres, 68 edge functions)
- **Server**: custom `server.ts` (Express) — SSR meta injection for SEO-critical routes only; rest is pure SPA
- **Deploy**: Vercel via `api/index.ts` serverless wrapper (see `vercel.json`)
- **Data**: React Query (server state), 3 contexts (Compare, Favorites, Preferences)
- **Maps**: Leaflet + react-leaflet, Geoman for drawing, supercluster for clustering
- **Forms**: React Hook Form + Zod

## Commands

```bash
npm install
npm run dev       # Vite dev server
npm run build     # Build SPA to dist/
npm run start     # Build + run SSR server (production-like)
npm run lint      # ESLint
```

## Directory Map

- `src/components/` — 30+ feature folders (admin, agency, agent, auth, billing, blog, city, compare, guides, home, listings, etc.)
- `src/pages/` — 45+ route pages, routed via React Router v6 (defined in `App.tsx`, not file-based)
- `src/hooks/` — 180+ hooks. Notable: `useAuth`, admin/agency hooks, data-fetch hooks per entity
- `src/contexts/` — CompareContext, FavoritesContext, PreferencesContext
- `src/integrations/supabase/` — `client.ts` (SDK init), `types.ts` (AUTO-GENERATED, do not edit)
- `src/lib/` — analytics, calculations (mortgage/tax), constants, SEO, routing config, neighborhood matching
- `src/data/` — static data (cities, neighborhoods)
- `supabase/migrations/` — 223 migrations
- `supabase/functions/` — 68 Deno edge functions (import-agency-listings, detect-duplicates, bulk-update-neighborhoods, geo/batch ops, etc.)
- `docs/` — neighborhood-boundary prompt template
- `tmp/` — debug artifacts, NOT part of source
- `.lovable/plan.md` — strategic roadmap for multi-source import pipeline

## SSR Specifics

`server.ts` injects real meta tags at request time for 5 routes only:
- `/` (homepage)
- `/property/:id`
- `/areas/:slug`
- `/blog/:slug`
- `/projects/:slug`

All other routes fall back to SPA shell. Vercel deploys both the SPA (dist/) and the Express handler (api/index.ts).

## Auth & Roles

- Supabase Auth via `useAuth` context
- `ProtectedRoute` wrapper checks role (admin / agent / agency)
- Each dashboard has role guards

## Key Complexity: Multi-Source Import Pipeline

Agencies add listings from multiple sources (Yad2, Madlan, own site). `import-agency-listings` edge function merges with source-priority enforcement: **Yad2 > Madlan > Website**. Conflicts tracked in `conflicts_log` table. Phase rollout plan in `.lovable/plan.md`.

## Conventions

- Route pages: critical ones (home, listings, property/project detail) are static imports (eager); rest lazy-loaded
- Never edit `src/integrations/supabase/types.ts` — regenerate from Supabase CLI instead
- Styling: Tailwind + shadcn only, no ad-hoc CSS unless in `src/styles/`
- After edits that might affect builds: `npm run build` to catch SSR/TS errors the dev server skips

## Working With Claude Code

- Session auto-pulls from GitHub on start (hook in `~/.claude/settings.json`)
- Ask before force-push or destructive ops; pushes to `main` flow directly to Lovable
- When editing components, check if a shadcn primitive already exists before rolling custom UI
