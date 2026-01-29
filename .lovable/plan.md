

# Move Listing Feedback to Individual Detail Pages

## Summary

Move the `ListingFeedback` component from the main listing grid pages (`Listings.tsx` and `Projects.tsx`) to each individual property/project detail page. This places the feedback prompt where users are most engaged — after viewing a specific listing.

## Current State vs. Requested Change

| Current Location | New Location |
|------------------|--------------|
| `Listings.tsx` (after grid of all rentals/buy) | `PropertyDetail.tsx` (each individual property page) |
| `Projects.tsx` (after grid of all projects) | `ProjectDetail.tsx` (each individual project page) |

## Placement Strategy

### PropertyDetail.tsx (Rentals & Buy)
**Location**: After `PropertyNextSteps`, before the closing of the main content column

The feedback prompt will appear after the user has seen:
1. Hero images
2. Quick summary (price, beds, baths)
3. Description
4. Value snapshot & cost breakdown
5. Location map
6. Next steps CTAs
7. **→ Listing Feedback (NEW)**

Then Similar Properties follows outside the grid.

### ProjectDetail.tsx (New Construction)
**Location**: After `ProjectNextSteps`, before `ProjectFAQ`

The feedback prompt will appear after:
1. Hero images
2. Quick summary
3. Description & amenities
4. Floor plans
5. Cost breakdown
6. Timeline
7. Location
8. Next steps CTAs
9. **→ Listing Feedback (NEW)**

Then FAQ, Agent Card, and Developer Card follow.

## Dynamic Type Detection

The `ListingFeedback` component already supports three types: `rentals`, `buy`, `projects`.

For **PropertyDetail.tsx**, I'll detect the listing type from `property.listing_status`:
- `for_rent` → `listingType="rentals"`
- `for_sale` or `sold` → `listingType="buy"`

For **ProjectDetail.tsx**:
- Always `listingType="projects"`

## Files to Modify

| File | Action |
|------|--------|
| `src/pages/Listings.tsx` | **REMOVE** ListingFeedback import and usage |
| `src/pages/Projects.tsx` | **REMOVE** ListingFeedback import and usage |
| `src/pages/PropertyDetail.tsx` | **ADD** ListingFeedback after PropertyNextSteps |
| `src/pages/ProjectDetail.tsx` | **ADD** ListingFeedback after ProjectNextSteps |

## Code Changes

### PropertyDetail.tsx Addition
```tsx
import { ListingFeedback } from '@/components/listings/ListingFeedback';

// After PropertyNextSteps (around line 244):
<PropertyNextSteps 
  cityName={property.city}
  citySlug={citySlug}
  propertyPrice={property.price}
  listingStatus={property.listing_status}
/>

{/* Listing Feedback */}
<ListingFeedback 
  listingType={property.listing_status === 'for_rent' ? 'rentals' : 'buy'} 
/>
```

### ProjectDetail.tsx Addition
```tsx
import { ListingFeedback } from '@/components/listings/ListingFeedback';

// After ProjectNextSteps (around line 136):
<ProjectNextSteps 
  cityName={project.city}
  citySlug={citySlug}
  projectPrice={project.price_from || undefined}
/>

{/* Listing Feedback */}
<ListingFeedback listingType="projects" />

{/* FAQ Section */}
<ProjectFAQ />
```

## Visual Result

On each individual listing page, users will see the feedback prompt (matching the screenshot reference) positioned naturally after the "Next Steps" section — inviting them to share thoughts on that specific type of listing while they're actively engaged with the content.

