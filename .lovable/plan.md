## Goal
Get the remaining **29 CityZen listings** live (currently unpublished because they each have <4 photos), without violating the zero-storage policy on third-party media.

## The blocker
- We can't fabricate or re-host real photos.
- We can't drop the 4-photo minimum (you set that as the publish gate).
- So the only clean path is **re-scrape CityZen** to pick up more photos per listing, then re-run demo-fill.

## Steps

### 1. Re-scrape CityZen source
- Trigger the existing CityZen scraper/import edge function against the live CityZen site.
- For each listing: capture **all** photo URLs available on the source page (not just the first 1–3).
- Store photo URLs as references only (no download), matching the zero-storage policy.

### 2. Merge into existing rows (don't duplicate)
- Match by source URL or address+price.
- For each existing CityZen row, **union** the new photo URL list into `images[]`.
- Update any other fields that came back richer from source (real bedrooms, real size, real description) — these overwrite demo-filled values and clear the per-field demo flag.

### 3. Re-run demo-fill on the merged set
- Same `demo-fill-cityzen` function, unchanged behavior:
  - Mock street numbers where missing
  - Inferred bedrooms / size where missing
  - 4–7 realistic features
  - "Trusted Friend" English description
  - Tag `is_demo_fabricated=true`, `data_quality_score=0`
- Publish gate stays at **≥4 photos + city + price**.

### 4. Handle leftovers honestly
- Any listing that still has <4 photos after re-scrape stays unpublished. We do not invent photos.
- Report the final count: how many published, how many still stuck, and why.

### 5. Verify
- 0 listings outside Israel
- 100% of published listings have ≥4 real photos
- 100% of published listings have street number, bedrooms, size, features, description
- Admin sees `is_demo_fabricated` flags; agencies/visitors see nothing demo-related
- Analytics dashboards still exclude `is_demo_fabricated=true` rows

## Technical notes
- Reuse existing scraper edge function for CityZen (no new function).
- Merge logic: `images = array(distinct old || new)` keyed on URL.
- demo-fill function already exists and works — just re-invoke after merge.
- No schema changes.

## Out of scope
- Restoring the original 157 deleted listings (not recoverable).
- Sourcing photos from anywhere other than CityZen's own site.
- Removing the 4-photo publish gate.

## One thing to confirm before I build
Do you want me to:
- **(A)** Re-scrape only — accept that some listings may still end up <4 photos and stay unpublished, OR
- **(B)** Re-scrape + lower the publish gate to **≥1 photo** for CityZen demo rows specifically (gets all 36 live, but some will look thin)?
