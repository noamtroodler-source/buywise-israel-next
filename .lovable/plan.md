

# Phase 1: Harden the Agency Import Pipeline

Based on the Perplexity blueprint and the current 1675-line edge function, here's what to implement now — focusing on the highest-impact, lowest-effort improvements that don't require external service accounts (deferring Apify/Yad2 adapter to Phase 2).

---

## 1. Expand the Hebrew Dictionary in AI Extraction Prompt (~lines 1166-1200)

**What**: Embed the comprehensive Hebrew dictionary from Section 3 of the blueprint directly into the Gemini extraction prompt.

**Changes in `import-agency-listings/index.ts`**:
- Add full property type dictionary: דירת סטודיו→apartment, לופט→apartment, דירת גג→penthouse, דירת מרתף→apartment, בית דו-משפחתי→house, טריפלקס→duplex, יחידת דיור→apartment
- Add amenities mapping: ממ"ד→mamad/safe_room, מחסן→storage, מרפסת→balcony, סוכה→sukkah_balcony, דוד שמש→solar_heater, סורגים→bars, תריסים→shutters, בלעדי→exclusive
- Add condition terms: משופץ→renovated, במצב טוב→good, דורש שיפוץ→needs_renovation, חדש מקבלן→new, שמור→good
- Add floor ordinals: קרקע→0, ראשונה→1, שנייה→2 ... עשירית→10, מרתף→-1
- Include all of this as structured reference text within the prompt so Gemini has explicit Hebrew→English mappings

---

## 2. Add Resale-Only Filtering + Rental/New Construction Skip (~lines 1156-1161, 1322-1326)

**What**: Before and after AI extraction, apply the blueprint's resale-only filters.

