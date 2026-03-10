

# Make Onboarding Checklist Items Clickable

## What
Make each row in the "Complete Your Profile" checklist a clickable link that navigates to the relevant settings page/section, instead of only having the small icon button on the right.

## Changes

**File: `src/components/agency/AgencyOnboardingProgress.tsx`**

1. **Make entire row clickable** — Wrap each incomplete item's row in a `Link` component (or use `onClick` with `navigate`) so clicking anywhere on the row navigates to the target page.

2. **Add missing links**:
   - `team` item → `/agency/team`
   - `listing` item → `/agency/properties/new`

3. **Add cursor and hover styling** — Apply `cursor-pointer` and enhanced hover state to incomplete items with links, so users know they're clickable.

4. **Keep completed items non-clickable** — Completed (checked) items remain static with no navigation, since they're already done.

5. **Remove the separate icon button** — Since the whole row is now clickable, the standalone icon button on the right becomes redundant. Replace it with the icon displayed inline (non-interactive) as a visual indicator.

