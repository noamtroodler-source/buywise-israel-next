

## Plan: Clean Up "Talking to Professionals" Guide

### What to Remove (4 sections cut)

1. **"Core Reframe" box** (lines 393-408) — Vague therapy-speak. The overview already says the same thing.

2. **"What Prepared Actually Means" section** (lines 713-738) — Generic platitudes ("understanding that commitments solidify quickly"). The rest of the guide already teaches this. Redundant.

3. **"How BuyWise Helps" section** (lines 740-777) — Self-promotional. Violates the no-fluff editorial standard.

4. **"Calm Closing Reframe" section** (lines 779-800) — Repeats the overview message a third time. Heart icon + inspirational quote = fluff.

### What to Remove (data arrays)
- `preparednessPoints` array
- `buywiseHelps` array

### What to Trim

5. **"Buyer Status Reality Check"** — This overlaps with the Complete Buying Guide which already covers buyer types. **Cut it entirely.** The mortgage section already notes that eligibility varies by status, and the Mortgage Guide goes deep. Remove `buyerStatuses` array.

6. **Misinterpretations** — Merge items 1+9 ("confidence vs certainty" and "standard practice vs law" → both about taking statements at face value). Merge items 3+8 ("professionals don't coordinate" and "expecting alignment" → same point about siloed professionals). Cut from 10 → 7 items.

7. **Mortgage sub-section** — Trim the "eligibility" details (foreign buyer docs, Olim terms) since the Mortgage Guide covers this exhaustively. Keep only timeline + "why later" boxes. Add a cross-link: "See our Mortgage Guide for eligibility details →"

### What to Update

8. **Nav sections** — Reduce from 8 to 4: `Overview`, `Why It Feels Different`, `The Roles`, `Common Misreads`

9. **Hero** — Change "9 sections" → "4 sections", "Updated 2025" → "Updated 2026". Remove the subtitle line ("Preparing to Speak with Israeli Real Estate Professionals") — the h1 already says this.

10. **Overview intro** — Replace the vague 3-card pain points + CTA box with a single concise paragraph: explain that Israeli real estate pros operate on different incentives/timelines than what international buyers expect, and this guide maps those differences so you're not caught off guard.

### Summary of Structure After Changes

```text
1. Hero (trimmed)
2. Overview (one clear paragraph, no cards)
3. Why Conversations Feel Pressured (6 cards — unchanged)
4. The Roles (Agents, Lawyers, Mortgage — mortgage trimmed, cross-link added)
5. Common Misreads (7 items, merged from 10)
6. Bottom CTAs (unchanged)
```

~850 lines → ~550 lines. No new components. Same file, same design patterns, just less repetition.

