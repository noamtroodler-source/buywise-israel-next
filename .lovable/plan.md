
Goal
- Ensure every for-sale (resale) mock property has realistic “Recent Nearby Sales” comps returned by the existing `get_nearby_sold_comps` lookup (within 500m, last 24 months, similar rooms), without breaking anything else on the listing page and without wiping any real/official transaction data.

What’s going on (root cause)
- The UI’s “Recent Nearby Sales” section calls `get_nearby_sold_comps(p_lat, p_lng, p_city, …)` and expects matching rows in `sold_transactions` near the property.
- Your database currently has ~1,854 sold transactions total, but you have ~1,554 for-sale properties. That count is far too low to guarantee 4–8 nearby comps for every for-sale listing, so many listings legitimately get an empty result (as seen in the network log returning `[]`).
- You already have a purpose-built backend function for this: `supabase/functions/seed-sold-transactions/index.ts`, but it either hasn’t been run for all cities/properties, or it was run in a limited scope earlier.

High-level solution
- Use the existing `seed-sold-transactions` backend function to generate mock sold transactions anchored around every for-sale property’s coordinates, with prices calibrated to the listing’s price-per-sqm (±15%) and distances within 0–500m, so the current “Recent Nearby Sales” UI starts working everywhere immediately.
- Make the seeding safe/idempotent so re-running it doesn’t balloon the table and does not delete imported official transactions.

Implementation plan (code + data)
1) Confirm current coverage and define the target
   - Target comps per for-sale property: default 6 (range 4–8 as the function already does).
   - Keep the same constraints the UI uses:
     - Distance: <= 500m
     - Recency: <= 24 months
     - Rooms: within ±1 of the listing’s bedrooms (the UI already filters by rooms; our generator already creates rooms near the listing’s bedrooms)

2) Update `seed-sold-transactions` to be “mock-safe” and repeatable
   File: `supabase/functions/seed-sold-transactions/index.ts`

   Changes:
   - Add a distinct `source` value for seeded mock transactions, e.g. `source: 'mock_seed'`
     - This prevents mixing seeded rows with imported government rows, and allows safe cleanup without touching real data.
   - Add request options:
     - `onlyMock?: boolean` (default true) or `clearMockExisting?: boolean` (default true)
     - `compsPerProperty?: number` (optional override)
     - `limitCities?: string[]` (already supported)
   - Before seeding, delete only the previous mock-seeded rows when requested:
     - `delete from sold_transactions where source = 'mock_seed'`
     - Do NOT delete other sources (so official imports remain intact).
   - Keep the rest of the generation logic:
     - Coords are generated in tiers (same building / very close / nearby) and always within 500m.
     - Sold dates are generated within 0–24 months.
     - Sold prices are generated based on listing price-per-sqm with ±15% variance.

   Result:
   - You can run this repeatedly and always end up with “fresh” mock comps without accumulating duplicates and without harming any existing imported transaction data.

3) Run the seeding once for ALL cities / ALL for-sale properties
   - Invoke the backend function once with:
     - `clearMockExisting: true`
     - no `limitCities` (so it covers all cities)
     - optionally set `compsPerProperty` if you want a fixed number (otherwise keep the realistic 4–8 distribution)

4) Validate coverage (automated checks)
   After seeding, run verification queries to ensure the goal is met:
   - Count how many for-sale properties still return 0 comps within 500m / 24 months in their city.
   - Spot-check a few random property IDs (including the one you’re currently viewing) to confirm the listing page shows the comps and the “Market Verdict” badge behaves normally.

   Note:
   - We do not need Google Maps API for this. This is purely backend mock data generation and the frontend just renders it.
   - This will not interfere with other listing page sections because we are only inserting rows into `sold_transactions`. No changes to properties, UI layout, or pricing logic are required.

5) Optional hardening (to prevent this pain from coming back)
   - Add a small “Coverage” indicator inside the admin sold-transactions page:
     - “# of for-sale listings with >= 3 comps”
     - “# with 0 comps”
   - Keep a single button: “Rebuild Mock Comps (safe)” that runs the function with `clearMockExisting: true`.

Edge cases and how we’ll handle them
- If a property is missing bedrooms/size/price:
  - The seeder already filters out null `price` and null `size_sqm`. We’ll keep that to avoid nonsense price-per-sqm.
  - If bedrooms is null, it falls back to 3 (already implemented).
- If a city name differs between properties and sold_transactions:
  - The seeder uses `property.city` directly, so the city string will match and the `get_nearby_sold_comps` filter `st.city = p_city` will pass.
- Avoid breaking “official data” positioning:
  - We will not modify `get_nearby_sold_comps` or the UI.
  - We will not delete any non-mock sold_transactions rows.

Deliverables
- Updated backend function:
  - `supabase/functions/seed-sold-transactions/index.ts` (idempotent, mock-safe via `source='mock_seed'`)
- One-time execution to populate comps for every for-sale property
- Verification queries + spot checks to confirm “Recent Nearby Sales” appears across resale listings

Acceptance criteria (what you’ll see)
- Every for-sale property detail page shows “Recent Nearby Sales” with 3 visible comps and “Show more” when applicable.
- Comps’ sold prices feel plausible relative to the listing (roughly ±15% per sqm, with realistic spread).
- No regressions in any other section of the listing page.
- Any imported real transaction data remains untouched.