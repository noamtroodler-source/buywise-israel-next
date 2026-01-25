
# Fix Password Toggle (Eye Icon) Not Working

## Problem

The eye icon button to show/hide the password in the `PasswordStrengthInput` component is visible but not responding to clicks. This affects the main Auth page and potentially any other places using password inputs.

---

## Root Cause Analysis

Looking at the current implementation in `src/components/auth/PasswordStrengthInput.tsx`:

```tsx
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
  tabIndex={-1}
  aria-label={showPassword ? 'Hide password' : 'Show password'}
>
```

**Potential issues:**
1. Missing `z-index` - the button might be behind an invisible overlay
2. Missing `pointer-events` - ensuring clicks are captured
3. The button might need explicit sizing/padding to expand the clickable area

---

## Solution

Update the `PasswordStrengthInput` component with these fixes:

### 1. Add z-index and pointer-events to the button

```tsx
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
  tabIndex={-1}
  aria-label={showPassword ? 'Hide password' : 'Show password'}
>
```

**Changes:**
- Added `z-10` to ensure the button is above any overlaying elements
- Added `p-1` padding to increase the clickable area
- Added `focus:outline-none` for cleaner focus states (already has aria-label for accessibility)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/auth/PasswordStrengthInput.tsx` | Add z-index, padding, and focus styles to the toggle button |

---

## Verification

After the fix:
1. The password toggle should work on `/auth?tab=signup`
2. The password toggle should work on `/auth` (sign in)
3. All professional signup flows will automatically benefit since they redirect to the Auth page

No other files need changes since:
- Agent, Agency, and Developer registration forms don't have password fields
- They redirect unauthenticated users to `/auth` with the proper role context
- The fix in the shared `PasswordStrengthInput` component will apply everywhere it's used
