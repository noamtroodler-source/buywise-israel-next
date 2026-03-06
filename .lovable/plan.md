

## Clean Up: Mortgages in Israel Guide

### Changes to `src/pages/guides/MortgagesGuide.tsx`

**Sections removed (4 cuts):**
1. **"Common Assumptions" section + `commonAssumptions` array** — 16 icon cards listing things like "pre-approval is binding." These are already addressed as explanations in the "How Mortgages Differ" section. Redundant.
2. **"Buyer Status Reality Check" section + `buyerStatuses` array** — Overlaps with the Complete Buying Guide and Professionals guide. The LTV limits by buyer type are already covered in the Differences section.
3. **"How BuyWise Adds Mortgage Clarity" section + `buywiseHelps` array** — Self-promotional. Cut per editorial standards.
4. **"Calm Closing Reframe" section** — Vague inspirational close that repeats the overview message.

**Sections merged:**
5. **"Why Non-Committal" + "Interactions"** → merged into one section called **"Timing, Commitment & Why Conversations Feel Vague"** with 4 cards: banks avoid early commitments, you negotiate without knowing your rate, payment schedule mismatches, and mortgage size affects liquidity.
6. **"Surprises" array** — Reduced from 10 to 7 by merging duplicates (pre-approval finality already in Differences; "mortgage before commitment" already in Differences; bank coordination already covered).

**Content fixes:**
7. **LIBOR → "benchmark rate"** — LIBOR is discontinued. Fixed in the foreign-currency loans item.
8. **"Pre-approval is indicative" + "No rate locks"** — Merged into one item since both say "quoted terms aren't final."
9. **DTI standardized** to "up to 40%" per Bank of Israel directives.
10. **"Work with a mortgage broker"** — moved from a standalone Differences card to a tip box under the Process section (it's advice, not a difference).

**Navigation updated:**
- From 11 nav items → **6**: Overview, Key Differences, The Process, What Banks Check, Common Surprises, Timing & Commitment

**Hero updated:**
- "11 sections" → "6 sections"
- "Updated 2025" → "Updated 2026"
- Removed the redundant subtitle line ("How It Actually Works") — the h1 already communicates this
- "~20 min read" → "~15 min read"

**Overview simplified:**
- Removed the 3 pain-point cards and gradient CTA box
- Kept only the "One-Sentence Reality" callout + one concise paragraph explaining the reversed sequence (find property → sign → then get mortgage)

**Unused imports cleaned up** — removed ~15 unused icon imports.

### Changes to `src/pages/Guides.tsx`
- Update `chaptersCount` for `mortgages` from 11 to 6.

### Result
~704 lines → ~400 lines. Same design patterns, same components. No new dependencies.

