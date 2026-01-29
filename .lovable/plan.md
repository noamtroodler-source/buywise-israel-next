

# Cap Maximum Display Values in Affordability Calculator

## Problem

When users enter high income values, the calculator displays unrealistically large property prices like "₪101.6M – ₪101.9M". This exceeds any practical residential property price in Israel.

## Solution

Cap the maximum property price range at **₪99.9 million** at the calculation level.

## Implementation

**File: `src/components/tools/AffordabilityCalculator.tsx`**

### Step 1: Add constant (around line 93)

```typescript
// Maximum realistic property price display ceiling
const MAX_DISPLAY_PROPERTY_PRICE = 99900000; // ₪99.9M
```

### Step 2: Cap the range values (lines 263-264)

```typescript
// Before:
maxPropertyLow: Math.round(maxPropertyAtHighRate),
maxPropertyHigh: Math.round(maxPropertyAtLowRate),

// After:
maxPropertyLow: Math.round(Math.min(maxPropertyAtHighRate, MAX_DISPLAY_PROPERTY_PRICE)),
maxPropertyHigh: Math.round(Math.min(maxPropertyAtLowRate, MAX_DISPLAY_PROPERTY_PRICE)),
```

## Result

| High Income Input | Before | After |
|---|---|---|
| ₪3,000,000/month | ₪101.6M – ₪101.9M | ₪99.9M – ₪99.9M |
| ₪7,000,000/month | ₪742.9M – ₪800M | ₪99.9M – ₪99.9M |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/tools/AffordabilityCalculator.tsx` | Add `MAX_DISPLAY_PROPERTY_PRICE` constant and cap `maxPropertyLow`/`maxPropertyHigh` |

