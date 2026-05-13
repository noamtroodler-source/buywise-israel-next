# AI-Generated Buyer Takeaway

Replace the current static, template-based "Buyer takeaway" line on every property page with a sharp, AI-generated 2-sentence brief that pulls from every relevant signal we already compute (price context, comps, city/neighborhood benchmarks, premium drivers, condition, fees, ownership, size source). Generate once per listing, cache in the database, regenerate when key inputs change, and backfill the entire current inventory (~400 listings).

## What the buyer sees

- Same callout slot, same Sparkles icon, same `Buyer takeaway:` label.
- 1–2 sentences, ~280 char max, plain English, "Trusted Friend" voice.
- Always actionable: what this listing actually is + the single most useful next step for the buyer.
- Falls back to the current rule-based string if AI output is missing — UI never breaks.

## Data the AI gets per listing

A compact JSON brief built server-side with only what matters:

- **Property**: city, neighborhood, price (NIS), size_sqm, Israeli room count, bed/bath, floor/total_floors, year_built, condition, elevator, parking, balcony, storage, accessible, ownership_type, vaad_bayit, property_type, sqm_source, original_price (for reductions), days on market.
- **Price context** (already computed by `getPriceContext`): publicLabel, confidenceTier, displayGapPercent, propertyClassLabel, premiumDrivers, percentageSuppressed, isLuxuryPremiumMode, confidenceCaps.
- **Benchmarks**: city avg ₪/sqm, room-specific city ₪/sqm, neighborhood avg ₪/sqm, YoY price change.
- **Comps**: count of recorded sales used, radius (500m/1km), median ₪/sqm of comps when available.
- **Premium explanation** text (if agent provided one).

No personal data, no agent contact, no scraped third-party media.

## Architecture

```text
On listing insert/update (trigger -> pg_net) ──► edge fn: generate-buyer-takeaway
                                                       │
   Backfill admin button / one-shot script ────────────┤
                                                       ▼
                                        Lovable AI Gateway (google/gemini-2.5-flash)
                                                       │
                                                       ▼
                              properties.ai_buyer_takeaway              (text)
                              properties.ai_buyer_takeaway_generated_at (timestamptz)
                              properties.ai_buyer_takeaway_input_hash   (text)
```

- **New edge function `generate-buyer-takeaway`** (Deno, `verify_jwt = false`):
  - Input: `{ property_id, force?: boolean }`.
  - Loads property, city row, neighborhood avg, room-specific city price, recent comps summary (reuses the same RPCs the UI uses).
  - Computes `priceContext` server-side so the model sees the same verdict as the UI.
  - Hashes the brief inputs; skips regeneration if hash matches stored hash and not `force`.
  - Calls Lovable AI Gateway (`google/gemini-2.5-flash`) with a tight system prompt:
    - max 2 sentences, ≤280 chars
    - no fabricated numbers — only restate signals from the brief
    - must reference at least one concrete signal (gap %, comps count, premium driver, condition, ownership)
    - must end with the single most useful next step for the buyer
    - "Trusted Friend" voice; no "Anglo"; international-buyer framing
  - Handles 429/402 gracefully (keeps existing value, logs).
  - Writes the 3 columns above.

- **DB migration**:
  - Add the 3 columns.
  - Trigger on `properties` after insert/update of price / size_sqm / condition / premium_drivers / premium_explanation / neighborhood / city / listing_status / vaad_bayit / ownership_type that calls the edge function via `pg_net` (fire-and-forget). Debounced inside the function by hash check.

- **Backfill**:
  - One-shot edge function `backfill-buyer-takeaways` (admin-only) that pages through all `for_sale` + `for_rent` properties (~400) and invokes `generate-buyer-takeaway` with concurrency ~5. Logs progress; safe to re-run. Triggered from a button in the existing admin tools page.

## Frontend changes (small)

- `MarketIntelligence.tsx`:
  - Add `ai_buyer_takeaway` to the property prop type.
  - In `BuyWiseTake`, prefer `property.ai_buyer_takeaway` when present; otherwise fall back to existing `buildBuyerTakeaway(priceContext)`.
  - Keep the tinted callout layout exactly as-is — only the text source changes.
- Ensure the property-detail fetch selects the new column.

## Quality + safety guardrails

- Prompt explicitly forbids inventing numbers; model can only restate signals from the brief.
- Hard length cap enforced after generation (truncate at sentence boundary if model overshoots).
- If output fails validation (too long, empty, banned phrase), fall back to rule-based string and don't store.
- Respects Core memory: "Trusted Friend" voice, "International buyers", NIS internally.

## Out of scope

- No UI restructuring of the surrounding card (already done in the prior step).
- No changes to comps math or price-context logic.
- No new scraping or third-party calls.
