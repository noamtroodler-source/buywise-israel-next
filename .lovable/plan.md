

# Add Inline Name Editing to Profile Header

## Overview

Add a subtle, design-best-practice approach to let users quickly edit their name directly from the "Welcome back, [Name]" header in My Profile. This is helpful when Google OAuth captures the wrong name or users want to adjust it.

## Design Approach

A small pencil icon appears on hover next to the name. Clicking it transforms the text into an inline input field with save/cancel buttons. This pattern is:
- **Non-intrusive**: Icon only shows on hover
- **Contextual**: Edit happens right where the name appears
- **Quick**: No need to scroll down to Account Settings

## Visual Mockup

```
Before (hover state):
+------------------------------------------+
|  [Avatar]   Welcome back, John  [✏️]     |
|             user@email.com               |
+------------------------------------------+

After clicking edit:
+------------------------------------------+
|  [Avatar]   [ John Doe_______ ] [✓] [✗]  |
|             user@email.com               |
+------------------------------------------+
```

## Implementation

### File: `src/components/profile/ProfileWelcomeHeader.tsx`

**Step 1: Add state and hooks**
```tsx
import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useUpdateProfile } from '@/hooks/useProfile';

// Inside component:
const [isEditingName, setIsEditingName] = useState(false);
const [editedName, setEditedName] = useState(fullName || '');
const updateProfile = useUpdateProfile();
```

**Step 2: Create save handler**
```tsx
const handleSaveName = () => {
  if (editedName.trim()) {
    updateProfile.mutate({ full_name: editedName.trim() });
    setIsEditingName(false);
  }
};

const handleCancelEdit = () => {
  setEditedName(fullName || '');
  setIsEditingName(false);
};
```

**Step 3: Replace the static h1 with conditional edit UI**

Replace lines 67-69:
```tsx
{isEditingName ? (
  <div className="flex items-center gap-2">
    <Input
      value={editedName}
      onChange={(e) => setEditedName(e.target.value)}
      className="h-9 text-lg font-semibold max-w-[200px]"
      autoFocus
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleSaveName();
        if (e.key === 'Escape') handleCancelEdit();
      }}
    />
    <Button 
      size="icon" 
      variant="ghost" 
      className="h-7 w-7" 
      onClick={handleSaveName}
      disabled={updateProfile.isPending}
    >
      <Check className="h-4 w-4 text-green-600" />
    </Button>
    <Button 
      size="icon" 
      variant="ghost" 
      className="h-7 w-7" 
      onClick={handleCancelEdit}
    >
      <X className="h-4 w-4 text-muted-foreground" />
    </Button>
  </div>
) : (
  <h1 className="text-2xl font-semibold text-foreground group flex items-center gap-1.5">
    Welcome back, {firstName}
    <button
      onClick={() => setIsEditingName(true)}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
      aria-label="Edit name"
    >
      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  </h1>
)}
```

## UX Details

| Aspect | Behavior |
|--------|----------|
| Hover | Pencil icon fades in (opacity transition) |
| Click | Input appears with current full name |
| Enter key | Saves the name |
| Escape key | Cancels editing |
| Blur | Stays in edit mode (user may be moving to buttons) |
| Success | Toast shows "Profile updated successfully" |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/profile/ProfileWelcomeHeader.tsx` | Add inline name editing with hover-reveal pencil icon |

