
## What’s happening (why you still see the “double thing”)
You successfully cleaned up the **breadcrumb row**, but you still have a second navigation element coming from the **Hero components** themselves:

- `PropertyDetail` renders `DualNavigation` (top row: “Go back · All Rentals/All Properties”).
- `PropertyHero` also renders its own button: “← All Rentals / All Properties”.
- `ProjectDetail` renders `DualNavigation` (top row: “Go back · All Projects”).
- `ProjectHero` also renders its own button: “← All Projects”.

So on the page you end up with:
1) DualNavigation row  
2) A second “All X” back button in the hero  
That matches exactly what your screenshots show.

## The “best possible + permanent” fix (cleanest architecture)
Centralize navigation so it only comes from one place per viewport:
- **Desktop/tablet (md+)**: use `DualNavigation` only
- **Mobile (below md)**: use the existing `MobileHeaderBack` sticky header only
- **Remove hero-level back buttons entirely** (heroes shouldn’t own page navigation)

This prevents regressions because:
- Navigation is controlled at the **page level** (`PropertyDetail`, `ProjectDetail`), not inside reusable visual components (`PropertyHero`, `ProjectHero`).
- Heroes become purely “media/gallery” components.

## Implementation plan (code changes)

### 1) Remove the back button from `PropertyHero`
**File:** `src/components/property/PropertyHero.tsx`
- Delete the block:
  - “{/* Back Button */}”
  - `<Button ... asChild><Link ...>All Rentals/All Properties</Link></Button>`
- Remove unused imports:
  - `Link` (if no longer used in this component)
  - `ArrowLeft` (will become unused)

Result: the property detail page will no longer have the second “All Rentals / All Properties” row under the dual nav.

### 2) Remove the back button from `ProjectHero`
**File:** `src/components/project/ProjectHero.tsx`
- Delete the block:
  - “{/* Back Button */}”
  - `<Button ... asChild><Link to="/projects">All Projects</Link></Button>`
- Remove unused imports:
  - `Link` (if no longer used)
  - `ArrowLeft`

Result: project detail will no longer show the second “All Projects” row under dual nav.

### 3) Add the sticky mobile back header to PropertyDetail (mobile only)
**File:** `src/pages/PropertyDetail.tsx`
- Import: `MobileHeaderBack` from `src/components/shared/MobileHeaderBack`
- Render it near the top of the page (inside the `<Layout>` and before main content), for mobile only (it already has `md:hidden` in its own styles):
  - `title`: property title (or a shorter label if needed)
  - `subtitle`: city/neighborhood or formatted price
  - `showShare`: true (since you already have `handleShare`)
  - `onShare`: `handleShare`

Keep existing `DualNavigation` as-is (it’s already `hidden md:block`), so:
- Mobile sees only the sticky back header
- Desktop sees only `DualNavigation`

### 4) Add the sticky mobile back header to ProjectDetail and make DualNavigation desktop-only
**File:** `src/pages/ProjectDetail.tsx`
- Import: `MobileHeaderBack`
- Render `<MobileHeaderBack ... />` near the top of the container.
  - `title`: project name
  - `subtitle`: city (and optionally “New development”)
  - `showShare`: optional (if you want parity; if you don’t currently expose share on projects, keep it false for now)
- Change the existing `DualNavigation` to be desktop-only, matching PropertyDetail:
  - Wrap it with `className="hidden md:block mb-4"` (or move the wrapper div around it)
  - This avoids having DualNavigation also appear on mobile alongside the mobile header.

### 5) (Nice-to-have) Make MobileHeaderBack’s property fallback smarter
**File:** `src/components/shared/MobileHeaderBack.tsx`
Right now the fallback for `/property/` goes to `/listings` (unfiltered). Since you now have clear “rent vs buy” parent destinations, we can improve fallback in a safe way:
- Allow `MobileHeaderBack` to accept an optional `fallbackPath` prop
- On PropertyDetail pass:
  - `/listings?status=for_rent` or `/listings?status=for_sale` based on `property.listing_status`
- On ProjectDetail pass:
  - `/projects`

This makes mobile “back” behavior consistent with your DualNavigation fallback behavior.

## Acceptance checklist (what you should see after)
- Property detail (desktop): only `← Go back · All Rentals/All Properties` (no second “← All X” row)
- Property detail (mobile): only sticky back header (no hero back button)
- Project detail (desktop): only `← Go back · All Projects`
- Project detail (mobile): only sticky back header, no DualNavigation row, no hero back button

## Files that will change
- `src/components/property/PropertyHero.tsx` (remove hero back button)
- `src/components/project/ProjectHero.tsx` (remove hero back button)
- `src/pages/PropertyDetail.tsx` (add MobileHeaderBack for mobile)
- `src/pages/ProjectDetail.tsx` (add MobileHeaderBack; make DualNavigation desktop-only)
- `src/components/shared/MobileHeaderBack.tsx` (optional: add `fallbackPath` prop for better mobile back consistency)
