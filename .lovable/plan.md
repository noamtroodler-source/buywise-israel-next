

# Fix "More" Dropdown Hover Glitch

## Root Cause Analysis

The glitch occurs because of how Radix UI's `DropdownMenuContent` works - it uses a **Portal** to render the dropdown content outside the DOM hierarchy (see line 59 of `dropdown-menu.tsx`). 

Here's the problem:

```text
Current DOM Structure:
┌─────────────────────────────────────┐
│ <div onMouseEnter/Leave>            │  <- Wrapper div
│   <DropdownMenu>                    │
│     <DropdownMenuTrigger>More</...> │  <- Trigger button
│   </DropdownMenu>                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ <DropdownMenuContent> (in Portal)   │  <- Rendered OUTSIDE wrapper!
│   Blog, About, Contact links        │
└─────────────────────────────────────┘
```

When you hover from the trigger to the dropdown content:

1. Mouse leaves the wrapper div
2. `onMouseLeave` fires, setting `open` to `false`
3. Dropdown closes
4. But you're still hovering over where the dropdown was
5. This causes rapid open/close cycles as the state conflicts with Radix's internal state

Additionally, there's a small gap between the trigger and the content (`sideOffset = 4`), which creates a "dead zone" where the mouse leaves the wrapper but hasn't yet reached the portal content.

## Solution

Use a **timeout-based debounce** pattern to delay closing the dropdown, allowing time for the mouse to reach the portal content. This is the standard approach for hover menus with portaled content.

## Technical Changes

**File:** `src/components/layout/Header.tsx`

1. Add a `useRef` to hold the timeout ID
2. Add a close delay (150ms) that gets cancelled if mouse re-enters
3. Clear the timeout on component unmount to prevent memory leaks

**Updated code pattern:**

```tsx
const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const handleMouseEnter = () => {
  // Cancel any pending close
  if (closeTimeoutRef.current) {
    clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }
  setMoreDropdownOpen(true);
};

const handleMouseLeave = () => {
  // Delay closing to allow mouse to reach the portal content
  closeTimeoutRef.current = setTimeout(() => {
    setMoreDropdownOpen(false);
  }, 150);
};

// In JSX - wrap both trigger AND content area
<div 
  onMouseEnter={handleMouseEnter} 
  onMouseLeave={handleMouseLeave}
>
  <DropdownMenu open={moreDropdownOpen} onOpenChange={setMoreDropdownOpen}>
    <DropdownMenuTrigger>...</DropdownMenuTrigger>
    <DropdownMenuContent 
      onMouseEnter={handleMouseEnter}  // Keep open when hovering content
      onMouseLeave={handleMouseLeave}  // Close when leaving content
    >
      ...
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

## How This Fixes the Glitch

| Action | Before (Glitchy) | After (Fixed) |
|--------|------------------|---------------|
| Mouse leaves trigger | Instantly closes | Waits 150ms before closing |
| Mouse enters content | Conflicts with closing | Cancels pending close |
| Rapid mouse movements | Rapid open/close cycles | Smooth, stable menu |
| Mouse leaves entirely | Closes (eventually) | Closes after 150ms delay |

## Cleanup

Add `useEffect` cleanup to clear the timeout when the component unmounts:

```tsx
useEffect(() => {
  return () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };
}, []);
```

## Files Modified

1. `src/components/layout/Header.tsx` - Add timeout-based hover handling with cleanup

