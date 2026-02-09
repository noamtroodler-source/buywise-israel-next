

## Audit and Clean Up Redundant Toast Notifications

### The Problem
Many toast notifications ("Property saved to favorites", "Property removed from favorites", etc.) pop up in the bottom-right corner even though the UI already clearly communicates the action -- the heart icon fills/unfills, the item appears/disappears from the list, etc. These redundant toasts add visual noise without value.

### Approach
Remove success toasts where the UI already gives clear feedback. Keep toasts where they're the only way the user knows something happened (errors, clipboard copies, form submissions, admin actions).

### Toasts to REMOVE (redundant)

| Location | Toast Message | Why Redundant |
|----------|--------------|---------------|
| `src/hooks/useFavorites.tsx` | "Property saved to favorites" (logged-in user) | Heart icon fills blue -- obvious |
| `src/hooks/useFavorites.tsx` | "Property removed from favorites" | Heart unfills; on favorites page, the card disappears |
| `src/hooks/useProjectFavorites.tsx` | "Project saved to favorites" (logged-in user) | Heart icon fills blue |
| `src/hooks/useProjectFavorites.tsx` | "Project removed from favorites" | Heart unfills; card disappears from list |
| `src/hooks/useSavedLocations.ts` | "Location saved" / "Location removed" | UI updates inline (list adds/removes item) |
| `src/hooks/useSavedCalculatorResults.tsx` | "Saved result deleted" | Item disappears from the list |
| `src/pages/Auth.tsx` | "Account created successfully!" | Onboarding dialog appears immediately after |
| `src/pages/Auth.tsx` | "Welcome back!" (on sign in) | User is redirected to their destination -- the redirect IS the confirmation |
| `src/pages/Auth.tsx` | "Welcome to BuyWise Israel!" (onboarding complete) | Post-signup suggestions dialog appears right after |
| `src/components/profile/sections/AccountSection.tsx` | "Browsing history cleared" | Button already shows loading state, then history list empties |

### Toasts to KEEP (necessary)

- **All error toasts** -- always needed since nothing else indicates failure
- **Guest favorite toasts** -- these include a "Create an account" CTA with description text, which is valuable guidance (not just confirmation)
- **Clipboard copy toasts** ("Link copied", "Questions copied") -- no other way to confirm clipboard worked
- **Auth error toasts** ("Invalid email", "already registered") -- critical feedback
- **Professional signup toast** ("Account created! Redirecting...") -- explains upcoming redirect
- **Admin/Agent/Developer dashboard toasts** -- data operations where list refresh may not be immediate or obvious
- **Blog/Project CRUD toasts** -- form-based workflows where confirmation is expected
- **Contact form submission** -- confirms the message was sent
- **WhatsApp fallback toasts** -- copy confirmations in the fallback modal

### Files to Modify

1. **`src/hooks/useFavorites.tsx`** -- Remove success toasts for logged-in add/remove; keep guest toast with CTA; keep error toasts
2. **`src/hooks/useProjectFavorites.tsx`** -- Same pattern as above
3. **`src/hooks/useSavedLocations.ts`** -- Remove "Location saved" and "Location removed" success toasts
4. **`src/hooks/useSavedCalculatorResults.tsx`** -- Remove "Saved result deleted" toast
5. **`src/pages/Auth.tsx`** -- Remove "Account created successfully!", "Welcome back!", and "Welcome to BuyWise Israel!" success toasts
6. **`src/components/profile/sections/AccountSection.tsx`** -- Remove "Browsing history cleared" toast

### What Won't Change
- No structural or layout changes
- No new components
- Error handling remains intact everywhere
- Guest favorite toasts with account creation CTAs remain

