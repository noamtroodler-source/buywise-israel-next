

# Purchase Tax Guide — Overhaul Plan

## Current Problems
- **Off-topic sections**: "What Listings Emphasize/Omit", "Photos Often Mislead", "How to Read a Listing" — these are about listings, not purchase tax
- **Filler**: "One-Sentence Reality" repeats the opener; "Calm Reframe" is patronizing fluff; "Common Assumptions" is 11 bullet points that largely repeat "Why Confusing"
- **Self-promotion**: "How BuyWise Adds Clarity" section
- **Missing core data**: No actual tax brackets, no worked example, no payment timeline — the guide is *about* purchase tax but never shows the numbers
- **Too long**: 12 sections, ~15 min read for a topic that should be 6 sections, ~8 min

## What Gets Removed (6 sections)
1. **"One-Sentence Reality"** — redundant with opener
2. **"What Listings Emphasize / Omit"** — belongs in a listings guide
3. **"Photos Often Mislead"** — completely off-topic
4. **"How to Read a Listing"** — off-topic (9 cards about listings)
5. **"Common Assumptions"** — merge best 4 items into "Why Confusing"
6. **"How BuyWise Adds Clarity"** — self-promotion
7. **"Calm Reframe"** — patronizing filler

## What Gets Added (3 sections)
1. **2025/26 Tax Brackets** — Actual rate tables for:
   - Single Residence (first-time): 0% → 3.5% → 5% → 8% → 10%
   - Investor/Foreign/Additional: 8% → 10%
   - Oleh Hadash: 0% → 0.5% → 8% → 10%

2. **Worked Example** — ₪2.5M apartment showing tax for each buyer type:
   - First-time: ~₪31K
   - Investor: ~₪200K
   - Oleh: ~₪12K
   - With effective rate percentages

3. **Payment Timeline** — 3-step visual:
   - Sign contract → File Form 1345 (40 days) → Pay tax (60 days)
   - Late payment interest warning

## What Gets Refined
- **"Why Confusing"**: Trim from 7 to 4 cards, absorb best assumptions content
- **Terms table**: Trim from 12 to 8, remove off-topic items (Capital Gains, Betterment Levy, Photos)
- **"Price Confusion"**: Keep but tighten to one focused paragraph
- **"Buyer Status"**: Remove "BuyWise Reality Check" label, add specific numbers per status
- **Hero**: Update to "6 sections · ~8 min read · Updated 2026"

## New Navigation
```tsx
const navSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'what-it-is', label: 'What It Is' },
  { id: 'tax-brackets', label: '2025/26 Rates' },
  { id: 'worked-example', label: 'Cost Examples' },
  { id: 'why-confusing', label: 'Why Complex' },
  { id: 'timeline', label: 'Payment Timeline' },
  { id: 'terms', label: 'Key Terms' },
  { id: 'buyer-status', label: 'Buyer Status' },
];
```

## Files Changed
- `src/pages/guides/PurchaseTaxGuide.tsx` — full rewrite of content sections

