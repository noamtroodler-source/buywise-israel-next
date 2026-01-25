

# Fix Broken Images in Compare Bar and Across Site

## The Problem

Looking at your screenshots, the property cards at the top of the Favorites page all show images correctly, but in the Compare Bar at the bottom, one image (the "Premium Apartment in Mevaseret Zion") appears broken or fails to load.

**Root Cause**: The `CompareBar` component (and many others) use a simple `<img>` tag without error handling:
```tsx
<img src={property.images?.[0] || '/placeholder.svg'} ... />
```

This approach has two problems:
1. If the image URL exists but fails to load (404, timeout, etc.), the browser shows a broken image icon
2. The local `/placeholder.svg` may not be as reliable as a remote fallback

Meanwhile, the `PropertyCard` component (which shows images correctly at the top) uses robust error handling with state tracking and an Unsplash fallback.

---

## Solution

Create a reusable `PropertyThumbnail` component with built-in error handling, then use it consistently across all affected components.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/shared/PropertyThumbnail.tsx` | Reusable image component with onError fallback |

## Files to Update

| File | Changes |
|------|---------|
| `src/components/property/CompareBar.tsx` | Use PropertyThumbnail for property/project images |
| `src/components/compare/ComparePropertyCard.tsx` | Use PropertyThumbnail |

---

## Technical Implementation

### New Component: PropertyThumbnail

```tsx
import { useState } from 'react';
import { cn } from '@/lib/utils';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&auto=format&fit=crop&q=60';

interface PropertyThumbnailProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function PropertyThumbnail({ 
  src, 
  alt, 
  className,
  fallbackSrc = FALLBACK_IMAGE 
}: PropertyThumbnailProps) {
  const [error, setError] = useState(false);
  
  // Use fallback if no source OR if an error occurred
  const imageSrc = (!src || error) ? fallbackSrc : src;
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={cn("object-cover", className)}
      onError={() => setError(true)}
    />
  );
}
```

### Update CompareBar (property images)

Before:
```tsx
<img
  src={property.images?.[0] || '/placeholder.svg'}
  alt={property.title}
  className="w-8 h-8 rounded object-cover"
/>
```

After:
```tsx
<PropertyThumbnail
  src={property.images?.[0]}
  alt={property.title}
  className="w-8 h-8 rounded"
/>
```

### Update CompareBar (project images)

Same pattern:
```tsx
<PropertyThumbnail
  src={project.images?.[0]}
  alt={project.name}
  className="w-8 h-8 rounded"
  fallbackSrc="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400"
/>
```

### Update ComparePropertyCard

```tsx
<PropertyThumbnail
  src={property.images?.[0]}
  alt={property.title}
  className="w-full h-full"
/>
```

---

## Why This Works

| Scenario | Before | After |
|----------|--------|-------|
| Image URL is null/undefined | Falls back to `/placeholder.svg` | Falls back to Unsplash image |
| Image URL exists but 404s | Shows broken image icon | Catches error, shows Unsplash fallback |
| Image URL is empty string | Might show broken image | Treated as falsy, uses fallback |
| Image loads successfully | Works | Works (no change) |

---

## Future Prevention

By using the `PropertyThumbnail` component everywhere that displays property/project images, any future image loading issues will be handled automatically. The component:

1. **Handles null/undefined sources** - Shows fallback immediately
2. **Handles load errors** - Uses onError to switch to fallback
3. **Provides consistent fallback** - Uses a reliable Unsplash URL instead of local SVG
4. **Is easy to use** - Drop-in replacement for `<img>` tags

---

## Summary

1. **Create** a reusable `PropertyThumbnail` component with error handling
2. **Replace** the fragile `<img>` tags in CompareBar with the new component
3. **Replace** the image in ComparePropertyCard as well
4. The component uses `onError` to catch load failures and switches to a reliable Unsplash fallback

This ensures images never appear broken - they either load correctly or show a nice placeholder.

