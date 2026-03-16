

# Phase 12: Rental Module

## Summary
Add rental-specific fields to the properties table, adjust validation ranges for rental prices in the import pipeline, and update AI extraction prompts to capture lease/rental attributes during automated imports.

## Current State
- The `properties` table already has: `lease_term`, `subletting_allowed`, `furnished_status`, `pets_policy`, `agent_fee_required`, `bank_guarantee_required`, `checks_required`, `furniture_items`
- The Property type interface and wizard already handle these fields for manual agent entry
- The import pipeline (`import-agency-listings`) does NOT extract or store these rental fields — it only extracts sale-oriented data
- Validation has basic rental awareness (skips rentals in resale mode, warns on low prices) but no rental-specific price ranges
- The AI extraction function schema lacks rental fields entirely

## Changes

### 1. Database Migration — No schema changes needed
All rental fields already exist on `properties`. No new columns required.

### 2. Update `import-agency-listings/index.ts` — AI Extraction

**a) Add rental fields to the `extract_listing` tool schema** (line ~1643):
- `lease_term`: enum `["6_months", "12_months", "24_months", "flexible", "other"]`
- `furnished_status`: enum `["fully", "semi", "unfurnished"]`
- `pets_policy`: enum `["allowed", "case_by_case", "not_allowed"]`
- `subletting_allowed`: enum `["allowed", "case_by_case", "not_allowed"]`
- `agent_fee_required`: boolean
- `bank_guarantee_required`: boolean
- `checks_required`: boolean

**b) Add rental terms to the Hebrew dictionary** in `buildExtractionPrompt`:
```
RENTAL TERMS (Hebrew → BuyWise field):
שכירות / להשכרה = listing_status: for_rent
תקופת שכירות = lease_term | חוזה ל-12 חודשים = 12_months
מרוהט לגמרי = fully | מרוהט חלקית = semi | לא מרוהט = unfurnished
חיות מחמד = pets_policy | מותר חיות = allowed | אין חיות = not_allowed
סאבלט / השכרת משנה = subletting_allowed
דמי תיווך = agent_fee_required | ערבות בנקאית = bank_guarantee_required
צ'קים = checks_required
```

**c) Add `CITY_RENTAL_RANGES`** — monthly rental price ranges per city (NIS) for validation when `importType !== "resale"`:
```
Tel Aviv: 4,000–25,000/mo
Jerusalem: 3,000–18,000/mo
Herzliya: 4,500–20,000/mo
... (all supported cities)
```

**d) Update `validatePropertyData`** — add rental-specific validation:
- When `importType === "rental"`: validate price against `CITY_RENTAL_RANGES`
- Warn if rental price > 30,000 NIS/mo (likely sale price mistaken for rent)
- Validate rental-specific fields are present (warn if missing `furnished_status` for rental)

**e) Update property insertion paths** — ensure extracted rental fields (`lease_term`, `furnished_status`, `pets_policy`, `subletting_allowed`, `agent_fee_required`, `bank_guarantee_required`, `checks_required`) are passed through to the `properties` upsert/insert calls.

### 3. Update `isNonResalePage` function
- Currently skips rental pages when `importType === "resale"`. Ensure that when `importType === "rental"`, it skips sale-only pages instead (reverse logic).

### 4. Update confidence scoring
- Add rental field presence as a scoring factor when `listing_status === "for_rent"` — boost score when `furnished_status` and `pets_policy` are present.

## Files to Edit
- `supabase/functions/import-agency-listings/index.ts` — all changes (extraction schema, prompt, validation, insertion)

## Technical Notes
- No database migration needed — all columns exist
- No UI changes needed — wizard and display already handle rental fields
- The `importType` parameter already supports non-resale modes; this extends it with proper rental validation and extraction

