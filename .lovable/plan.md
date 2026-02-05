
# Consolidate to Single "Comparison AI Summary"

## Overview
Merge the current `CompareAISummary` and `CompareWinnerSummary` into one unified component, keeping only the AI-powered summary while adding the winner breakdown and CTA buttons.

## Changes

### 1. Update `CompareAISummary` Component
**File:** `src/components/compare/CompareAISummary.tsx`

**Remove:**
- The "Regenerate" button (prevent unlimited regenerations)
- The `RefreshCw` icon import

**Add:**
- Winner breakdown pills (showing each property and how many categories it wins)
- "Calculate True Costs" and "Run Mortgage Numbers" CTA buttons at the bottom
- Keep the error state with "Try again" only for initial failures

**New structure:**
```text
+--------------------------------------------------+
|  [Sparkles]  Comparison AI Summary               |
|  AI-powered analysis of your properties          |
+--------------------------------------------------+
|                                                  |
|  "The 5-room duplex in Petah Tikva offers..."    |
|  (AI-generated summary text)                     |
|                                                  |
|  [Property A - 3 wins] [Property B - 1 win] ...  |
|                                                  |
|  [Calculate True Costs] [Run Mortgage Numbers]   |
|                                                  |
|  AI-generated · Based on listed property data    |
+--------------------------------------------------+
```

### 2. Update Compare Page
**File:** `src/pages/Compare.tsx`

- Remove the `CompareWinnerSummary` import and usage
- Keep only `CompareAISummary`

### 3. Update Exports
**File:** `src/components/compare/index.ts`

- Remove `CompareWinnerSummary` export

### 4. Delete Old Component (optional cleanup)
**File:** `src/components/compare/CompareWinnerSummary.tsx`

- Can be deleted since it's no longer used

## Files to Modify

| File | Action |
|------|--------|
| `src/components/compare/CompareAISummary.tsx` | Modify |
| `src/pages/Compare.tsx` | Modify |
| `src/components/compare/index.ts` | Modify |
| `src/components/compare/CompareWinnerSummary.tsx` | Delete (optional) |
