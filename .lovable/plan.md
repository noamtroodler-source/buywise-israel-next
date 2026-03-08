

## Fix: Save prompt should only appear once per calculator session

### Problem
Currently, after dismissing the prompt, `changeCountRef` resets to 0. If the user continues making changes (2 more + 5s idle), the prompt re-triggers. It should only ever show once per calculator visit.

### Change (single file: `src/hooks/useSavePromptTrigger.ts`)

Add a `dismissedRef = useRef(false)` flag:
- Set it to `true` in `dismissPrompt` and also when `showPrompt` becomes `true` (so even if they ignore it without clicking dismiss, further changes won't queue another)
- Check `dismissedRef.current` in `trackChange` — if true, bail out immediately (same as the logged-in check)
- Remove the `changeCountRef.current = 0` reset in `dismissPrompt` since the dismissed flag handles it

This ensures the prompt fires at most once per component mount (i.e., per calculator experience). Navigating away and back remounts the hook, resetting the flag naturally.

