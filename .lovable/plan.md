
# Update Rental Cost Breakdown Personalization Header

## Problem
The rental property cost breakdown uses plain text for "Calculating for: First-Time Buyer" which appears unstyled compared to the purchase and project pages that use the full `PersonalizationHeader` component with a gray box background and signup nudge.

## Solution
Replace the plain text personalization line in the rental section with a styled component that matches the guest experience from `PersonalizationHeader`, but simplified since rentals don't need mortgage configuration options.

## Changes

### File: `src/components/property/PropertyCostBreakdown.tsx`

**Replace lines 286-290** (the plain text personalization for rentals):

Current code:
```tsx
{!isLoading && (
  <div className="text-sm text-muted-foreground">
    Calculating for: <span className="font-medium text-foreground">{getBuyerCategoryLabel(buyerCategory)}</span>
  </div>
)}
```

New code:
```tsx
{!isLoading && (
  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span className="text-muted-foreground">
          Calculating for:{' '}
          <span className="font-medium text-foreground">{getBuyerCategoryLabel(buyerCategory)}</span>
        </span>
      </div>
      {!user && (
        <p className="text-xs text-muted-foreground mt-1">
          Your situation different?{' '}
          <Link to="/auth?tab=signup" className="text-primary hover:underline">
            Get accurate estimates for your situation →
          </Link>
        </p>
      )}
    </div>
  </div>
)}
```

**Additional imports needed at the top of the file:**
- `Info` from lucide-react (already imported)
- `Link` from react-router-dom (already imported)
- `useAuth` hook (already imported)

**Get user from useAuth:**
Add `const { user } = useAuth();` inside the component (if not already present)

## Visual Result

Before (plain text):
```
Calculating for: First-Time Buyer
```

After (styled gray box with signup nudge for guests):
```
┌──────────────────────────────────────────────────────┐
│ ⓘ Calculating for: First-Time Buyer                 │
│   Your situation different? Get accurate estimates → │
└──────────────────────────────────────────────────────┘
```

## Why This Approach
- **Matches existing design**: Uses the same `bg-muted/50 border border-border/50` styling as the purchase PersonalizationHeader
- **Adds signup nudge**: Encourages guest conversion with a subtle CTA
- **Keeps it simple for rentals**: No mortgage toggle or complex configuration needed
- **Consistent with project pages**: Provides visual parity across property types
