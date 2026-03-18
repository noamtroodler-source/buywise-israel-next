

## Profile Page Revamp — A, B, E

### Problem
The Overview tab opens with four "0" stat cards that feel dead for new/early users. The header is functional but flat. The 3-tab structure fragments content and hides useful information.

### Changes

#### A. Replace Quick Stats with "Getting Started" Journey Checklist
**File: `src/components/profile/ProfileGettingStarted.tsx`** (new)
- Replace `ProfileQuickStats` on the Overview tab with a visual setup checklist
- 4 steps: Set up buyer profile → Set financing → Add locations → Save a property
- Each step shows a check icon (complete) or a numbered circle (incomplete), with a one-line description and a CTA button for incomplete steps
- Uses data from `useProfileCompletion` hook (already exists with `items` array)
- When all 4 are complete, collapse into a single congratulatory strip with the stat numbers inline (properties viewed, cities, saved, alerts) — so stats appear only once they're meaningful
- Styled as a single `rounded-2xl border bg-card` card with the unified elevated surface shadow

#### B. Richer Identity Card in Header
**File: `src/components/profile/ProfileWelcomeHeader.tsx`** (edit)
- Replace the linear progress bar with a **circular progress ring** (SVG, ~48px) showing completion percentage in the center
- Add buyer-type badge pills below the name row: e.g., "First-Time Buyer", "Oleh Hadash", pulled from `useBuyerProfile` tax category
- Add a compact "search snapshot" line if buyer profile exists: e.g., "Looking for: Primary Residence" — pulled from `purchase_purpose`
- Keep the avatar, name editing, sign-out, and role banners as-is

**File: `src/components/ui/progress-ring.tsx`** (new)
- Small SVG-based circular progress component
- Props: `value` (0-100), `size`, `strokeWidth`
- Primary color stroke on muted track, percentage text in center

#### E. Consolidate to 2-Tab Layout
**File: `src/pages/Profile.tsx`** (edit)
- Reduce from 3 tabs to 2: **"Dashboard"** and **"Settings"**
- **Dashboard tab** contains:
  - Getting Started checklist (or congratulatory stats strip when complete)
  - My Buying Journey link card
  - Research Journey card
  - Recently Viewed row
  - Saved Properties preview (moved from "Saved & Alerts")
  - Alerts compact (moved from "Saved & Alerts")
  - Saved Calculations compact (moved from "Saved & Alerts")
  - Support footer
- **Settings tab** contains:
  - Buyer Profile section
  - Financing/Mortgage section
  - Core Locations section
  - Account Settings section
- Tab styling unchanged (rounded-xl pills)

### Design Standards
- All cards use `rounded-2xl border border-border/50` with the unified elevated shadow
- Primary blue (`hsl(var(--primary))`) for accents, no hardcoded colors
- `bg-primary/10` for icon containers, `text-primary` for active states
- Empty states follow the "always render, never return null" pattern
- Progress ring uses semantic `stroke: hsl(var(--primary))` and `stroke: hsl(var(--muted))`

