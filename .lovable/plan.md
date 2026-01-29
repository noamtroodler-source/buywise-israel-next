
# Update SupportFooter to Link to Contact Page & Enhance Prominence

## Overview

Update the `SupportFooter` component so all "reach out" links go to the `/contact` page instead of opening an email client. Also enhance the visual prominence slightly while maintaining the clean, on-brand aesthetic.

## Current State

The `SupportFooter` component creates `mailto:hello@buywiseisrael.com` links. It has 3 variants:
- **subtle**: Border-top with text (used on Profile, Favorites, NotFound)
- **inline**: Simple text paragraph (used on Tools page)
- **card**: Gradient card with icon (used on Guides page)

## Proposed Changes

### 1. Link Change: mailto → /contact

Replace all `<a href={mailtoLink}>` elements with `<Link to="/contact">` from react-router-dom.

### 2. Enhanced Visual Prominence

Make each variant slightly more noticeable while keeping them tasteful:

| Variant | Current | Enhanced |
|---------|---------|----------|
| **subtle** | Plain text with border-top | Add subtle gradient background, arrow icon, hover effect |
| **inline** | Plain paragraph text | Add light background, padding, rounded corners |
| **card** | Gradient card (already prominent) | Add arrow icon, slightly stronger hover effect |

### Visual Preview

**Subtle variant (after enhancement):**
```
╭────────────────────────────────────────────────────────────────────────────╮
│  Need help? Contact us — we're happy to assist.                       [→] │
╰────────────────────────────────────────────────────────────────────────────╯
```

**Inline variant (after enhancement):**
```
╭────────────────────────────────────────────────────────────────────────────╮
│  Need help interpreting your results? Reach out — we're happy to walk      │
│  through the numbers with you.                                        [→] │
╰────────────────────────────────────────────────────────────────────────────╯
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/shared/SupportFooter.tsx` | Replace mailto with Link to /contact, enhance styling |

## Implementation Details

### Updated SupportFooter Component

```tsx
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SupportFooterProps {
  message: string;
  linkText?: string;
  variant?: 'subtle' | 'card' | 'inline';
  className?: string;
}

export function SupportFooter({ 
  message, 
  linkText = "Contact us",
  variant = 'subtle',
  className,
}: SupportFooterProps) {
  // Parse message to extract link portion
  const renderMessage = () => {
    return message.split('[').map((part, i) => {
      if (i === 0) return <span key={i}>{part}</span>;
      const [, rest] = part.split(']');
      return (
        <span key={i}>
          <span className="text-primary font-medium">{linkText}</span>
          {rest}
        </span>
      );
    });
  };

  if (variant === 'card') {
    return (
      <Link
        to="/contact"
        className={cn(
          "group block p-5 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10",
          "border border-primary/15 hover:border-primary/30",
          "hover:from-primary/8 hover:to-primary/15",
          "transition-all duration-300 text-center",
          className
        )}
      >
        <MessageCircle className="h-6 w-6 text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-2">
          {renderMessage()}
        </p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    );
  }

  if (variant === 'inline') {
    return (
      <Link
        to="/contact"
        className={cn(
          "group flex items-center justify-between gap-4 py-4 px-5 rounded-xl",
          "bg-muted/40 hover:bg-muted/60",
          "border border-border/50 hover:border-primary/30",
          "transition-all duration-300",
          className
        )}
      >
        <p className="text-sm text-muted-foreground">
          {renderMessage()}
        </p>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </Link>
    );
  }

  // Default: subtle variant - enhanced version
  return (
    <Link
      to="/contact"
      className={cn(
        "group flex items-center justify-between gap-4 py-4 px-5 rounded-xl",
        "bg-muted/30 hover:bg-muted/50",
        "border border-border/40 hover:border-primary/25",
        "transition-all duration-300",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {renderMessage()}
      </p>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
```

## Key Changes Summary

1. **Import Link** from react-router-dom instead of using `<a href>`
2. **Remove Mail icon** (not relevant when linking to contact page)
3. **Add ArrowRight icon** to indicate navigation
4. **Wrap entire component in Link** making the whole card/area clickable
5. **Add hover effects** with color transitions and arrow movement
6. **Add background and border** to subtle/inline variants for more presence
7. **Remove mailto logic** entirely

## Usage Locations (No Changes Needed)

All existing usages will automatically work with the updated component:

- `src/pages/Tools.tsx` - "Need help interpreting your results?"
- `src/pages/Guides.tsx` - "Still have questions after reading?"
- `src/pages/Favorites.tsx` - "Not sure where to start?"
- `src/pages/Profile.tsx` - "Questions about your account?"
- `src/pages/NotFound.tsx` - "Still can't find what you need?"
- `src/pages/PropertyDetail.tsx` - "Think this is a mistake?"
- `src/pages/Listings.tsx` - Various contextual messages
- `src/components/compare/CompareEmptyState.tsx` - "Feeling unsure?"
