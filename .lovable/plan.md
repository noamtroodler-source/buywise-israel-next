

## Add "Understanding the Data" Context Layer

### Problem
Israeli government transaction data has well-known blind spots — unreported payments, bundled extras, condition gaps, view premiums, unpermitted construction, and non-arm's-length sales. Users seeing market comparisons need to understand that recorded prices are a powerful starting point, not the full picture.

### Approach
Create a single reusable component that provides this context in a collapsible format, then place it in the 3 key locations where market data is presented.

### 1. New Component: `src/components/shared/MarketDataContext.tsx`

A collapsible "Understanding the Data" block using the existing `Collapsible` primitive and styled consistently with `InfoBanner`:

- **Collapsed state**: Single-line trigger with a `Database`/`Info` icon — "Government data is powerful — but doesn't capture everything"
- **Expanded state**: 6 concise bullet points covering the key blind spots:
  1. **Unreported payments** — declared prices can understate actual cost
  2. **Bundled extras** — A/C units, furniture, storage sold alongside but not in the record
  3. **Parking & storage** — can be separate transactions worth hundreds of thousands
  4. **Condition & renovation** — gut reno vs original 1970s isn't recorded
  5. **Floor & view premium** — same building, 30-50% price gap, invisible in data
  6. **Non-arm's-length sales** — family transfers at below-market prices appear as normal transactions
- **Closing line** (always visible in expanded): "Recorded transactions are the best available benchmark — BuyWise helps you understand the factors they don't capture."

Tone: warm-professional, factual, no fear-mongering. Empowering the buyer.

Props: `variant?: 'compact' | 'full'` — compact for property pages (fewer words), full for market environment pages.

### 2. Integration Points

**A. Property Detail — Resale Market Intelligence** (`MarketIntelligence.tsx`)
- Place between the AI Market Insight and the "Explore city" link (after line 255)
- Uses `compact` variant

**B. Property Detail — Rental Snapshot** (`PropertyDetail.tsx`)
- Place after the `PropertyValueSnapshot` inside the rental branch (after line 210)
- Uses `compact` variant

**C. Area/City Detail Page** (`AreaDetail.tsx`)
- Place after the Price History chart and before Price by Apartment Size (between sections 4 and 5, after line 223)
- Uses `full` variant — more room to explain since this is a data-heavy page

### 3. AI Insight Prompt Update

Update the edge function prompt for market insights so the "What This Means" section naturally acknowledges data limitations when relevant (e.g., "Keep in mind that recorded prices don't reflect renovation quality or bundled extras"). This is a prompt tweak, not a code structure change — need to check the edge function.

### Files Modified
1. **New**: `src/components/shared/MarketDataContext.tsx`
2. **Edit**: `src/components/property/MarketIntelligence.tsx` — add `<MarketDataContext variant="compact" />` after AIMarketInsight
3. **Edit**: `src/pages/PropertyDetail.tsx` — add compact variant in rental snapshot section
4. **Edit**: `src/pages/AreaDetail.tsx` — add full variant after price history
5. **Edit**: Edge function prompt (if applicable) — minor wording addition

