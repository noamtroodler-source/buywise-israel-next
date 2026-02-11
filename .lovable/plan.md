

## Replace "Customize" Link with Mortgage Popover

**Goal:** Replace the current "Customize" link (which navigates away to `/tools`) with an inline popover that lets users adjust mortgage preferences without leaving the listing page. Changes persist across all listings via the existing preference system.

---

### What Changes

#### 1. Update `PropertyQuickSummary.tsx`

Replace the `<Link to="/tools?calculator=mortgage&...">Customize</Link>` with a `<Popover>` wrapping the existing `MortgageInlineEdit` component.

**Before:**
```text
Est. 8,500-10,200/mo  *  [Customize -> navigates to /tools page]
```

**After:**
```text
Est. 8,500-10,200/mo  *  [Customize -> opens popover with down payment + term fields]
```

The popover will:
- Anchor to the "Customize" button
- Contain the `MortgageInlineEdit` form (down payment toggle between amount/percent, loan term select)
- Close on save or cancel
- Immediately update the estimate line since both read from the same `useMortgagePreferences` hook

#### 2. Minor cleanup to `MortgageInlineEdit.tsx`

- Remove the left border styling (`border-l-2 border-primary/20`) since it was designed for inline accordion context, not a popover
- Adjust padding to fit naturally inside a popover container

---

### Persistence Behavior (already works, no changes needed)

- **Guest users**: Preferences save to `localStorage` under `mortgage_preferences` key. Persists across all listings within the same browser session. Cleared when browser data is cleared.
- **Logged-in users**: Preferences save to their profile in the database. Persists permanently across devices.
- **Both locations stay in sync**: The cost breakdown's `PersonalizationHeader` and the quick summary's estimate both read from the same `useMortgagePreferences` hook. A change in the popover automatically reflects in the cost breakdown section below, and vice versa.

### Technical Details

**Files modified:**
- `src/components/property/PropertyQuickSummary.tsx` — Replace `<Link>` with `<Popover>` + `<MortgageInlineEdit>`. Add state for popover open/close. Import Popover components and MortgageInlineEdit.
- `src/components/property/MortgageInlineEdit.tsx` — Remove left-border styling, adjust padding for popover context.

**No new files. No database changes. No new hooks.**

