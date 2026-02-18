
# Active Boost Display — Complete Fix Plan

## Root Cause Analysis

The infrastructure is 70% correct. The `active_boosts` and `visibility_products` tables are properly seeded, `_isBoosted` flag exists, and `PromotedBadge` renders on PropertyCard. Three specific gaps prevent promoted listings from appearing:

### Gap 1 — Wrong slug in `useFeaturedProjects` (Homepage Projects section)

`useFeaturedProjects` in `src/hooks/useProjects.tsx` (line 162) queries visibility_products with slug `'homepage_project_featured'`. **This slug does not exist.** The actual DB slugs are `homepage_project_hero` and `homepage_project_secondary`. The Supabase query returns `null` every time, so the entire boost merge block silently no-ops. Boosted homepage projects are never surfaced.

### Gap 2 — Projects page (`/projects`) has zero boost integration

`usePaginatedProjects` in `src/hooks/usePaginatedProjects.tsx` is a vanilla paginated query with no boost logic. The `/projects` page has a `projects_boost` product in the DB (slug: `projects_boost`) that is supposed to pin boosted projects to the top of the grid — but `usePaginatedProjects` never fetches boost IDs, never prepends them, and never sets `_isBoosted`.

### Gap 3 — Projects page card has no PromotedBadge

The `/projects` page renders project cards as inline JSX inside `Projects.tsx` — not through a reusable `ProjectCard` component. Even after fixing Gap 2, the `_isBoosted` flag would be set on the project object but no visual indicator would render. The card JSX needs a `PromotedBadge` import and conditional render on the boosted badge overlay.

### What's Already Working (Do Not Touch)

- `useFeaturedSaleProperties` → slug `homepage_sale_featured` → correct
- `useFeaturedRentalProperties` → slug `homepage_rent_featured` → correct  
- `usePaginatedProperties` → slug `search_priority` → correct, boosts prepended
- `useCityFeaturedProperties` → slug `city_spotlight` → correct
- `PropertyCard._isBoosted` → `PromotedBadge` renders → correct

---

## What We're Building

### Fix 1 — Correct the homepage projects slug (1 line change)

In `src/hooks/useProjects.tsx`, `useFeaturedProjects()`:

**Current** (line 162):
```ts
.eq('slug', 'homepage_project_featured')
```

**Fix:** The two homepage project products (`homepage_project_hero`, `homepage_project_secondary`) need to be queried together, then boosted projects fetched and merged by priority:
- Hero-boosted projects → position 0 (the large left card)
- Secondary-boosted projects → positions 1–2 (the two right cards)
- Already-included admin projects take precedence (de-duplication via `adminIds` Set)

The fix replaces the single wrong slug lookup with a two-slug lookup (`homepage_project_hero` and `homepage_project_secondary`), fetches their active boosts separately, and merges hero-first then secondary into the display array. The existing hero/secondary bento layout in `ProjectsHighlight` will then automatically show the correct projects since it just slices `displayProjects[0]` as hero and `displayProjects.slice(1, 3)` as secondary.

**File:** `src/hooks/useProjects.tsx`

---

### Fix 2 — Add boost prepending to `usePaginatedProjects`

Mirror the pattern from `usePaginatedProperties` exactly:

1. **New sub-query** inside `usePaginatedProjects`: fetch `visibility_products` where `slug = 'projects_boost'`, then fetch `active_boosts` to get `boostedProjectIds[]`.

2. **Page 1 exclusion**: when `page === 1 && boostedProjectIds.length > 0`, add `.not('id', 'in', ...)` to exclude boosted projects from the organic paginated query (prevents duplicates).

3. **Boosted projects fetch**: fetch full project rows for `boostedProjectIds`, tag each with `_isBoosted: true`.

4. **Merge**: `page === 1 ? [...boostedProjects, ...organicProjects] : organicProjects`

**File:** `src/hooks/usePaginatedProjects.tsx`

---

### Fix 3 — Add PromotedBadge to the Projects page card

The Projects page (`src/pages/Projects.tsx`) renders cards inline. The badge overlay section (the `absolute top-3 left-3` div) currently only shows a price-drop badge. Add a `PromotedBadge` import and render it conditionally when `(project as any)._isBoosted === true`.

The badge goes in the top-left overlay, alongside the existing price drop badge — same positioning pattern as `PropertyCard`.

**File:** `src/pages/Projects.tsx`

---

### Fix 4 — Add `_isBoosted` to the `Project` type

`src/types/projects.ts` currently has no `_isBoosted` field on the `Project` interface (unlike `Property` in `database.ts` which has it documented at line 107–108). Add it as an optional client-side field with a JSDoc comment, so TypeScript doesn't require `(project as any)` casts and the intent is clear.

**File:** `src/types/projects.ts`

---

## Files Summary

| File | Type | Change |
|---|---|---|
| `src/hooks/useProjects.tsx` | Edit | Fix wrong slug `homepage_project_featured` → query both `homepage_project_hero` and `homepage_project_secondary`; merge hero-first into display array |
| `src/hooks/usePaginatedProjects.tsx` | Edit | Add `projects_boost` boost prepending on page 1: fetch IDs, exclude from organic query, prepend with `_isBoosted: true` |
| `src/pages/Projects.tsx` | Edit | Import `PromotedBadge`; add conditional render in the card badge overlay when `_isBoosted` is true |
| `src/types/projects.ts` | Edit | Add `_isBoosted?: boolean` client-side field to `Project` interface |

---

## Technical Notes

- **No DB changes** — all four slugs (`homepage_project_hero`, `homepage_project_secondary`, `projects_boost`, etc.) are already seeded and active in `visibility_products`.
- **No active boosts currently in DB** — `active_boosts` table is empty (confirmed via query). All fixes are safe to deploy; they gracefully no-op when no boosts are active and immediately work when the first boost is purchased.
- **Hero/secondary ordering**: the homepage bento layout in `ProjectsHighlight` does `displayProjects[0]` → hero card, `displayProjects.slice(1,3)` → side cards. The merge strategy is: admin hero slot → admin secondary slots → boosted hero → boosted secondary. This means a paid `homepage_project_hero` boost puts a project in position 0 only if there is no admin-pinned hero slot.
- **`_isBoosted` on `Project` type**: the field is a client-side-only annotation (like `Property._isBoosted`), never persisted to the DB. It is set in JS after the query and filtered out before any DB writes.
- **Boost prepending in `usePaginatedProjects`** does not affect the total count — the count query remains unmodified, matching the same pattern used in `usePaginatedProperties`.
- **`PromotedBadge` in Projects.tsx** uses the same amber-tinted badge already shown on `PropertyCard`, keeping the visual language consistent across listing types.
