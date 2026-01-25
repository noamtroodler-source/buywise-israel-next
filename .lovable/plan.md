
# Fix: Agency Listings Page Crash

## Problem Identified

The Agency Listings page (`/agency/listings`) crashes with the error:
> "Rendered more hooks than during the previous render"

### Root Cause

In `AgencyListings.tsx`, the `useFormatPrice()` hook is called on **line 105**, which is **after** two early return statements:
- Lines 52-60: Returns loading state
- Lines 62-74: Returns "No Agency Found" state

**React's Rules of Hooks require that hooks are always called in the same order on every render.** When the component returns early (during loading or when no agency exists), the `useFormatPrice()` hook is never reached. But when data loads successfully, the hook IS called — this creates an inconsistent number of hooks between renders, causing the crash.

---

## The Fix

Move `useFormatPrice()` to the **top of the component**, before any conditional returns:

```text
Current order (broken):
  Line 43-45: useMyAgency, useAgencyTeam, useAgencyListingsManagement
  Line 47-50: useState hooks
  Line 52-74: Early returns (loading + no agency)
  Line 105:   useFormatPrice() ❌ Called AFTER early returns

Fixed order:
  Line 43-45: useMyAgency, useAgencyTeam, useAgencyListingsManagement
  Line 47-50: useState hooks
  Line 51:    useFormatPrice() ✅ Called BEFORE early returns
  Line 53-75: Early returns (loading + no agency)
```

---

## Code Change

**File:** `src/pages/agency/AgencyListings.tsx`

Move line 105:
```tsx
const formatPrice = useFormatPrice();
```

To after the useState hooks (around line 51), before the `if (agencyLoading)` check.

---

## Why This Works

After the fix:
1. All hooks are called at the top of the component
2. Hooks are called in the same order on every render
3. Early returns happen AFTER all hooks have been called
4. The component can safely render loading states, error states, or the full listings table

---

## Implementation

Single file change to `src/pages/agency/AgencyListings.tsx`:
- Move `const formatPrice = useFormatPrice();` from line 105 to line 51
- Delete the now-empty line 105

This is a one-line move that fully resolves the crash.
