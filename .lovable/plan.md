

# Address Normalization Enhancement for Dedup

## Current State
`normalizeAddressForDedup()` at line 656 already does basic normalization:
- Strips "רחוב" prefix
- Strips "rechov" prefix  
- Normalizes final-form Hebrew chars (ך→כ, ם→מ, etc.)
- Collapses spaces and strips hyphens

**Problem**: The function is decent but has gaps, and more critically, it only normalizes the **incoming** address. The DB query uses `ilike` against raw `properties.address` — so if the stored address has "רחוב" or apartment info, it won't match the normalized incoming one.

## Changes

### 1. Expand `normalizeAddressForDedup()` in `import-agency-listings/index.ts`

Add these normalizations:
- Strip apartment/floor suffixes: `דירה 5`, `קומה 3`, `apt 4`, `floor 2`, `apartment`, `unit`, `#12`
- Strip additional Hebrew street prefixes: `רח'`, `רח׳`, `שד'` (boulevard), `שדרות`, `סמ'`/`סמטת` (alley)
- Strip English equivalents: `street`, `st.`, `ave`, `avenue`, `blvd`, `boulevard`
- Normalize common transliteration variants: double letters, `ch`→`kh`, `tz`→`ts`
- Strip leading "the" / "ה" (definite article when standalone prefix)
- Normalize punctuation: quotes, periods, commas

### 2. Add `normalizeAddressForQuery()` wrapper

Since `ilike` compares against raw DB values, create a helper that builds a looser query pattern — strip only the most impactful noise (apartment/floor) and use `%` wildcards around the core street+number. This improves match rates without requiring a DB migration to store normalized addresses.

### 3. Normalize address before storing

In both `processItem()` and `processYad2Item()`, normalize the address (strip apartment/floor, Hebrew prefixes) **before** inserting into `properties`. This ensures future dedup comparisons against stored data are consistent.

## File to Edit
- `supabase/functions/import-agency-listings/index.ts` — enhance `normalizeAddressForDedup()`, add store-time normalization in both processing paths

