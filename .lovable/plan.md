
# AI Market Insight for Market Intelligence Section

## What We're Building

A short, AI-generated "What This Means" paragraph inside the Market Intelligence section that synthesizes all the numbers into a plain-English explanation. It tells buyers **why** a property may be priced above or below market -- considering listing features, property condition, city trends, nearby comps, and listing-specific details an Israeli real estate agent would notice.

## Where It Appears

Between the verdict badge and the value snapshot cards in the Market Intelligence section. Uses the existing `InsightCard` design pattern already used across the platform's calculators (gradient border, icon, "What This Means For You" heading).

## What the AI Considers

The prompt will think like an experienced Israeli real estate agent and factor in:

**Market data:**
- Listing price/sqm vs nearby comp average price/sqm (the % deviation)
- Number and recency of comps (data confidence)
- City-wide average price/sqm and 12-month YoY trend
- Whether comps are same-building or further away

**Property-specific signals (from the listing):**
- Property type (apartment, penthouse, garden apt, cottage, etc.)
- Size and room count vs comp sizes
- Floor and total floors (ground floor, top floor, high floor premium)
- Year built (new construction premium vs older buildings)
- Condition (new, renovated, needs renovation -- huge price factor)
- Elevator, parking, balcony, storage, accessible
- Entry date (immediate vs distant -- urgency signal)
- Original price vs current price (price reduction = motivated seller)
- Days on market (fresh vs sitting)
- Description text (the AI can extract context like "sea view," "quiet street," "TAMA 38," "recently renovated kitchen," etc.)

**The AI output** will be 2-3 concise, professional-friendly sentences. Warm but factual -- matching Buywise's "trusted guide" tone. No fluff.

## Technical Implementation

### 1. Edge Function: `generate-market-insight`

- Receives structured data (numbers + listing details)
- Calls Lovable AI (Gemini Flash) with a focused system prompt
- Uses tool calling to return structured output: `{ insight: string }`
- Non-streaming (simple invoke, not chat)
- Handles 429/402 rate limit errors gracefully

### 2. Cache Table: `market_insight_cache`

Avoids re-generating insights on every page view:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| property_id | uuid | Unique, indexed |
| insight_text | text | The generated summary |
| input_hash | text | Hash of inputs to detect stale data |
| created_at | timestamptz | For TTL (7-day expiry) |

RLS: Public read (anon can SELECT). No client writes -- edge function uses service role.

### 3. React Hook: `useMarketInsight`

- Takes property ID + all market context
- Calls edge function via `supabase.functions.invoke`
- Returns `{ insight, isLoading }`
- Only triggers when verdict data is available (comps loaded)

### 4. Component: `AIMarketInsight`

- Renders using the existing `InsightCard` component
- Shows skeleton while loading
- Gracefully hidden if AI call fails (no error state shown)
- Only renders for sale/sold listings with comps data

### 5. Integration into MarketIntelligence

Updated placement order:
1. Section header
2. Verdict badge
3. **AI Market Insight (new)** -- right after the verdict, before the metric cards
4. Value snapshot cards
5. Divider + comps list
6. City link

### 6. Config Update

Add `[functions.generate-market-insight]` with `verify_jwt = false` to config.toml.

---

## Technical Details

### Data Passed to Edge Function

The MarketIntelligence component already has access to the property object. We'll expand the props to include the full property so the AI can reference condition, floor, features, description, etc. The edge function receives:

```text
- price, size_sqm, price_per_sqm
- city, neighborhood, property_type
- bedrooms, bathrooms, floor, total_floors
- year_built, condition
- has_elevator, parking, has_balcony, has_storage, is_accessible
- entry_date, days_on_market
- original_price (if price was reduced)
- description (first 500 chars for context)
- features array
- city_avg_price_sqm, city_yoy_change
- comp_count, avg_comp_deviation_percent
```

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-market-insight/index.ts` | Edge function with AI prompt |
| `src/hooks/useMarketInsight.ts` | React hook |
| `src/components/property/AIMarketInsight.tsx` | UI component |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/property/MarketIntelligence.tsx` | Pass full property, add AIMarketInsight between verdict and snapshot |
| `src/pages/PropertyDetail.tsx` | Pass full property object to MarketIntelligence |
| DB migration | Create `market_insight_cache` table |
