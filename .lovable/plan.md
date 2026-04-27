Plan: make imported listings much more complete

Goal
Build the importer so agency websites are treated as the primary source of truth, especially English agency listings, and the system extracts every visible useful fact before relying on Madlan/Yad2 enrichment.

What will change

1. English-first agency extraction
- Update the listing extraction prompt and schema so it can return all fields the site supports, not just the current limited set.
- Prioritize English listing text and English labels, while still keeping Hebrew parsing as fallback.
- Extract facts from both structured sections and prose descriptions.

Fields to improve:
- address
- neighborhood
- bedrooms / original room count
- bathrooms
- parking count
- storage count
- floor / total floors
- year built / construction year
- property type
- size
- condition
- balconies / pool / private pool / view / elevator / mamad / doorman / gym / storage / parking
- furnished / accessibility / AC
- vaad bayit / entry date when visible
- strongest highlighted feature

2. Add a stronger agency-page parser
- Expand the current fallback parser so it recognizes common English agency labels like:
  - Address
  - Neighborhood
  - Rooms
  - Bedrooms
  - Bathrooms
  - Floor
  - Floors in building
  - Year built / Year of construction
  - Parking spaces
  - Storage rooms
  - Property size
  - Balcony / Pool / Private pool / Sea view / Elevator
- This avoids relying only on AI when the page has clear key/value details.

3. Add a prose fact extractor
- Parse descriptions like “single apartment on the floor”, “3 parking spaces”, “2 storage rooms”, “private pool”, “near the beach”, etc.
- Convert those into BuyWise fields/features instead of leaving them buried in the text.
- Store standardized feature keys while keeping a clean buyer-friendly description.

4. Improve geocoding flow
- If address + city are extracted, automatically geocode the listing.
- If neighborhood is missing, infer it from address/geocode/city/neighborhood matching where possible.
- This should fix cases where listings are technically in Tel Aviv but have no usable location on the site/map.

5. Make Madlan/Yad2 enrichment more effective
- Keep agency website data/photos as preferred.
- Use Madlan and Yad2 to fill missing fields only.
- Improve matching so it does not rely only on exact address. Use a weighted match from city, neighborhood, price, size, rooms, floor, title, description, and source signals.
- This helps when agency website extraction is missing address but the listing is clearly the same one on Madlan.

6. Add field-level source tracking for review
- In the import item/extracted data, include which source filled important fields where practical:
  - agency website
  - parser
  - AI extraction
  - Madlan
  - Yad2
  - geocoding
- This will make the wizard-style review more useful because you can see not just what is missing, but where each value came from.

7. Add safety guards
- Do not store Yad2 photos.
- Keep agency-owned photos preferred.
- Do not overwrite good agency data with weaker portal data.
- If a field conflicts materially, flag it for review instead of silently replacing it.
- Keep unsupported or uncertain fields out rather than fabricating.

Technical implementation

Primary file:
- `supabase/functions/import-agency-listings/index.ts`

Expected implementation details:
- Expand the AI tool schema to include the missing property fields currently blocked by `additionalProperties: false`.
- Add/extend helpers for:
  - English key/value extraction from HTML/markdown
  - prose-derived feature extraction
  - feature normalization
  - storage/parking/pool/private-pool/single-floor-unit mapping
  - missing-field enrichment logic
- Improve the merge patch so additional fields are gap-filled from Madlan/Yad2 when the existing listing is empty.
- Ensure geocoding runs after address extraction and before final insert/update.

Validation
- Re-run the Erez import after implementation.
- Specifically inspect the ₪19M listing and verify it captures more of:
  - address/neighborhood
  - bathrooms
  - parking
  - floor/total floors/year built if visible
  - storage/private pool/single apartment per floor as features
  - lat/lng when address exists
- Check importer logs for AI/Firecrawl/rate-limit failures.

Expected result
The import pipeline should move from “basic listing + photos” to a much richer listing profile where agency website details are harvested first, then Madlan/Yad2 fill the remaining gaps. This should make the review drawer meaningfully show complete listings rather than lots of missing fields.