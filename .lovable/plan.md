
# Remove Redundant Status Badge from Property Listings

## The Problem
The "For Sale" and "For Rent" badges on property detail pages are redundant - users already know the listing type based on:
1. The navigation says "All Properties" or "All Rentals"
2. The page they came from (Properties vs Rentals section)
3. The price display (₪7,140,000 vs ₪8,800/month)

It just adds visual clutter without providing useful information.

## Solution
Remove the status badge entirely from `PropertyHero.tsx` for `for_sale` and `for_rent` listings.

**Keep badges only for terminal states**: "Sold" and "Rented" - these ARE useful to show since they indicate the listing is no longer available.

## File to Update

### `src/components/property/PropertyHero.tsx`

**Lines 121-126** - Conditionally render the status badge only for sold/rented:

```tsx
// Before - always shows status
{/* Status Badge */}
<div className="absolute top-4 left-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
  <Badge className="text-sm px-3 py-1.5 bg-background/90 text-foreground backdrop-blur-sm border-0">
    {statusLabels[property.listing_status] || property.listing_status}
  </Badge>
</div>

// After - only show for sold/rented (terminal states)
{/* Status Badge - only show for sold/rented */}
{(property.listing_status === 'sold' || property.listing_status === 'rented') && (
  <div className="absolute top-4 left-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
    <Badge className="text-sm px-3 py-1.5 bg-background/90 text-foreground backdrop-blur-sm border-0">
      {statusLabels[property.listing_status] || property.listing_status}
    </Badge>
  </div>
)}
```

## Result

| Listing Type | Before | After |
|--------------|--------|-------|
| For Sale | Shows "For Sale" badge | No badge (clean image) |
| For Rent | Shows "For Rent" badge | No badge (clean image) |
| Sold | Shows "Sold" badge | Still shows "Sold" badge |
| Rented | Shows "Rented" badge | Still shows "Rented" badge |

This keeps useful information (sold/rented warnings) while removing the obvious/redundant labels.
