

# Listing Decoder Redesign — Property Detail Page Style

## Problem
The current Listing Decoder results look like a generic tool output (cards + accordions in a sidebar). The user wants it to look like a BuyWise Israel property detail page — with photos, a proper hero, stats grid, and the same visual language buyers already trust.

## Design Vision
After a URL is analyzed, the results page transforms into a **full-width property detail layout** mirroring `PropertyDetail.tsx` — hero image gallery at top, price + stats bar, description, then enriched BuyWise sections (What's Missing, Red Flags, Questions to Ask, Market Context). The URL input becomes a minimal top bar, and the results take center stage.

## Key Changes

### 1. Edge Function: Extract Images
Currently Firecrawl only fetches `markdown`. Change to also request `links` format so we can extract image URLs from the scraped page. Additionally, add `screenshot` format as a fallback hero image. The AI prompt will also be updated to extract image URLs from the markdown content.

### 2. Loading State with Progress Indicator
Replace the generic skeleton with a **multi-step progress indicator** showing:
- "Scraping listing..." (0-30%)
- "Translating & analyzing..." (30-80%)  
- "Matching market data..." (80-100%)

This gives users feedback during the ~5-8 second wait. Use a `Progress` bar + animated status text.

### 3. Results Layout — Full Property Page Style
Once results arrive, render a **full-width property detail page** instead of the current two-column tool layout:

```text
┌─────────────────────────────────────────────┐
│ [URL input bar + Decode button]  (compact)  │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ HERO: Photo gallery from listing        │ │
│ │ (carousel with thumbnails, same as      │ │
│ │  PropertyHero pattern)                  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌──────────────────────┐ ┌───────────────┐ │
│ │ LEFT (2/3 width):    │ │ RIGHT STICKY: │ │
│ │                      │ │               │ │
│ │ Price + Title        │ │ "What's       │ │
│ │ Stats bar (beds,     │ │  Missing"     │ │
│ │   sqm, floor, type)  │ │  card with    │ │
│ │ Quick Facts grid     │ │  risk badges  │ │
│ │ (same bg-muted/50    │ │               │ │
│ │  cards as property)  │ │ [Save] [Copy] │ │
│ │                      │ │ [New Analysis]│ │
│ │ Full Translation     │ │               │ │
│ │ (collapsible)        │ └───────────────┘ │
│ │                      │                   │
│ │ Israeli Terms        │                   │
│ │ (glossary cards)     │                   │
│ │                      │                   │
│ │ Red Flags            │                   │
│ │                      │                   │
│ │ Questions to Ask     │                   │
│ │                      │                   │
│ │ Market Context       │                   │
│ └──────────────────────┘                   │
└─────────────────────────────────────────────┘
```

### 4. Specific Design Patterns to Match
- **Price**: `text-3xl font-bold` just like PropertyQuickSummary
- **Stats bar**: `grid grid-cols-4` with icon + value + label, border-y divider
- **Quick Facts grid**: `bg-muted/50 rounded-lg p-3` cards (same as floor/parking/condition cards)
- **Sections**: Use `motion.div` with staggered `delay` animations
- **"What's Missing" sidebar card**: Styled like `StickyContactCard` — sticky, prominent, with risk-colored badges
- **Hebrew Terms**: Rendered as `bg-muted/50 rounded-lg p-3` cards (already correct)
- **Description/Translation**: Uses the expand/collapse pattern from `PropertyDescription`

### 5. Files to Modify
- **`supabase/functions/decode-listing/index.ts`** — Add `links` and `screenshot` to Firecrawl formats; extract image URLs from response
- **`src/hooks/useListingDecoder.ts`** — Add `images` and `screenshot` to result types; add `loadingStep` state for progress
- **`src/components/tools/ListingDecoderTool.tsx`** — Complete redesign: property-page-style layout with hero, stats bar, sticky sidebar, motion animations, progress indicator during loading

No new files needed — this is a redesign of the existing component to match the property detail page patterns already in the codebase.

