

# Fix: Old WhatsApp Button Still Showing

## Problem
The code is correct — `FloatingWhatsApp.tsx` was deleted, `AskBuyWise.tsx` is properly imported in Layout. However, the preview is still rendering the old green WhatsApp button. This is likely a stale preview cache.

The session replay confirms the old component: a green `bg-[#25D366]` button with "WhatsApp with us" and "Chat with us on WhatsApp" aria-label — none of which exist anywhere in the current codebase.

## Fix
Force a rebuild by making a trivial edit to `Layout.tsx` (e.g., adding a comment) to ensure the preview refreshes and picks up the new `AskBuyWiseButton` component. No functional changes needed — the implementation is already correct.