**Changes**:
- **Pre-LLM filter** (extend `isSoldOrRentedPage`): Add patterns for rental indicators (להשכרה, שכירות, monthly rent patterns), new development indicators (מקבלן, על הנייר, חדש מקבלן, פרויקט חדש)
- **Post-extraction filter**: Skip if `listing_status === "for_rent"` (currently only skips sold/rented). Add: skip if price > 0 and price < 20,000 (almost certainly rent, not sale)
- **Property type filter**: Skip land, commercial for resale import (they're not typical agency onboarding targets)
- **Price=1 detection**: Skip listings where price === 1 (placeholder for sold items on many Israeli sites)

---

## 3. City-Specific Price & Size Validation (~lines 396-437)

**What**: Add the blueprint's outlier detection tables to `validatePropertyData`.

**Changes**:
- Add a `CITY_PRICE_RANGES` lookup with per-city min/max price ranges from Section 4.1
- Add `ROOM_SIZE_RANGES` with the room-to-size ratio table from Section 4.2
- In `validatePropertyData`: 
  - If price is outside city range for the room count, add a warning (not hard-fail — downgrade confidence)
  - If size_sqm is outside expected range for room count, add a warning
  - Price-per-sqm outlier check using city-specific ranges
- These produce warnings stored in `extracted_data.validation_warnings` rather than hard failures, so listings still import but get flagged

---

## 4. Confidence Scoring (~new function, stored on import_job_items)

**What**: Implement the weighted confidence scoring system from Section 8.

**Changes**:
- Add a `computeConfidenceScore(listing, city)` function that scores 0-100 based on:
  - Price (20%): in city range = 3, out of range = 2, missing/0 = 1
  - Rooms (15%): 1-10 = 3, unusual = 2, missing = 1
  - Size (15%): matches room ratio = 3, outside ratio = 2, missing = 1
  - City (15%): exact match = 3, fuzzy = 2, domain-inferred = 1
  - Address (10%): street+number = 3, street only = 2, missing = 1
  - Property type (10%): dictionary match = 3, AI = 2, missing = 1
  - Photos (10%): 3+ = 3, 1-2 = 2, 0 = 1
  - Description (5%): 50+ chars = 3, 10-50 = 2, missing = 1
- Store `confidence_score` in `import_job_items.extracted_data`
- **Below 40**: Skip with "low confidence" error
- **40-79**: Import as draft, flagged
- **80+<lov-plan>

# Phase 1: Harden the Agency Import Pipeline

Based on the Perplexity blueprint and the current 1675-line edge function, here's what to implement now — focusing on highest-impact, lowest-effort improvements that don't require external service accounts (deferring Apify/Yad2 adapter to Phase 2).

---

## 1. Expand Hebrew Dictionary in AI Extraction Prompt (~lines 1166-1200)

Embed the comprehensive Hebrew dictionary from Section 3 directly into the Gemini extraction prompt.

- Property types: דירת סטודיו→apartment, לופט→apartment, דירת גג→penthouse, דירת מרתף→apartment, בית דו-משפחתי→house, טריפלקס→duplex, יחידת דיור→apartment
- Amenities: ממ"ד→mamad, מחסן→storage, מרפסת→balcony, סוכה→sukkah_balcony, דוד שמש→solar_heater, בלעדי→exclusive
- Condition: משופץ→renovated, במצב טוב→good, דורש שיפוץ→needs_renovation, חדש→new, שמור→good
- Floor ordinals: קרקע→0, ראשונה→1, שנייה→2 ... עשירית→10, מרתף→-1

All embedded as structured reference in the prompt so Gemini has explicit Hebrew→English mappings instead of guessing.

---

## 2. Resale-Only Filtering + Rental/New Construction Skip

Extend pre-LLM and post-extraction filters:

- **Pre-LLM** (extend `isSoldOrRentedPage`): Add rental indicators (להשכרה, שכירות), new dev indicators (מקבלן, על הנייר, פרויקט חדש)
- **Post-extraction**: Skip if `listing_status === "for_rent"`. Skip if price > 0 and price < 20,000 NIS (almost certainly rent). Skip if price === 1 (sold placeholder on many Israeli sites)
- **Property type filter**: Skip `land`, `commercial` for resale import

---

## 3. City-Specific Price & Size Validation

Add outlier detection tables from blueprint Section 4 to `validatePropertyData`:

- `CITY_PRICE_RANGES` lookup with per-city min/max from the blueprint's research
- `ROOM_SIZE_RANGES` with room-to-size ratio table (e.g., 3 rooms: flag if <45 or >110 sqm)
- Price-per-sqm outlier check using city-specific ranges
- These produce **warnings** stored in `extracted_data.validation_warnings` — not hard failures — so listings still import but get flagged

---

## 4. Confidence Scoring

New `computeConfidenceScore(listing, city)` function scoring 0-100:

| Field | Weight | High (3) | Medium (2) | Low (1) |
|-------|--------|----------|------------|---------|
| Price | 20% | In city range | Out of range | Missing/0 |
| Rooms | 15% | 1-10 | Unusual | Missing |
| Size | 15% | Matches room ratio | Outside ratio | Missing |
| City | 15% | Exact match | Fuzzy match | Domain-inferred |
| Address | 10% | Street+number | Street only | Missing |
| Property type | 10% | Dictionary match | AI-inferred | Missing |
| Photos | 10% | 3+ photos | 1-2 photos | None |
| Description | 5% | 50+ chars | 10-50 chars | Missing |

**Thresholds**: Below 40 → skip. 40-79 → import as draft, flagged. 80+ → import as draft, auto-ready.

Score stored in `extracted_data.confidence_score` on the import_job_item.

---

## 5. Enhanced Address Normalization in Dedup

Improve Tier 1 dedup (exact address match):

- Strip "רחוב"/"Rechov" prefix before comparison
- Normalize Hebrew final-form characters (כ↔ך, פ↔ף, etc.)
- Remove extra spaces/hyphens in house numbers

Improve Tier 2 dedup (fuzzy match):

- Size tolerance: ±5 sqm instead of exact match
- Price tolerance: already ±5% — keep as-is

---

## 6. Placeholder Image Detection

Before downloading images, skip obvious placeholders:

- Skip images < 5KB (tiny placeholders)
- Skip images where the same URL appears across multiple listings (agency default photo)
- Already capped at 15 images — keep that

---

## DB Migration Needed

Add `confidence_score` column to `import_job_items`:

```sql
ALTER TABLE import_job_items ADD COLUMN IF NOT EXISTS confidence_score integer;
```

---

## Files Changed

1. **`supabase/functions/import-agency-listings/index.ts`** — All logic changes (dictionary, validation, confidence scoring, filtering, dedup improvements)
2. **DB migration** — Add `confidence_score` column

## What's Deferred to Phase 2

- Apify Yad2 adapter (needs account + API key setup)
- WordPress/CMS structured data detection (Tier 2 adapter)
- Image pHash deduplication
- Cross-source dedup (Tier 3)
- Review UI with side-by-side comparison
- Incremental sync
- Rental module

