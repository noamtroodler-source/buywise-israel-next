

# Auto-Fill Contact Form for Logged-In Users

## Overview

Pre-populate the name and email fields on the Contact page for authenticated users using their profile and auth data.

## Current State

The Contact page (`src/pages/Contact.tsx`) has a form with:
- `name` field (empty by default)
- `email` field (empty by default)
- `category` dropdown
- `message` textarea

## Implementation

### Data Sources

| Field | Source | Hook |
|-------|--------|------|
| Name | `profile.full_name` | `useProfile()` |
| Email | `user.email` | `useAuth()` |

### Code Changes

**File: `src/pages/Contact.tsx`**

1. **Import hooks** at the top:
```tsx
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
```

2. **Add hooks** inside the component:
```tsx
const { user } = useAuth();
const { data: profile } = useProfile();
```

3. **Add useEffect** to pre-fill form when data loads:
```tsx
import { useState, useEffect } from "react";

// Inside component, after hooks:
useEffect(() => {
  if (profile?.full_name || user?.email) {
    setFormData(prev => ({
      ...prev,
      name: prev.name || profile?.full_name || '',
      email: prev.email || user?.email || '',
    }));
  }
}, [profile?.full_name, user?.email]);
```

The logic uses `prev.name || ...` to ensure:
- If user has already typed something, don't overwrite it
- Only auto-fill if the field is empty
- Gracefully handle async loading of profile/user data

## User Experience

| User Type | Behavior |
|-----------|----------|
| Guest | Form starts empty (current behavior) |
| Logged in, has profile | Name and email pre-filled |
| Logged in, no profile name | Email pre-filled, name empty |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Contact.tsx` | Add useAuth, useProfile hooks and useEffect for auto-fill |

## Summary

Simple enhancement that makes the contact form friendlier for logged-in users by eliminating redundant data entry. The implementation respects user input (won't overwrite if they've started typing) and handles the async nature of profile data loading.

