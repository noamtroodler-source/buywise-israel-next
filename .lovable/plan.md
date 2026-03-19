

## Expand Ask BuyWise Tools: Area Comparison, Multi-Tool, Deep-Dive, Tax Calculator & More

### What Changes

Add 6 new tools to the `ask-buywise` edge function and upgrade the tool loop from 1 round to 2 rounds for multi-tool chaining.

### New Tools (Priority Order)

#### 1. `compare_areas` — Side-by-side city/area comparison
Queries `cities` table for two cities. Returns price/sqm, yields, commute times, socioeconomic rank, population, arnona, va'ad bayit, anglo presence, highlights, identity sentence. The AI narrates a structured comparison.

#### 2. Multi-tool chaining (loop upgrade)
Change the tool execution loop from 1 round to 2 rounds. This lets the AI call `search_listings` + `get_city_stats` in one conversation turn, or `compare_areas` then `search_listings` to show listings in both cities.

#### 3. `get_listing_details` — Deep-dive on a single property
Takes a property ID. Returns full details: description, features, agent info (name, agency), condition, entry date, floor, parking, AC, furnished status, pets, lease terms, price history (original vs current), va'ad bayit, images count. Enables follow-up questions like "tell me more about that 3BR."

#### 4. `calculate_purchase_tax` — Inline tax calculation
Takes price + buyer type (first_property, upgrading, additional, new_oleh). Queries `purchase_tax_brackets` table for current brackets, computes total tax. Returns breakdown by bracket. No need for the user to leave chat.

#### 5. `get_neighborhood_profile` — Deep neighborhood info
Queries `neighborhood_profiles` table by city + neighborhood name. Returns narrative, reputation, best_for, anglo_community, daily_life, honest_tradeoff, transit/mobility. Rich context for "what's X neighborhood like?"

#### 6. `get_user_saved_listings` — Personalized context (authenticated only)
Queries `favorites` joined with `properties` for the authenticated user. Returns their saved listings with key fields. Enables "anything new like my saved properties?" or "compare my saved listings."

### Implementation

**Single file modified:** `supabase/functions/ask-buywise/index.ts`

- Add 5 new tool definitions to the `TOOLS` array
- Add 5 new executor functions
- Update `executeTool` switch statement
- Change tool loop: after first tool round, check if response has more `tool_calls` — if yes, execute one more round (cap at 2)
- Update system prompt to describe new capabilities
- For `get_user_saved_listings`: extract user ID from `x-user-token` header in the executor, only available for authenticated users
- For `calculate_purchase_tax`: pure computation from DB brackets, no AI needed for the math

### System Prompt Updates

Add to the tool usage instructions:
- "When users compare cities/areas, use `compare_areas`"
- "When users ask 'tell me more' about a listing, use `get_listing_details`"
- "When users ask about purchase tax, use `calculate_purchase_tax` with their buyer profile data if available"
- "When users ask about a neighborhood, use `get_neighborhood_profile`"
- "For authenticated users asking about their saved properties, use `get_user_saved_listings`"

### No Other Changes
- No frontend changes needed
- No new tables or migrations
- No new edge functions

