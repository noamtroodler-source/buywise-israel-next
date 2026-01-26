
# Delete "Understanding Israeli listing terminology" Link

## Summary
Remove the standalone "Understanding Israeli listing terminology" link that appears below the property description on property detail pages.

## File to Modify
`src/pages/PropertyDetail.tsx`

## Changes

### 1. Remove the BookOpen import (line 23)
Delete the import since it's only used for this link:
```tsx
// Remove this line
import { BookOpen } from 'lucide-react';
```

### 2. Remove the link block (lines 134-141)
Delete the entire section:
```tsx
{/* Understanding Listings Guide Link */}
<Link 
  to="/guides/understanding-listings" 
  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
>
  <BookOpen className="h-3.5 w-3.5" />
  <span>Understanding Israeli listing terminology</span>
</Link>
```

## Result
The property detail page will flow directly from the description to the AI Value Snapshot without the educational link in between.
