

# Fix Plan: 8 Scraped Listing Issues

## Summary of Findings

| # | Issue | Root Cause |
|---|-------|------------|
| 1 | Street view not set on scraped listings | Import pipeline never generates/stores `street_view_url`. The `StreetViewFallback` component only shows when `!is_claimed && !images.length` — but scraped listings DO have images, so it never triggers. |
| 2 | Rentals not included in scrape | All `agency_sources` URLs end in `/forsale`. No rental URLs exist. The `agency_sources` table has no `import_type` column. The nightly scheduler defaults `import_type` to `"resale"` and the pipeline skips `for_rent` listings in resale mode. |
| 3 | Both street view AND AI pic showing | Currently street view only shows as a fallback when there are NO images. For sourced listings WITH images, it never appears. The issue is that users want ONLY the street view (no scraped photos) — the opposite of current behavior. |
| 4 | Right sidebar too cluttered | Sidebar currently shows: StickyContactCard + SourcedListingEnrichment (price intel, costs, community data) + CoListingAgents. User wants ONLY the agent/agency card. |
| 5 | "Sourced" filter should mean "BuyWise Partners" | Currently `sourced_only` filter shows ALL imported listings. User wants it to show only listings from paying partner agencies. No `is_partner` or `subscription_tier` column exists on `agencies` table. |
| 6 | AI enhancement for street view photos | The `enhance-image` edge function exists but is never called for street view images. Need to run the same touch-up pipeline on Google Street View screenshots. |
| 7 | Cross-source merge logic | Already implemented (Tier 3 dedup in import pipeline). Structured data (Yad2 API) wins on structural fields; non-structured sources gap-fill only. Longer descriptions win. Features are unioned. Price discrepancies >15% are logged. This is working correctly. |
| 8 | Agent card should show agency branding | Currently shows agent name + agency name as plain text. User wants: agency initials bubble with "Sourced" label for scraped listings, and "BuyWise Partner" badge for partner agencies. |

---

## Implementation Plan

### Step 1: Database Changes

**Migration: Add `is_partner` to `agencies` and `import_type` to `agency_sources`**
- Add `is_partner BOOLEAN DEFAULT false` to `agencies` — marks paying BuyWise Partner agencies
- (No `import_type` column needed on `agency_sources` — we'll add rental source URLs directly with `/forrent` in the URL, and the pipeline already detects `for_rent` from the listing content)

### Step 2: Add Rental Sources to `agency_sources`

For each existing Yad2 `/forsale` URL, insert a matching `/forrent` URL. The import pipeline already handles `listing_status: for_rent` detection from Yad2 data and the nightly scheduler will pick them up.

### Step 3: Generate Street View URLs in Import Pipeline

**Edit `import-agency-listings/index.ts`:**
- After inserting a property, generate a Google Street View Static API URL using the property's lat/lng (or address+city fallback)
- Store it in `street_view_url` column on the property
- Apply the same AI enhancement (via `enhance-image` edge function) to the street view image, uploading the result to storage
- Add the enhanced street view as the LAST image in the `images` array (not the cover — the cover remains AI-selected from listing photos)

### Step 4: Fix Property Detail — Show Street View for Sourced Listings

**Edit `PropertyDetail.tsx`:**
- For sourced listings (has `import_source`), show the street view image in the hero gallery alongside other images (it's already in the images array from Step 3)
- Remove the separate `StreetViewFallback` block for sourced listings — street view is now part of the image gallery

**Edit `PropertyHero.tsx`:**
- No major changes needed — street view will be in the images array

### Step 5: Clean Up Right Sidebar for Sourced Listings

**Edit `PropertyDetail.tsx`:**
- Remove `SourcedListingEnrichment` from the sidebar (the price intel, cost breakdown, market intelligence sections are already on the left side — this was redundant)
- Keep only `StickyContactCard` in the sidebar for sourced listings
- Move any unique sourced-listing-only data from `SourcedListingEnrichment` that isn't already on the left side into the left column sections

### Step 6: Rename "Sourced Listings" to "BuyWise Partners"

**Edit `Listings.tsx`:**
- Rename the filter chip from "Sourced listings" to "BuyWise Partners"
- Change filter logic: instead of `import_source IS NOT NULL`, filter by `agent.agency.is_partner = true`

**Edit `usePaginatedProperties.tsx`:**
- Update the `sourced_only` filter to join through agents → agencies and check `is_partner = true`

**Edit `SourcedListingsBanner.tsx`:**
- Rename to "BuyWise Partners" banner explaining these are vetted partner agencies

**Edit `PropertyCard.tsx`:**
- Replace "Sourced" badge with "BuyWise Partner" badge for listings from partner agencies
- Keep a subtle "Sourced" indicator for non-partner scraped listings if needed

### Step 7: AI Enhancement for Street View Images

**Edit `import-agency-listings/index.ts`:**
- After generating the Street View URL, call the `enhance-image` edge function with the street view URL
- Upload enhanced version to storage bucket
- Use the enhanced URL in the property's images array

### Step 8: Agent/Agency Card Branding

**Edit `StickyContactCard.tsx`:**
- For sourced (unclaimed) listings: show the agency name with a circle/bubble containing agency initials + "Sourced" label
- For BuyWise Partner agency listings: show a "BuyWise Partner" badge next to the agent name — styled with a teal/primary color accent consistent with the brand
- Use the agency's logo if available; fall back to initials bubble

**Edit `PropertyCard.tsx`:**
- Update the badge system to show "BuyWise Partner" (teal badge) instead of "Sourced" for partner listings

### Step 9: Trigger Rental Scrape

After deploying the rental source URLs, trigger the nightly scheduler to pick up the new rental sources.

---

## Technical Details

- **Street View API**: Uses `https://maps.googleapis.com/maps/api/streetview?size=800x400&location={lat},{lng}&fov=90&heading=0&pitch=10` — the `heading=0` default faces north. For better results, we can compute heading toward the street (perpendicular to building) but this is a v2 enhancement.
- **Cross-source merge (Issue 7)**: Already working correctly — Tier 3 dedup merges fields from multiple sources, structured data (Yad2 API) is authoritative for structural fields, descriptions take the longer version, features are unioned.
- **Image order for sourced listings**: Street view goes LAST in images array. AI cover selection picks the best interior/exterior photo for index 0. Street view serves as a location reference, not the hero.

