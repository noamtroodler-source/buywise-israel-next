
# Speed Up Questions to Ask (Without Compromising Quality)

## What's Causing the 5-8 Second Wait

1. **Edge function cold start** (~1-2 seconds on first call)
2. **Database query** to fetch 60+ questions from `property_questions` (~200-400ms)
3. **AI model call** to `gemini-3-flash-preview` (~3-5 seconds)
4. **No server-side caching** - every visitor triggers a fresh AI call, even for the same listing

## The Solution: Server-Side Caching

**Key principle**: Keep the EXACT same AI model (`gemini-3-flash-preview`) and prompts. Just store the results so they don't need to be regenerated for every visitor.

### How It Works

```text
First visitor to listing:
┌──────────┐    ┌────────────┐    ┌─────────────┐    ┌──────────────┐
│  User    │ -> │ Edge Func  │ -> │  AI Model   │ -> │ Save to      │
│  visits  │    │ (no cache) │    │ (5-8 sec)   │    │ cache table  │
└──────────┘    └────────────┘    └─────────────┘    └──────────────┘

Second+ visitor to same listing:
┌──────────┐    ┌────────────┐    ┌─────────────┐
│  User    │ -> │ Edge Func  │ -> │ Return from │ -> (~200-400ms)
│  visits  │    │ (cache hit)│    │ cache       │
└──────────┘    └────────────┘    └─────────────┘
```

### Expected Performance

| Scenario | Current Time | After Caching |
|----------|--------------|---------------|
| First visitor | 5-8 seconds | 5-8 seconds (same) |
| Repeat visitors | 5-8 seconds | **~200-400ms** |
| Cache expiry | N/A | 7 days (regenerates after) |

## What Stays EXACTLY the Same

- AI model: `google/gemini-3-flash-preview`
- System prompt and user prompt
- Question selection logic
- Customized "why it matters" explanations
- The 5-6 question output format
- All the Israeli real estate expertise

## Implementation Details

### 1. New Database Table

Create a `listing_question_cache` table to store generated questions:

```sql
CREATE TABLE listing_question_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,  -- 'property' or 'project'
  entity_id UUID NOT NULL,    -- property_id or project_id
  cache_key TEXT NOT NULL,    -- hash of listing data
  questions JSONB NOT NULL,   -- the generated questions
  source TEXT NOT NULL,       -- 'ai', 'fallback', etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  
  UNIQUE(entity_type, entity_id, cache_key)
);

-- Index for fast lookups
CREATE INDEX idx_listing_question_cache_lookup 
  ON listing_question_cache(entity_type, entity_id, cache_key);
```

### 2. Update Edge Function

Modify `generate-listing-questions/index.ts` to:
1. Accept optional `entity_type` and `entity_id` parameters
2. Check cache FIRST before calling AI
3. Store results in cache after successful AI generation
4. Return cached results with `source: 'cached'`

### 3. Update Frontend Hook

Modify `useListingQuestions.ts` to pass `entity_id` and `entity_type` so the edge function knows which listing to cache for.

### 4. Cache Invalidation Strategy

- Cache expires automatically after 7 days
- If listing price changes significantly, generate new questions (optional enhancement)
- Fallback questions are NOT cached (only AI-generated ones)

## Files to Change

| File | Changes |
|------|---------|
| New SQL migration | Create `listing_question_cache` table |
| `supabase/functions/generate-listing-questions/index.ts` | Add cache check/store logic |
| `src/hooks/useListingQuestions.ts` | Pass entity_id and entity_type |

## Why This Preserves Quality

1. **Same AI model** - No switching to a faster/cheaper model
2. **Same prompts** - Expert-level Israeli real estate knowledge stays intact
3. **Same output** - Questions are identical, just served faster
4. **Cache only AI results** - Fallback questions aren't cached, so if AI fails, next visitor gets a fresh attempt

## Cost Impact

- **Reduced AI costs** - Only pay for AI on first visitor per listing (per week)
- **No quality tradeoff** - Unlike switching to a faster model
