

## Plan: Add Real Property/Project Links to AI Chat Responses

### Problem
When the AI mentions neighborhoods or areas (e.g., "Ir Yamim", "Kiryat Hasharon"), there are no clickable links to actual listings or projects on BuyWise. The user wants the AI to reference real data and link to it.

### Approach

**Strategy**: Inject available properties and projects for the user's search criteria into the system prompt, so the AI can reference them with proper links. The edge function will query the database for relevant listings based on the conversation context (city, bedrooms, etc.) and include them as context.

### Changes

**1. Edge Function (`supabase/functions/ask-buywise/index.ts`)**

Update `buildSystemPrompt` to query properties and projects matching the conversation context:

- Parse the `pageContext` and the latest user message for city names and bedroom counts
- Query `properties` table for matching listings (limit ~10), selecting id, title/address, city, neighborhood, price, bedrooms, property_type
- Query `projects` table for matching projects (limit ~5), selecting id, name, city, price_from
- Inject these as a new `## Available Listings` section in the system prompt with pre-formatted markdown links like `[Property Name](/property/{id})` and `[Project Name](/project/{id})`
- Add instructions telling the AI to reference these specific listings when relevant and always link to them

- Also accept a new optional `userQuery` field in the request body (the latest user message text) to help extract search intent

**2. System Prompt Update (same file)**

Add a new instruction section:
```
## Linking to Listings & Projects
When you mention specific properties or projects from the "Available Listings" data, ALWAYS include a markdown link.
Format: [Brief description](/property/{id}) or [Project Name](/project/{id})
When discussing neighborhoods, link to filtered listings: [See 4BR in Ir Yamim](/listings?status=for_sale&city=Netanya&neighborhood=Ir+Yamim&bedrooms=4)
```

**3. Frontend link rendering (already working)**
The chat already renders markdown via `react-markdown` and handles internal links via react-router — no frontend changes needed for basic links.

### Technical Details

- City name extraction: Simple keyword matching against a known city list (or use the `city` column's distinct values)
- The query will filter by `is_published = true` and optionally by city/bedrooms
- Results will be formatted as a compact reference table in the system prompt to stay within token limits
- Listings URL links (e.g., `/listings?status=for_sale&city=Netanya&bedrooms=4`) give the AI a way to link to filtered search results even when specific properties aren't matched

