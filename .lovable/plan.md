
# Fix Broken Project Images in ProjectsHighlight

## The Problem
The project card for "The Gardens Petah Tikva" shows a broken image icon because:
1. The Unsplash image URL (`photo-1464938050520-ef2571e0d6bf`) is no longer available/valid
2. The `ProjectsHighlight` component uses plain `<img>` tags without error handling
3. The project already has a `PropertyThumbnail` component that gracefully handles broken images with fallbacks

## The Fix
Replace the plain `<img>` tags in `ProjectsHighlight.tsx` with the `PropertyThumbnail` component, which:
- Detects when an image fails to load via `onError`
- Automatically switches to a project-appropriate fallback image
- Maintains a professional appearance even with broken URLs

## Files to Update

### `src/components/home/ProjectsHighlight.tsx`

**Add import:**
```typescript
import { PropertyThumbnail } from '@/components/shared/PropertyThumbnail';
```

**Line 91-95 - Main Project Image:**
Replace:
```tsx
<img
  src={mainProject.images?.[0] || '/placeholder.svg'}
  alt={mainProject.name}
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
/>
```
With:
```tsx
<PropertyThumbnail
  src={mainProject.images?.[0]}
  alt={mainProject.name}
  type="project"
  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
/>
```

**Lines 145-149 - Side Project Images:**
Replace:
```tsx
<img
  src={project.images?.[0] || '/placeholder.svg'}
  alt={project.name}
  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
/>
```
With:
```tsx
<PropertyThumbnail
  src={project.images?.[0]}
  alt={project.name}
  type="project"
  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
/>
```

## Result
- Broken Unsplash URLs will gracefully fall back to a professional building image
- No more broken image icons shown to users
- Consistent with the established image fallback pattern used elsewhere in the app
