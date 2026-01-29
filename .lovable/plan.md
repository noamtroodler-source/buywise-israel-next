

# Fix: Pre-fill Agent Name from Google OAuth

## Problem

When users sign up via Google OAuth and then register as agents, the "Full Name" field in the agent registration form starts empty. However, Google provides the user's name in `user.user_metadata.full_name`, which should be used to pre-fill this field for a smoother experience.

## Current State Analysis

| User Type | Name Field | Pre-filled? | Source |
|-----------|-----------|-------------|--------|
| Buyer | `profiles.full_name` | Yes | DB trigger `handle_new_user` grabs from `user_metadata` |
| Agent | `agents.name` | **No** | Form starts empty |
| Agency | `agencies.name` | N/A | Company name, not personal |
| Developer | `developers.name` | N/A | Company name, not personal |

## Solution

Update `AgentRegister.tsx` to pre-fill the `name` field from `user.user_metadata?.full_name` when available (typically from Google OAuth).

## File to Modify

### `src/pages/agent/AgentRegister.tsx`

**Change 1: Initialize name from user metadata (line 26-36)**

```tsx
// Before:
const [formData, setFormData] = useState({
  name: '',
  email: user?.email || '',
  // ...
});

// After:
const [formData, setFormData] = useState({
  name: user?.user_metadata?.full_name || '',
  email: user?.email || '',
  // ...
});
```

**Change 2: Add useEffect to update when user loads (around line 24)**

Because the user might not be available on first render (async auth state), add a `useEffect` to update the name when the user becomes available:

```tsx
// Update name when user loads (for Google OAuth)
useEffect(() => {
  if (user?.user_metadata?.full_name && !formData.name) {
    setFormData(prev => ({ 
      ...prev, 
      name: user.user_metadata?.full_name || prev.name 
    }));
  }
}, [user?.user_metadata?.full_name]);
```

This mirrors the existing pattern for email (line 28):
```tsx
email: user?.email || '',
```

## Why Only Agents?

- **Agency/Developer**: The `name` field is for the company/agency name, not a personal name. These should remain empty.
- **Buyers**: Already handled by the `handle_new_user` database trigger which populates `profiles.full_name` from `user.raw_user_meta_data.full_name`.

## Result

When a user signs up with Google and registers as an agent:
- The "Full Name" field will be pre-filled with their Google profile name
- They can still edit it if needed
- Email continues to be pre-filled as before

| Scenario | Before | After |
|----------|--------|-------|
| Google OAuth → Agent Register | Name field empty | Name pre-filled from Google |
| Email signup → Agent Register | Name empty (user enters manually) | No change |

## Summary

| File | Change |
|------|--------|
| `src/pages/agent/AgentRegister.tsx` | Pre-fill `name` from `user.user_metadata?.full_name` and add useEffect to handle async user loading |

