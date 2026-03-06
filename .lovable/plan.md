

## Plan: Consolidate Guides Page Bottom CTAs

**What changes:**
In `src/pages/Guides.tsx`, replace the three bottom CTA sections (quiz, calculators, support footer) with two blocks:

**Block 1: "What's Next?" — 3 compact cards in a row**
- Calculator icon → "Run the Numbers" → `/tools`
- Home icon → "Browse Listings" → `/listings`
- Users icon → "Find Professionals" → `/professionals`

Styled as a grid of 3 small cards (1 col on mobile, 3 on desktop), each with icon + title + short description + arrow.

**Block 2: Support Footer** — keep existing `<SupportFooter>` as-is.

**Removals:**
- Delete the "Not sure where to start?" quiz CTA section
- Delete the "Ready to run the numbers?" calculators CTA section
- Remove unused `Sparkles` and `Calculator` imports

