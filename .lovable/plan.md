

# Add Mock Recently Sold Comps for All Resale Listings

## Approach

Add a mock data generator to `useNearbySoldComps` that returns realistic sold comps when the database returns no results. The mock data will be derived from each property's actual price, size, rooms, and city — so it looks believable.

## Changes

### File: `src/hooks/useNearbySoldComps.ts`

Add a `generateMockComps` function that:
- Takes the property's price, size_sqm, bedrooms, and city
- Generates 3-5 mock sold transactions with:
  - **Prices** slightly below/around the listing price (±5-15% variation on price/sqm) — most comps should be slightly cheaper (realistic for resale market where listing price is often above recent sales)
  - **Sold dates** spread across the last 6-18 months
  - **Rooms** matching ±1 of the property's bedrooms
  - **Size** varying ±10-20% from the property
  - **Distances** ranging from 50m to 450m (within the 500m radius)
  - **price_per_sqm** calculated from the generated price and size
  - One comp marked as `is_same_building: true` (distance < 20m)

When the real query returns empty results AND the property has lat/lng, return the mock data instead. Use a seeded random based on property coordinates so the same property always gets the same mock comps (consistent across refreshes).

### File: `src/components/property/RecentNearbySales.tsx`

No changes needed — the component already renders whatever the hook returns. The mock data conforms to the existing `NearbySoldComp` interface.

## Mock Data Strategy

For a ₪2,500,000 apartment, 85sqm, 3 rooms:
- Comp 1: ₪2,380,000, 82sqm, 3 rooms, 15m away (same building), Jun 2025
- Comp 2: ₪2,210,000, 78sqm, 3 rooms, 180m away, Mar 2025  
- Comp 3: ₪2,650,000, 90sqm, 4 rooms, 320m away, Nov 2024
- Comp 4: ₪2,150,000, 80sqm, 3 rooms, 410m away, Aug 2024

This makes listings appear slightly above market (realistic) while showing enough variation to be credible.

