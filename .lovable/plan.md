
# Fix: "Comparison AI Summary" Not Working

## Root Cause

The `generate-comparison-summary` edge function is **not deployed** (returning 404). This is why you see "Unable to generate AI summary" with the "Try again" link.

## Evidence

| Check | Result |
|-------|--------|
| Edge function curl test | `404 NOT_FOUND` |
| Edge function logs | Empty (never called) |
| Function code exists | ✓ `supabase/functions/generate-comparison-summary/index.ts` |

## Solution

Deploy the edge function. The code is correct and complete - it just needs to be deployed to be accessible.

```
Deploy: generate-comparison-summary
```

## After Fix

Once deployed, the Comparison AI Summary component will:
1. Call the edge function successfully
2. Receive the AI-generated 3-4 sentence analysis
3. Display the comparison summary with winner breakdown pills

---

## Summary

| Action | Detail |
|--------|--------|
| Deploy | `generate-comparison-summary` edge function |
| Code changes | None needed |

**Effort:** 1 minute
