

## Add Tool-Calling to Ask BuyWise for Live Inventory Access

### Current State
The `ask-buywise` edge function already injects listings into the system prompt by extracting cities/bedrooms from text. But this is limited: it only runs once at prompt build time, uses simple keyword matching, and can't handle follow-up queries like "show me cheaper ones" or "what about rentals?"

### What Changes

**Upgrade the edge function to use AI tool-calling**, so the model can query your database on-demand during the conversation.

### Architecture

```text
User: "Show me 3BR apartments in Ra'anana under 3M"
  ↓
Edge Function → AI Gateway (with tools defined)
  ↓
AI decides to call: search_listings({city:"Ra'anana", bedrooms:3, max_price:3000000})
  ↓
Edge Function runs DB query → returns results to AI
  ↓
AI weaves real listings into its response with markdown links
```

### Implementation Steps

#### 1. Define tools in the edge function
Add tool definitions to the AI gateway request:
- **`search_listings`** — query `properties` table by city, neighborhood, bedrooms, price range, listing_status, property_type. Returns up to 8 results with id, title, city, neighborhood, price, bedrooms, size, property_type.
- **`search_projects`** — query `projects` table by city, price range, status. Returns name, slug, city, price_from, bedrooms range.
- **`get_city_stats`** — query `city_price_history` for a given city. Returns recent avg price, trend direction.
- **`get_nearby_comps`** — call existing `get_nearby_sold_comps()` DB function with lat/lng/city. Returns recent sold prices for comparison.

#### 2. Implement tool execution loop
After the initial AI response, if the model returns `tool_calls` instead of content:
1. Parse the tool call name and arguments
2. Execute the corresponding DB query using the service role client
3. Send the tool results back to the AI as a follow-up message
4. Stream the final response to the client

This is a **non-streaming tool loop + streaming final answer** pattern: the tool calls happen server-side, then the final text response streams to the client as before.

#### 3. Update system prompt
- Remove the static `fetchListingsContext` injection (or keep as fallback)
- Add instructions telling the AI it has tools available and should use them when users ask about listings, prices, or projects
- Add: "When you have listing data from tools, ALWAYS include markdown links"

#### 4. No frontend changes needed
The chat UI already renders markdown links. The tool-calling is entirely server-side — the client still sees a streaming text response.

### Technical Details

- Tools use the **Supabase service role** key (already available as `SUPABASE_SERVICE_ROLE_KEY`) for unrestricted reads
- The tool loop is capped at 1 round to prevent infinite loops
- Tool results are trimmed to essential fields to stay within token limits
- The existing streaming pattern is preserved — only the final assistant message streams to the client

### Files Modified
- `supabase/functions/ask-buywise/index.ts` — add tool definitions, tool executor, tool loop before streaming

### Files NOT Modified
- No frontend changes
- No new tables
- No new edge functions

