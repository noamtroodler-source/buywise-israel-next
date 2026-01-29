

## Fix Agent Profile Picture Stretching

### Problem
The agent profile picture on the Agent Detail page appears stretched/distorted because the `AvatarImage` component is missing the `object-cover` CSS class, which ensures images maintain their aspect ratio and crop to fit rather than stretch.

### Solution
Add `object-cover` to the base `AvatarImage` component in `src/components/ui/avatar.tsx`. This is the cleanest fix because:
1. It applies the fix globally to all avatars in the app
2. Prevents future occurrences of this issue
3. Aligns with the established design standard mentioned in the codebase

### Implementation

**File: `src/components/ui/avatar.tsx`**

Update line 22 to add `object-cover` to the default className:

```tsx
// Before
className={cn("aspect-square h-full w-full", className)}

// After  
className={cn("aspect-square h-full w-full object-cover", className)}
```

### Technical Details
- `object-cover` is a Tailwind CSS utility that sets `object-fit: cover`
- This makes the image cover its container while maintaining aspect ratio
- Any overflow is cropped rather than squishing/stretching the image
- Components that already pass `className="object-cover"` (like `StickyContactCard`) will continue to work fine since the class will just be applied twice (harmless)

### Impact
This single-line change fixes the avatar display across:
- Agent Detail page (the reported issue)
- Admin Agents page
- Agency leaderboards
- Project sticky cards
- Any other component using the Avatar component

