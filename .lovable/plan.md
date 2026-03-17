

# Fix Yad2 Import: Schema Too Much Branching + Missing City

## Problem Summary

The edge function logs confirm the exact error chain:

1. **Primary AI extraction** (lines 1862-1899) sends a schema with 26 optional properties and 5+ enums → Gemini rejects with `"The specified schema produces a constraint that has too much branching"`
2. **Simplified retry** fires and succeeds, but extracts minimal data (no city from Hebrew Yad2 pages)
3. Items get a confidence score of 25-30 → **skipped** at the `< 40` threshold (line 2057)

The `processYad2Item` function (lines 3013-3303) is dead code — `handleProcessBatch` already routes everything through `processOneItem`. But `processOneItem`'s primary schema is what triggers the 400.

## Implementation Plan

### 1. Slim down the primary extraction schema

**File:** `supabase/functions/import-agency-listings/index.ts` (lines 1862-1899)

Remove 7 rental-specific optional properties that cause branching overload:
- `lease_term` (5-value enum)
- `furnished_status` (3-value enum)  
- `pets_policy` (3-value enum)
- `subletting_allowed` (3-value enum)
- `agent_fee_required` (boolean)
- `bank_guarantee_required` (boolean)
- `checks_required` (boolean)

Also reduce the `property_type` enum from 14 values to 8 residential types only (non-residential types are rejected anyway by `SKIP_PROPERTY_TYPES`).

This brings the schema from 26 → 19 properties and cuts enum branching significantly. The primary extraction should now succeed on the first try without falling back to the simplified prompt.

Keep rental fields in `buildExtractionPrompt` text instructions so the AI can still mention them in the description, but don't force them into the structured schema.

### 2. Add Yad2 URL region → city inference

**File:** `supabase/functions/import-agency-listings/index.ts`

Yad2 URLs contain region slugs like `center-and-sharon`, `jerusalem-and-periphery`, `north`, `south`, `haifa-and-krayot`. These are too broad for a single city, but the page content usually has the city in Hebrew.

Add a `inferCityFromYad2Url` function that maps Yad2 URL path segments to likely cities as hints passed to the AI prompt. For example, add to `buildExtractionPrompt` when the URL is yad2.co.il: inject a line like `"This is a Yad2 listing from the center-and-sharon region. Likely cities: Petah Tikva, Ra'anana, Hod HaSharon, Herzliya, Netanya, Kfar Saba, Givat Shmuel, Ramat Gan."` This helps the AI find the city from Hebrew content.

Also, in `processOneItem` post-extraction (around line 1994), if city is still missing and the URL is yad2.co.il, attempt to extract city from the scraped Hebrew content using regex patterns for Hebrew city names from `CITY_ALIASES`.

### 3. Boost simplified-prompt city extraction

**File:** `supabase/functions/import-agency-listings/index.ts` (lines 1672-1743)

In `retryWithSimplifiedPrompt`, add the supported cities list to the prompt (currently missing — the simplified prompt at line 1677 doesn't mention which cities are valid). Also add any Yad2 region hints if available.

### 4. Delete dead `processYad2Item` function

**File:** `supabase/functions/import-agency-listings/index.ts` (lines 3011-3303)

Remove the entire ~290-line `processYad2Item` function. It's never called and contains the same broken full schema that causes 400 errors.

### 5. Reset failed/skipped items and redeploy

- SQL: Reset items for job `44ae3deb-0f25-4cc7-a25e-60d91ba0217f` that are `failed` or `skipped` back to `pending`
- Deploy the updated edge function

## Expected Result

- Primary schema succeeds on first AI call (no more 400 errors)
- No simplified-prompt penalty → confidence jumps from 25-30 to 60-80+
- City extraction works via prompt hints + Hebrew regex fallback
- Most of the 128 Yad2 listings should import successfully

