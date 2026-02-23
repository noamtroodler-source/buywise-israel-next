

# Add Agency Logo to Property Cards

## What Changes

A small circular agency logo (24px) will appear in the bottom-right of the card info section, aligned with the property stats row. This applies to both the main `PropertyCard` (listings grid) and the `MapListCard` (map search sidebar).

## How It Works

The data is already available -- the properties query already joins `agent > agency(id, name, logo_url)`. No database changes needed.

For each card, if `property.agent?.agency?.logo_url` exists, a small circular avatar is rendered at the end of the stats/features row. It links to the agency page via `/agencies/{slug}` (the slug is not in the join, but the agency name can serve as a tooltip). The logo uses the existing `Avatar` component for consistency.

## Technical Details

### File: `src/components/property/PropertyCard.tsx`

**Both compact and standard modes** -- add the agency logo to the bottom-right of the content section:

- In the features row (`<div className="flex items-center gap-3 text-muted-foreground">`), add a `ml-auto` avatar at the end
- Uses `Avatar` (h-6 w-6) with `AvatarImage` showing the agency `logo_url`
- Falls back to a small building icon if no logo
- Wrapped in a click handler that navigates to the agency page (stops event propagation so it doesn't trigger the property link)
- Tooltip on hover showing agency name

Changes for **compact mode** (lines ~360-378): Add avatar after the location line, right-aligned in a flex row with the "Days on Market" label.

Changes for **standard mode** (lines ~567-589): Add avatar at the end of the features flex row using `ml-auto`.

### File: `src/components/map-search/MapListCard.tsx`

Same pattern -- in the info section, add a small (h-5 w-5) avatar in the bottom-right corner of the card details, floated right on the type label row.

### File: `src/types/database.ts`

No changes needed -- `Property.agent?.agency` already typed with `logo_url`.

### Summary

| File | Change |
|------|--------|
| `src/components/property/PropertyCard.tsx` | Add agency logo avatar to features row (both modes) |
| `src/components/map-search/MapListCard.tsx` | Add agency logo avatar to info section |

No new dependencies. No database changes.
