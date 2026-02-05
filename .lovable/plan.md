
# Improve AI Value Snapshot Clarity & Visual Indicators

## Changes

### 1. Clearer Label for 12-Month Trend Card
**Current**: "Area price change" (vague)  
**New**: "{City} avg prices" (e.g., "Tel Aviv avg prices")

### 2. Visual Differentiation for Positive/Negative Trends (No Red/Green)

Apply a combined approach using background tint + icon/text color:

| Trend | Background | Icon & % Color | Border |
|-------|-----------|----------------|--------|
| Positive (≥0%) | `bg-primary/10` | `text-primary` | `border-primary/20` |
| Negative (<0%) | `bg-muted/30` | `text-muted-foreground` | `border-border/50` |

This applies to:
- **12-Month Trend card** (purchase properties)
- **vs City Average card** (purchase properties)  
- **vs Market Rate card** (rental properties)

## Technical Details

**File**: `src/components/property/PropertyValueSnapshot.tsx`

**Changes**:
1. Update the subtext on line 278 from `"Area price change"` → `"{city} avg prices"`
2. Add conditional styling to percentage cards:
   - Positive: blue-tinted background, primary-colored icon and percentage text
   - Negative: muted background, muted icon and percentage text
3. Apply same logic to rental "vs Market Rate" card for consistency

**No new dependencies** - uses existing Tailwind classes (`bg-primary/10`, `text-primary`, `border-primary/20`)
