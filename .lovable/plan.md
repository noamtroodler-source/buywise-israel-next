

# Comparison AI Summary Feature

## Overview
Add an AI-powered "Comparison AI Summary" section to the Compare page that provides a comprehensive 3-4 sentence breakdown analyzing the properties being compared. This summary will do the "processing work" for users by highlighting key differences, trade-offs, and providing actionable guidance on which property might be best for different buyer/renter profiles.

## What the AI Summary Will Include
The AI will analyze all compared properties and generate a comprehensive summary covering:
- **Overall winner assessment** with context (not just "X wins" but why)
- **Key trade-offs** between properties (e.g., "Property A offers more space at a lower price, but Property B is newer and in a more central location")
- **Value analysis** (which property offers best value for money)
- **Specific recommendations** based on user priorities (families, investors, first-time buyers)
- **Notable differences** in features, location, or condition

## Implementation Plan

### 1. Create Edge Function: `generate-comparison-summary`
**File:** `supabase/functions/generate-comparison-summary/index.ts`

The edge function will:
- Accept an array of property data with all relevant comparison metrics
- Use Lovable AI (google/gemini-3-flash-preview) to generate the summary
- Use tool calling to return structured output
- Handle rate limits (429) and payment errors (402)

**Input payload:**
```typescript
{
  properties: Array<{
    title: string;
    price: number;
    size_sqm: number;
    bedrooms: number;
    bathrooms: number;
    city: string;
    neighborhood: string;
    condition: string;
    year_built: number;
    floor: number;
    parking: number;
    features: string[];
  }>;
  isRental: boolean;
  winnerData: Array<{ title: string; wins: number }>;
}
```

**Output:**
```typescript
{
  summary: string; // 3-4 comprehensive sentences
}
```

### 2. Create Component: `CompareAISummary`
**File:** `src/components/compare/CompareAISummary.tsx`

A new component that:
- Displays the AI-generated summary with a distinct "AI" visual treatment
- Shows loading state with skeleton animation while generating
- Caches the summary in component state (regenerates on property change)
- Has a "Regenerate" button for users who want a fresh analysis
- Handles error states gracefully (shows fallback to basic summary)

**Design:**
- Header: "Comparison AI Summary" with Sparkles/Brain icon
- Subtitle: "AI-powered analysis of your selected properties"
- Body: The generated summary text (3-4 sentences)
- Optional: Small disclaimer "AI-generated summary based on listed data"

### 3. Update Compare Page
**File:** `src/pages/Compare.tsx`

- Import and render `CompareAISummary` component
- Place it between the comparison sections and the existing `CompareWinnerSummary`
- Pass required property data and winner counts to the component
- The AI summary will complement (not replace) the existing winner summary

### 4. Update config.toml
**File:** `supabase/config.toml`

Add the new edge function configuration:
```toml
[functions.generate-comparison-summary]
verify_jwt = false
```

### 5. Export Component
**File:** `src/components/compare/index.ts`

Add export for the new `CompareAISummary` component.

## UI/UX Design

```text
+--------------------------------------------------+
|  [Brain Icon]  Comparison AI Summary             |
|  AI-powered analysis of your properties          |
+--------------------------------------------------+
|                                                  |
|  "The 5-room duplex in Petah Tikva offers the    |
|  best overall value, combining the largest       |
|  living space (120 sqm) with the lowest price    |
|  per square meter at 28,333 ILS. While the       |
|  penthouse in Tel Aviv commands a premium, its   |
|  central location and modern finishes may        |
|  justify the higher cost for those prioritizing  |
|  convenience and lifestyle. For families         |
|  seeking space on a budget, the Petah Tikva      |
|  property is the clear winner; for professionals |
|  valuing location, consider the Tel Aviv         |
|  option despite its smaller footprint."          |
|                                                  |
|  [Regenerate Summary]                            |
|                                                  |
|  AI-generated · Based on listed property data    |
+--------------------------------------------------+
```

## Technical Details

| Component | Purpose |
|-----------|---------|
| Edge function | Server-side AI processing via Lovable AI gateway |
| Tool calling | Structured output extraction for reliable summary format |
| Component state | Cache summary to avoid re-fetching on every render |
| useEffect trigger | Regenerate when properties array changes |
| Error boundary | Graceful fallback if AI fails |

## AI Prompt Strategy
The system prompt will instruct the AI to:
1. Compare properties objectively using the provided metrics
2. Highlight the most significant differences
3. Avoid generic statements - be specific to the actual data
4. Provide actionable guidance for different buyer/renter profiles
5. Keep the summary to 3-4 comprehensive sentences
6. Use natural, conversational language
7. For rentals: focus on monthly costs, availability, lease terms
8. For sales: focus on value, investment potential, location

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/generate-comparison-summary/index.ts` | Create |
| `src/components/compare/CompareAISummary.tsx` | Create |
| `src/components/compare/index.ts` | Modify (add export) |
| `src/pages/Compare.tsx` | Modify (add component) |
| `supabase/config.toml` | Modify (add function config) |

## Error Handling
- **Rate limit (429):** Show toast "AI is busy, please try again in a moment"
- **Payment required (402):** Show toast "AI service temporarily unavailable"
- **Network error:** Show fallback to existing basic summary
- **Invalid response:** Log error, show graceful fallback

