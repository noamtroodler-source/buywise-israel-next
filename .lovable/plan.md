

## Make "Updated" Label Dynamic in CityHeroGuide

### Change
Pass `lastUpdated` (from `city.updated_at`) into `CityHeroGuide` and format it dynamically.

**`CityHeroGuide.tsx`**: Add `lastUpdated?: string` prop. Replace hardcoded `Updated 2025` with formatted date like `Updated Mar 2026`. Fall back to current year if no date provided.

**`AreaDetail.tsx`**: Pass `lastUpdated={city.updated_at}` to `<CityHeroGuide>`.

