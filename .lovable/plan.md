

# Listing Decoder — URL-Only with Missing Data Detection

## Key Design Decisions

**URL-only input** — Users are browsing Yad2/Madlan/agency sites. They copy the URL. No reason to ask them to paste Hebrew text manually. Simpler UX, one input field.

**Missing data as a first-class output section** — The AI doesn't just translate what's there; it explicitly calls out what's NOT there and why it matters. E.g., "No sqm listed — this often means the property is smaller than you'd expect for the price. Always ask for the exact registered size from the Tabu."

## Architecture

```text
User pastes URL → [Decode This Listing] button
       ↓
Edge function: decode-listing
  1. Firecrawl scrape URL → markdown
  2. Rate limit check (3/day guest, 10/day logged-in)
  3. Gemini Flash with tool calling → structured output
  4. Match detected city → cities table for market context
       ↓
Results displayed in sections:
  🏠 Property Summary (extracted table)
  🚩 What's Missing (critical missing fields + why each matters)
  📝 Full Translation (natural English)
  🔑 Israeli Terms Explained (glossary cards)
  ⚠️ Red Flags
  ❓ Questions to Ask the Agent
  📊 Market Context (if city matched)
  [Save] [Copy] [Share]
```

## What to Build

### 1. Database Migration
- **`saved_listing_analyses`** — `id`, `user_id` (ref profiles), `source_url`, `decoded_result` (jsonb), `detected_city`, `created_at`. RLS: users CRUD own rows only.
- **`listing_decoder_usage`** — `id`, `session_id` (text), `user_id` (nullable uuid), `used_at` (timestamptz default now()). No RLS — accessed via edge function service role.

### 2. Edge Function: `decode-listing`
- Input: `{ url, session_id, user_id? }`
- Firecrawl scrape the URL for markdown content
- Rate limit: count today's usage from `listing_decoder_usage`
- Call Gemini Flash via Lovable AI Gateway with tool calling to extract structured output:
  - `property_summary` (price, rooms, sqm, floor, type, city, neighborhood, year_built)
  - `missing_fields[]` — each with `field_name`, `why_it_matters`, `risk_level` (high/medium/low)
  - `translation` — full English translation
  - `hebrew_terms[]` — each with `term`, `transliteration`, `meaning`, `buyer_context`
  - `red_flags[]` — warnings based on what's present AND absent
  - `questions_to_ask[]` — contextual questions for the agent
  - `detected_city` — for market context lookup
- If city matched, query `cities` table for price averages
- Handle 429/402 errors from AI gateway

### 3. Frontend: `ListingDecoderTool.tsx`
- Single URL input field with paste-friendly UX
- Usage counter badge ("2 of 3 free analyses today")
- Loading state: skeleton cards (~5-8 seconds)
- Results in collapsible accordion sections, with "What's Missing" prominently placed near the top
- Save/Copy/Share actions (save requires auth)
- Follows existing ToolLayout pattern

### 4. Hook: `useListingDecoder.ts`
- Manages URL input, loading, results, error states
- Tracks usage count from response
- Save mutation for logged-in users

### 5. Registration
- Add `listing-decoder` to `allTools` in `Tools.tsx` with `Languages` icon
- Add to `TOOLS_BY_PHASE.check.tools`
- Add to nav config under Buy > Calculators

### 6. "What's Missing" — The Differentiator
The AI prompt will include an explicit checklist of fields a complete Israeli listing should have:
- Size (sqm) / Rooms / Floor / Total floors
- Year built / Tofes 4 / Tabu status
- Parking / Elevator / Storage / Balcony
- Arnona / Vaad Bayit costs
- Property type clarity
- Photos (count)

For each missing item, the AI explains WHY it matters for a buyer and what risk it carries. This section appears before the translation — because what's missing is often more important than what's said.

