

## Plan: Auto-Map Neighborhoods via Lovable AI Edge Function

### What this does
Creates an edge function `map-neighborhoods` that pulls both datasets from the database (CBS Hebrew names + your Anglo roster), sends them to Gemini for matching, and returns a structured JSON mapping you can review.

### Data overview
- **22 cities** have CBS neighborhood data (679 distinct neighborhoods, 52K price rows)
- **25 cities** on your platform (3 missing from CBS: Efrat, Gush Etzion, Mevaseret Zion)
- Your roster has Anglo names + Hebrew names (e.g., `{"name": "Abu Tor", "name_he": "אבו טור"}`)
- CBS has Hebrew names + numeric IDs (e.g., `"א טור"` / `65209922`)

### Implementation steps

**Step 1: Create edge function `map-neighborhoods`**

The function will:
1. Query all distinct `(city_en, neighborhood_he, neighborhood_id)` from `neighborhood_price_history`
2. Query all cities' `neighborhoods` JSON field for the Anglo names + Hebrew names
3. Build a structured prompt with both lists, grouped by city
4. Call Gemini via Lovable AI with tool calling to get structured output:
   - `mappings[]`: `{ city, anglo_name, our_hebrew, cbs_hebrew, cbs_id, confidence, notes }`
   - `unmapped_cbs[]`: CBS neighborhoods with no platform match
   - `unmapped_anglo[]`: Platform neighborhoods with no CBS match
5. Return the full mapping as JSON

**Step 2: Call the function and review output**

You review the mapping. I'll present a summary of matches, confidence levels, and gaps.

**Step 3 (future, not this task): Create `neighborhood_aliases` table**

Once mapping is approved, we create the table and import. That's a separate step.

### Technical details

- Uses `google/gemini-2.5-pro` (best for Hebrew transliteration matching and large context)
- Tool calling for structured output (no JSON parsing issues)
- All 22 cities in one call (~700 CBS entries + ~300 Anglo entries fits easily in context)
- No database changes in this step — read-only queries, AI matching, JSON output

