
# Hybrid AI-Powered Questions to Ask

## Overview

Transform the current static question system into an AI-powered hybrid approach that delivers exactly **5-6 high-quality, listing-specific questions** per property/project/rental.

## Current State

- 144 static questions in `property_questions` table (33 legal, 33 rental, 27 pricing, 23 construction, 22 building)
- Currently shows top 8 questions based on scoring algorithm
- Questions filtered by listing type and buyer profile
- No listing-specific customization

## New Approach: Hybrid AI System

```text
┌─────────────────────────────────────────────────────────────────┐
│                     HYBRID QUESTION ENGINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LISTING DATA ──┐                                               │
│    • Price, size, year built                                    │
│    • Days on market                     ┌──────────────────┐    │
│    • Price per sqm vs area avg  ───────>│   AI PROMPT      │    │
│    • Missing fields             ───────>│   (Gemini Flash) │    │
│    • Property condition                 └────────┬─────────┘    │
│                                                  │              │
│  QUESTION LIBRARY ──────────────────────────────>│              │
│    • Top 20 pre-filtered questions               │              │
│    • Matching listing type                       ▼              │
│                                         ┌──────────────────┐    │
│                                         │  OUTPUT: 5-6     │    │
│                                         │  Questions with  │    │
│                                         │  custom "why"    │    │
│                                         └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Why Hybrid Beats Pure Approaches

| Approach | Pros | Cons |
|----------|------|------|
| **Pure Static** | Fast, predictable, no cost | Generic, not listing-specific |
| **Pure AI** | Highly personalized | Risky quality, slow, expensive |
| **Hybrid** | Best of both - expert library + AI curation | Slight latency |

## What the AI Does

1. **Receives**: Listing data + top 20 pre-filtered questions from library
2. **Analyzes**: Spots anomalies (e.g., old building, price drop, long DOM, missing info)
3. **Selects**: 4-5 most relevant questions from library
4. **Generates**: 1-2 custom questions specific to this listing's data
5. **Customizes**: Rewrites "why it matters" to reference actual listing data

### Example Output

For a 1974 building in Tel Aviv, 150 days on market, price reduced 8%:

| # | Question | Why It Matters |
|---|----------|----------------|
| 1 | "Are there pending TAMA38 plans for this building?" | Buildings from the 1970s often qualify for seismic upgrades |
| 2 | "Why has the price dropped 8% from the original listing?" | Price reductions after 150 days suggest motivated seller |
| 3 | "What's the seller's timeline for closing?" | Long market time often means flexibility on terms |
| 4 | "Has the building's roof been replaced recently?" | 50-year-old buildings often have deferred maintenance |
| 5 | "What are the annual arnona and vaad bayit costs?" | Older buildings can have higher maintenance fees |

## Cost Analysis

| Factor | Value |
|--------|-------|
| Model | Gemini 3 Flash Preview |
| Input | ~500 tokens (listing + 20 questions) |
| Output | ~300 tokens (6 questions) |
| Cost per call | ~$0.001-0.002 |
| Monthly (10k views) | ~$10-20 |
| Monthly (50k views) | ~$50-100 |

**Verdict**: Extremely affordable for the UX value delivered.

## Caching Strategy

- Cache AI responses by property ID for 24 hours
- Same property = same questions (no re-generation)
- Reduces costs by 80-90% in practice

## Implementation

### 1. New Edge Function: `generate-listing-questions`

Creates an edge function that:
- Receives listing data + type (buy/rent/project)
- Pre-filters questions from library
- Calls Gemini Flash with structured output
- Returns exactly 5-6 curated questions

### 2. Update Hooks

Modify `usePropertyQuestions` and `useProjectQuestions` to:
- Call edge function instead of direct DB query
- Handle loading/error states
- Cache results in React Query (staleTime: 24 hours)

### 3. UI Updates

Update components to:
- Remove "Show more" button (only 5-6 questions now)
- Remove guest signup nudge (AI is listing-focused, not buyer-focused)
- Show "Tailored for this listing" badge instead
- Add subtle loading state during AI generation

### 4. Fallback Logic

If AI fails or times out:
- Fall back to top 5 static questions from library
- Show without "Tailored" badge
- Log error for monitoring

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/generate-listing-questions/index.ts` | Create - Edge function for AI curation |
| `src/hooks/usePropertyQuestions.ts` | Modify - Call edge function instead of DB |
| `src/components/property/PropertyQuestionsToAsk.tsx` | Modify - Remove expand, add "Tailored" badge |
| `src/components/project/ProjectQuestionsToAsk.tsx` | Modify - Same changes |

## Technical Details

### Edge Function Prompt Structure

```typescript
const systemPrompt = `You are a real estate due diligence expert for the Israeli market.
Your job is to select and customize the most valuable questions a buyer/renter should ask.

Guidelines:
- Select exactly 5-6 questions total
- Prioritize questions that relate to THIS SPECIFIC listing's characteristics
- If you see anomalies (old building, price drop, long time on market), address them
- Customize the "why it matters" to reference actual listing data
- You may create 1-2 original questions if the listing has unique issues
- Keep questions actionable and non-obvious`;

const userPrompt = `Listing Type: ${type}
Property Data:
- Price: ${price} ILS
- Size: ${size} sqm
- Price per sqm: ${pricePerSqm} ILS
- Year Built: ${yearBuilt}
- Days on Market: ${daysOnMarket}
- Price Reduced: ${priceReduced ? 'Yes, by ' + dropPercent + '%' : 'No'}
- Missing Info: ${missingFields.join(', ') || 'None'}
- Condition: ${condition}
- Location: ${city}, ${neighborhood}

Pre-filtered Question Library:
${questions.map((q, i) => `${i + 1}. "${q.question_text}" - Why: ${q.why_it_matters}`).join('\n')}

Select 5-6 questions and customize them for this listing.`;
```

### Structured Output Schema

```typescript
{
  type: "function",
  function: {
    name: "provide_questions",
    parameters: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question_text: { type: "string" },
              why_it_matters: { type: "string" },
              category: { type: "string" },
              is_ai_generated: { type: "boolean" }
            }
          },
          minItems: 5,
          maxItems: 6
        }
      }
    }
  }
}
```

## Result

- **Before**: 8 generic questions, expand to see more
- **After**: 5-6 curated questions specific to THIS listing, no expand needed
- **UX Impact**: Higher trust, more actionable, less overwhelming
- **Cost**: ~$10-20/month for typical usage
