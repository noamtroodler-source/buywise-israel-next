I found why it still is not behaving like “resale + rentals everywhere.” The previous change passed `import_type: both`, but several backend branches still treat `both` too much like sale/resale, or do not split sale and rental discovery cleanly.

Plan to make it actually work:

1. Fix `both` validation logic
   - Update importer validation so `both` allows:
     - normal sale prices for `for_sale`
     - normal monthly rent prices for `for_rent`
   - Right now some checks only distinguish `resale` vs `rental`; `both` falls into the wrong branch in places and can let bad classification through or warn incorrectly.

2. Make website discovery reliably include both sale and rental sections
   - When importing an agency website with `both`, explicitly seed discovery with common sale/rent category URLs found on the site, including Hebrew category paths like:
     - `property_action_category/מכירה`
     - `property_action_category/השכרה`
     - short-term rent variants
   - Keep excluding projects/new developments, sold, rented, archived, and unavailable pages.
   - Add better logging/counts so the job can show how many candidate URLs were sale vs rental-looking before AI classification.

3. Fix the agency-property dedupe query bug
   - The importer is querying `properties.agency_id`, but the real property table uses `primary_agency_id`, `claimed_by_agency_id`, and/or agent agency relationship.
   - This can break “known URL” checks and makes rediscovery/import behavior inconsistent.
   - Replace these checks with the correct agency ownership fields so previous imports do not incorrectly suppress or fail new sale/rental imports.

4. Make Yad2 `both` process sale and rental URLs as separate modes
   - Keep generating both `/forsale` and `/rent` agency URLs.
   - Ensure job items carry/retain the mode or route through a job that can correctly set `listing_status`.
   - Improve fallback behavior when Yad2 blocks page scraping so the Apify fallback also runs both sale and rent, not just the original `/forsale` URL.

5. Make Madlan `both` import buy and rent cleanly
   - Madlan already loops `buy` and `rent`, but it inserts directly instead of creating normal job items.
   - Adjust it so rentals are clearly marked `listing_status: for_rent`, sale listings `for_sale`, and the job/source counts report discovered/imported per mode.
   - Keep third-party media guarded: no raw Madlan/Yad2 images stored.

6. Improve UI/status clarity in agency provisioning
   - Show source-specific jobs separately instead of making the user think the current Website job count is the total across Website + Yad2 + Madlan.
   - Label jobs like “Website: 26”, “Yad2: 50”, “Madlan: 378” and show sale/rental coverage when available.
   - Make it clear that “Import All Remaining” applies to the selected job, not all sources combined.

7. Verify with the Erez agency case
   - Re-run discovery for the current agency sources using `both`.
   - Confirm expected outcomes in the database:
     - Website job includes active sale and rental candidate URLs.
     - Yad2 job includes `/forsale` and `/rent` discovery.
     - Madlan imports include both `for_sale` and `for_rent` where returned.
     - Actual properties include `listing_status = for_sale` and `listing_status = for_rent`.

Technical files to update:
- `supabase/functions/import-agency-listings/index.ts`
- `supabase/functions/sync-agency-listings/index.ts` if source health/count handling needs adjustment
- `src/components/admin/agency-provisioning/ImportListingsSection.tsx` for clearer counts/status
- Possibly `src/hooks/useImportListings.tsx` / `src/hooks/useAgencySources.ts` only if the frontend needs better mode/count handling

No schema change is expected. This should be a backend logic + UI clarity fix.