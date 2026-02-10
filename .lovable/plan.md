

# Fix: Wire Up the Heart/Favorite Button on Project Detail Page

## The Problem
The `ProjectHero` component has a heart button that accepts `onSave` and `isSaved` props, but the `ProjectDetail` page never passes them. The button renders but does nothing when clicked.

## The Fix
Import `useProjectFavorites` in `ProjectDetail.tsx` and pass the appropriate props to `ProjectHero`.

---

## Technical Details

**File: `src/pages/ProjectDetail.tsx`**

1. Import `useProjectFavorites` hook
2. Call the hook to get `toggleProjectFavorite` and `isProjectFavorite`
3. Pass `onSave` and `isSaved` to the `ProjectHero` component:

```tsx
// Add import
import { useProjectFavorites } from '@/hooks/useProjectFavorites';

// Inside the component, after existing hooks:
const { toggleProjectFavorite, isProjectFavorite } = useProjectFavorites();

// Update ProjectHero usage:
<ProjectHero 
  project={project} 
  onSave={() => toggleProjectFavorite(project.id)}
  isSaved={isProjectFavorite(project.id)}
/>
```

That's it -- a 3-line change. The heart button will then toggle favorites using the existing `useProjectFavorites` hook (which already supports both logged-in users and guests via sessionStorage).

