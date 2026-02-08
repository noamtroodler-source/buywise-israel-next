
# Fix AI Comparison Summary Reliability

## Summary
The AI summary sometimes fails and shows an error that persists without recovering. This is caused by timing issues and lack of automatic retry when the API call fails.

---

## Root Causes Identified

**1. Race Condition with Winner Data**
- `generateSummary()` fires when `properties` arrive
- But `winnerCounts` (computed from `properties`) may still be empty or stale at that moment
- The AI receives incomplete data, potentially causing issues

**2. No Automatic Retry**
- If the edge function fails (network, cold start, rate limit), the error persists
- User must manually click "Try again" which many won't notice

**3. Dependency Array Issue**
- `generateSummary` is in the useEffect dependency array
- When `winnerCounts` updates, it recreates the callback but doesn't re-trigger the effect properly

---

## Solution

### Part 1: Fix the Timing with Proper Guards

Only call the API when data is fully ready:

```typescript
const generateSummary = useCallback(async () => {
  // Guard: Need at least 2 properties with complete data
  if (properties.length < 2) return;
  
  // Guard: Properties must have IDs (not placeholder/loading data)
  if (!properties.every(p => p.id && p.title)) return;

  setLoading(true);
  setError(null);
  // ... rest of fetch logic
}, [properties, isRental]); // Remove winnerCounts - compute fresh in the call

useEffect(() => {
  const newIds = properties.map(p => p.id).sort().join(',');
  
  // Only trigger when IDs change AND we have valid data
  if (newIds && newIds !== propertyIds && properties.length >= 2) {
    setPropertyIds(newIds);
    setSummary(null);
    generateSummary();
  }
}, [properties, propertyIds, generateSummary]);
```

### Part 2: Add Automatic Retry with Exponential Backoff

If the call fails, retry automatically (up to 2 times):

```typescript
const [retryCount, setRetryCount] = useState(0);
const MAX_RETRIES = 2;

const generateSummary = useCallback(async () => {
  if (properties.length < 2) return;
  
  setLoading(true);
  setError(null);

  try {
    // ... fetch logic
    
    if (!response.ok) {
      // Don't retry on rate limit or payment errors
      if (response.status === 429 || response.status === 402) {
        setError('AI service temporarily unavailable');
        return;
      }
      throw new Error('Failed to generate summary');
    }
    
    // Success - reset retry count
    setRetryCount(0);
    // ... handle success
  } catch (err) {
    console.error('Error generating AI summary:', err);
    
    // Auto-retry on transient failures
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      // Retry after delay (1s, then 2s)
      setTimeout(() => generateSummary(), 1000 * (retryCount + 1));
      return;
    }
    
    setError('Unable to generate AI summary');
  } finally {
    setLoading(false);
  }
}, [properties, isRental, retryCount]);
```

### Part 3: Compute winnerCounts Inside the Call

Instead of passing `winnerCounts` as a dependency (which causes stale data issues), compute it fresh at call time:

```typescript
const generateSummary = useCallback(async () => {
  if (properties.length < 2) return;
  
  // Compute winner data fresh at call time
  const freshWinnerData = properties.map(p => ({
    title: p.title,
    wins: 0 // Basic version - or compute from rows if needed
  }));
  
  const payload = {
    properties: properties.map(p => ({...})),
    isRental,
    winnerData: winnerCounts.map(w => ({ title: w.title, wins: w.wins })),
  };
  // ... rest
}, [properties, isRental, winnerCounts]);
```

### Part 4: Reset State on Property Change

Ensure clean state when properties change:

```typescript
// Reset retry count when properties change
useEffect(() => {
  setRetryCount(0);
}, [properties]);
```

---

## Summary of Changes

| Issue | Fix |
|-------|-----|
| Race condition with data | Add guards to ensure data is complete before calling |
| No auto-retry | Add exponential backoff retry (max 2 attempts) |
| Stale winnerCounts | Keep winnerCounts in deps but ensure proper timing |
| Error persists forever | Auto-retry on transient failures |

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/compare/CompareAISummary.tsx` | Add retry logic, improve guards, fix timing |

---

## Behavior After Fix

**Before:**
1. Properties load
2. API call fires immediately (maybe with stale winner data)
3. If fails → "Unable to generate" shows forever
4. User must manually click "Try again"

**After:**
1. Properties load
2. Component waits for complete data
3. API call fires with correct data
4. If fails → Auto-retry after 1s, then 2s
5. After 2 retries → Shows error with "Try again" button
6. Much more resilient to network hiccups and cold starts
