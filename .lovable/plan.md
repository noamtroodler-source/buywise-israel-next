

# Update MarketVerdictBadge: No Red, Recalibrated Ranges, Quality Gate

## What changes

### 1. Quality gate — suppress badge when comps are weak
In `MarketVerdictBadge`, if `compsCount < 3`, show "Limited market data" (neutral gray) instead of any price verdict. This prevents misleading badges based on 1-2 unrepresentative comps.

### 2. Recalibrated ranges with new wording (no red)

| Variance | Label | Color |
|---|---|---|
| **< 0%** | "Below recent sales avg — potential value" | Green |
| **0% to +5%** | "In line with recent sales" | Green |
| **+5% to +12%** | "Above recent sales avg" | Neutral (muted-foreground/secondary) |
| **+12% to +20%** | "Well above recent sales — negotiate" | Amber |
| **> +20%** | "Significantly above recent sales" | Amber |

- No red badges ever
- +5–12% uses `Badge variant="secondary"` (neutral gray) with subtitle "Typical for active listings — room to negotiate"
- Max severity is amber

### 3. Tooltip context update
Update the tooltip to include context about asking-vs-sold gap: "Asking prices typically run 5–15% above final sale prices."

## Files changed

**`src/components/property/MarketIntelligence.tsx`** — Rewrite `MarketVerdictBadge` function:
- Add `compsCount < 3` early return → "Limited market data" badge
- Replace all 5 badge tiers with new ranges/wording/colors
- Remove all `semantic-red` references
- Add a small context line under the badge for the +5-12% and +12-20% tiers

## Technical details
- The `avgComparison` value comes from `RecentNearbySales` which already computes average %-deviation of listing price vs comp sold prices per sqm
- `compsCount` is already passed to the badge component
- No backend changes needed — purely UI/copy update

