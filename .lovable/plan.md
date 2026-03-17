

## Plan: Three Fixes for City Pages

### Task #4 — Replace "Explore Listings" CTA with Guides/Tools CTAs

**What changes**: The "Explore Listings" banner section (the one that just says "Browse X properties") gets replaced with a "Helpful Resources" section that links to relevant guides and tools. The Featured Properties carousel below it stays exactly as-is.

**Implementation**:
- In `AreaDetail.tsx`: Replace the `<CityExploreListings>` section with a new `<CityResourcesCTA>` component
- New component shows 2-3 `GuideCTACard`s (already exists in codebase) linking to guides like "Buying in Israel", "True Cost of Buying", "Mortgages" plus a link to the calculators page
- Remove the `propertiesCount` dependency from this section entirely (it was only used for the "Browse X properties" text)
- The `CityExploreListings` component file can be kept (in case used elsewhere) or deleted

---

### Task #5 — Fix `(city as any)` type casts

**What changes**: Zero visual change. Just safer code.

**Implementation**:
- Update `CityDetails` interface in `useCityDetails.tsx` to add missing fields: `identity_sentence`, `card_description`, `region`, `tags`, `arnona_discounts`, `commute_time_jerusalem`, `data_sources`, all range fields (`average_price_sqm_min/max`, `arnona_rate_sqm_min/max`, etc.), `rental_5_room_min/max`, `center_lat/lng`, `historical_data_notes`, `featured_neighborhoods`, `train_station_name/lat/lng`
- In `AreaDetail.tsx`: Remove all `(city as any)` casts since `useCity` returns the `City` type from `content.ts` which already has these fields defined — they just weren't being used with proper typing. Replace `(city as any).identity_sentence` with `city.identity_sentence`, etc.

---

### Task #6 — Count-only query for properties

**What changes**: Instead of downloading every property listing for a city just to get the count, we ask the database "how many are there?" Much faster.

**Implementation**:
- Add a new `useCityPropertyCount` hook that uses `.select('id', { count: 'exact', head: true })` — this returns only the count, no actual rows
- In `AreaDetail.tsx`: Replace `useProperties(city ? { city: city.name } : undefined)` with `useCityPropertyCount(city?.name)`
- Pass the count to `generateCityMeta` for SEO (the only remaining use of the count)
- The Featured Properties carousel already fetches its own data via `useCityFeaturedProperties` — unaffected

