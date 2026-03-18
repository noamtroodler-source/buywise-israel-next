

## Profile Page Design Alignment

### Problem
The dashboard cards (Recently Viewed, Saved Properties, Search Alerts, Saved Calculations, Research Journey) use `rounded-xl border border-border` — missing the unified elevated surface treatment. The settings sections use `rounded-2xl border border-border` but also lack the softer border and shadow tokens. This creates visual inconsistency with the rest of BuyWise Israel.

### Design Token Gap
**Current**: `rounded-xl border border-border bg-card p-3 md:p-4`
**Target**: `rounded-2xl border border-border/50 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)]`

### Files to Update

#### Dashboard Cards (5 files)
All get the unified surface treatment: `rounded-2xl`, `border-border/50`, layered shadow, consistent `p-4` padding.

1. **`src/components/profile/RecentlyViewedRow.tsx`** — Update all 3 container divs (loading, empty, populated states). Icon containers get `rounded-lg bg-primary/10` treatment. Empty state icon circle uses `bg-primary/5` instead of plain `bg-muted`.

2. **`src/components/profile/SavedPropertiesPreview.tsx`** — Same surface update. Property image cards get `rounded-xl` with softer border. Empty placeholder slots use `border-border/50` instead of `border-border`.

3. **`src/components/profile/AlertsCompact.tsx`** — Surface update. Alert rows get `rounded-xl` (up from `rounded-lg`). Active/inactive switch rows get subtle left-border accent when active.

4. **`src/components/profile/SavedCalculationsCompact.tsx`** — Surface update. Calculation rows get `rounded-xl`. Result values keep `text-primary` for brand consistency.

5. **`src/components/profile/ResearchJourneyCard.tsx`** — Upgrade from `rounded-xl border border-border` to unified surface. Keep the `bg-gradient-to-br from-primary/5` but add the layered shadow. Icon container already correct.

#### Settings Sections (4 files)
Already `rounded-2xl` but need `border-border/50` and the unified shadow.

6. **`src/components/profile/sections/BuyerProfileSection.tsx`** — Add `border-border/50` and shadow to outer container. Section header `bg-muted/20` border uses `border-border/30` for subtlety.

7. **`src/components/profile/sections/MortgageSection.tsx`** — Same treatment. The "Est. Max Budget" inner card already looks good.

8. **`src/components/profile/sections/LocationsSection.tsx`** — Same treatment. Location row items get `rounded-xl`.

9. **`src/components/profile/sections/AccountSection.tsx`** — Same treatment.

#### Profile Page Container
10. **`src/pages/Profile.tsx`** — The "My Buying Journey" button card: upgrade from `rounded-2xl border border-primary/20` to include the unified shadow. Tab content spacing stays `space-y-6`.

### Summary of Changes
- ~10 files, all purely className string updates
- No logic, hook, or structural changes
- Every card surface on the profile page will match the unified elevated surface system used across BuyWise Israel

