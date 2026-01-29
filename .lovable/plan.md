
# Add Listing-Specific Feedback Components to Rentals, Buy, and Projects Pages

## Overview

Add a dedicated feedback component to each listing page type (rentals, buy, and projects) that asks for listing-specific feedback. The component will be visually distinct but not overpowering — similar to how `ToolFeedback` works on calculator pages with its inline variant.

## Design Approach

Based on the existing `ToolFeedback` component's inline variant, I'll create a new `ListingFeedback` component that:
- Uses a gradient card style (subtle but noticeable)
- Has listing-type-specific messaging
- Links to the contact page for feedback submission
- Follows the "trusted friend" voice
- Fits naturally within the listing page layout

## Visual Preview

```
+--------------------------------------------------------------------+
|  [💬]  Have thoughts on our {rental/sale/project} listings?        |
|        Tell us what you'd like to see — your input shapes what we  |
|        add next.                                           [→]     |
+--------------------------------------------------------------------+
```

## Placement Strategy

| Page | Placement | Reason |
|------|-----------|--------|
| Listings (Rentals) | After the grid, before BackToTopButton | Natural end-of-content position |
| Listings (Buy) | After the grid, before BackToTopButton | Consistent with rentals |
| Projects | After the grid, before BackToTopButton | Consistent with other listings |

The component will only show when there ARE results (not in empty states — those already have SupportFooter).

## Implementation

### Step 1: Create `ListingFeedback` Component

Create a new component that adapts messaging based on listing type:

**File: `src/components/listings/ListingFeedback.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingFeedbackProps {
  listingType: 'rentals' | 'buy' | 'projects';
  className?: string;
}

const FEEDBACK_CONFIG = {
  rentals: {
    title: "Have thoughts on our rental listings?",
    subtitle: "Tell us what you'd like to see — your feedback shapes what we improve next.",
  },
  buy: {
    title: "How are we doing with properties for sale?",
    subtitle: "Your feedback helps us show what matters most to buyers like you.",
  },
  projects: {
    title: "Thoughts on our new development listings?",
    subtitle: "Let us know what info would help you evaluate projects better.",
  },
};

export function ListingFeedback({ listingType, className }: ListingFeedbackProps) {
  const config = FEEDBACK_CONFIG[listingType];

  return (
    <Link
      to="/contact"
      className={cn(
        "group flex items-center justify-center gap-4 py-5 px-6 rounded-xl",
        "bg-gradient-to-r from-primary/5 to-primary/10",
        "border border-primary/20 hover:border-primary/40",
        "hover:from-primary/10 hover:to-primary/15",
        "transition-all duration-300",
        className
      )}
    >
      <div className="p-2.5 rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors">
        <MessageSquare className="h-5 w-5 text-primary" />
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-semibold text-foreground">{config.title}</p>
        <p className="text-xs text-muted-foreground">{config.subtitle}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
```

### Step 2: Add to Listings.tsx (Rentals & Buy)

Insert the feedback component after the property grid (when results exist), before BackToTopButton.

**Location:** After line 230 (after the Load More button section), before the closing `</>` of the results block

```tsx
{/* Listing Feedback - only show when there are results */}
{properties.length > 0 && (
  <div className="mt-10 max-w-xl mx-auto">
    <ListingFeedback listingType={isRentals ? 'rentals' : 'buy'} />
  </div>
)}
```

### Step 3: Add to Projects.tsx

Insert the feedback component after the projects grid (when results exist), before BackToTopButton.

**Location:** After line 310 (after the Load More button section), before the closing `</>` of the results block

```tsx
{/* Listing Feedback - only show when there are results */}
{projects.length > 0 && (
  <div className="mt-10 max-w-xl mx-auto">
    <ListingFeedback listingType="projects" />
  </div>
)}
```

## Messaging Voice

All copy follows BuyWise Israel's "trusted friend" approach:
- **Conversational**: "Have thoughts on..." not "Provide feedback on..."
- **Collaborative**: "shapes what we improve" implies partnership
- **No-pressure**: No strong CTAs, just a gentle invitation

## Files to Modify

| File | Change |
|------|--------|
| `src/components/listings/ListingFeedback.tsx` | **NEW** - Listing-specific feedback component |
| `src/pages/Listings.tsx` | Add ListingFeedback after results grid |
| `src/pages/Projects.tsx` | Add ListingFeedback after results grid |

## Summary

This adds a subtle but visible feedback prompt at the end of each listing page that:
1. Uses listing-type-specific messaging
2. Links to the contact page for easy submission
3. Matches the visual style of existing ToolFeedback components
4. Only appears when there are results (empty states already have SupportFooter)
5. Stays centered and appropriately sized (max-w-xl) so it doesn't dominate the page
