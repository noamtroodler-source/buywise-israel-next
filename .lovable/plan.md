

# Phase 2: Dynamic Concurrency + AI Retry

Two changes to `supabase/functions/import-agency-listings/index.ts`:

## 1. Dynamic Concurrency in `handleProcessBatch`

Replace the fixed `CONCURRENCY = 3` with adaptive concurrency:
- Start at `CONCURRENCY = 5`
- Track consecutive failures per batch. On 429/timeout errors, drop to `CONCURRENCY = 2` and add a 3-second delay
- After 3 consecutive successful chunks, recover back to 5
- Track this via `let currentConcurrency = 5` and `let consecutiveSuccesses = 0` variables within the batch loop

Changes in `handleProcessBatch` (lines ~1597-1641):
- Replace `const CONCURRENCY = 3` with `let currentConcurrency = 5`
- Update `MAX_ITEMS` from 9 to 15 (to take advantage of higher concurrency)
- After each chunk's `Promise.allSettled`, check results for 429/timeout patterns
- If any result failed with a transient error, reduce concurrency and reset success counter
- If all succeeded, increment success counter; at 3, restore concurrency to 5

## 2. Simplified Prompt Retry in `processOneItem`

When AI extraction fails (no tool call returned, or returns `not_listing` with very short content), retry once with a minimal prompt:

Add a new function `buildSimplifiedExtractionPrompt(url, markdown)` that asks for only 6 core fields: price, rooms (bedrooms), size_sqm, city, address, property_type. No features, condition, amenities, floor, etc.

Changes in `processOneItem` (lines ~1277-1293):
- After the initial AI call fails (status error or no extraction data), instead of immediately marking as failed, check if this is a first attempt
- If first attempt and error is not 429, call `buildSimplifiedExtractionPrompt` and retry
- On retry success, add a `-10` confidence penalty and a validation warning "extracted_with_simplified_prompt"
- On retry failure, mark as failed as before

### New function: `buildSimplifiedExtractionPrompt`
```
Extract ONLY these fields from this Israeli real estate listing:
- price (number, NIS)
- bedrooms (rooms minus 1)  
- size_sqm
- city (one of: [SUPPORTED_CITIES])
- address
- property_type (apartment/house/penthouse/duplex/garden_apartment/cottage/land/commercial)
- listing_status (for_sale/for_rent)
- image_urls (array)
- listing_category (property/project/not_listing)

URL: {url}
Content: {first 4000 chars of markdown}
```

Smaller prompt = fewer tokens = less likely to fail on edge cases.

## Files Modified
- `supabase/functions/import-agency-listings/index.ts` only

## No DB changes needed

