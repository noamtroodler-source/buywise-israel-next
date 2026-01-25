
# 2-Card AI Value Snapshot for Purchase Properties

## Current Problem
The AI Value Snapshot for purchase properties shows 4 cards where 3 of them (Price per area, City Average, vs Area Average) are all highly correlated price-per-sqm metrics. This creates redundancy and wastes valuable screen real estate.

## Solution
Consolidate to a focused **2-card layout** that eliminates redundancy:

### Card 1: Price vs. Market (Combined)
A single card showing all three related metrics together:
- **Primary metric**: Property's price/sqm (large, bold)
- **Context line**: City average price/sqm for comparison
- **Verdict badge**: Percentage difference with color coding (green = below avg, neutral = above avg)

Example layout:
```text
┌─────────────────────────────────┐
│ ₪52,000/sqm                     │  ← Property price (large)
│ Herzliya avg: ₪48,500/sqm       │  ← City context (smaller)
│ ┌───────────────────┐           │
│ │ +7% above average │           │  ← Verdict badge
│ └───────────────────┘           │
└─────────────────────────────────┘
```

### Card 2: 12-Month Trend (Keep As-Is)
Retains the existing market direction indicator showing area price movement.

## Technical Changes

**File: `src/components/property/PropertyValueSnapshot.tsx`**

1. **Modify the purchase properties section** (lines 175-284):
   - Remove the three separate cards for price/sqm, city average, and comparison
   - Create one unified "Price vs. Market" card containing all three data points
   - Keep the 12-Month Trend card unchanged

2. **Update grid layout**:
   - Change from up to 4 columns to a fixed 2-column layout (`grid-cols-1 sm:grid-cols-2`)
   - Adjust card count logic to reflect 2 maximum cards

3. **Design the combined card**:
   - Stack the property price/sqm as the hero metric
   - Show city average as secondary context text
   - Add inline comparison percentage with appropriate color coding

## Visual Result
- Cleaner, less cluttered snapshot section
- All price-per-sqm info in one glanceable card
- 12-month trend gets equal visual weight
- Rentals section remains unchanged (already logical grouping)
