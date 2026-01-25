
# Sync Header Auth Buttons with Auth Page Tabs

## Problem

When you're already on the Auth page and click "Sign In" or "Sign Up" in the header navigation, the form tabs don't switch. This is because the Auth page only reads the `tab` parameter once when it first loads, not when the URL changes while you're already on the page.

---

## Solution

Add a `useEffect` that watches for URL parameter changes and updates the active tab accordingly. This way, clicking the header buttons will trigger a URL change, and the Auth page will react to it.

---

## Technical Details

### Current Behavior (Line 67 of Auth.tsx)

```tsx
const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'signin');
```

This only sets the tab once on initial render. It doesn't respond to URL changes.

### Fix: Add useEffect to Watch URL Changes

```tsx
// Sync activeTab with URL parameter changes
useEffect(() => {
  const tabParam = searchParams.get('tab');
  const newTab = tabParam === 'signup' ? 'signup' : 'signin';
  if (newTab !== activeTab) {
    setActiveTab(newTab);
  }
}, [searchParams]);
```

This will:
1. Watch for any changes to `searchParams`
2. Check if the `tab` parameter has changed
3. Update the `activeTab` state to match

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add useEffect to sync activeTab with URL searchParams |

---

## User Experience After Fix

1. User is on `/auth` (Sign In tab active)
2. User clicks "Sign Up" in the header
3. URL changes to `/auth?tab=signup`
4. Auth page detects the URL change and switches to the Sign Up tab

And vice versa:
1. User is on `/auth?tab=signup` (Sign Up tab active)
2. User clicks "Sign In" in the header
3. URL changes to `/auth`
4. Auth page detects the URL change and switches to the Sign In tab

This creates a seamless experience where the header buttons always work, regardless of whether the user is already on the auth page.
