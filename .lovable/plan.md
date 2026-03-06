

# Rent vs Buy Guide — Cleanup Implementation

## Sections to DELETE entirely

1. **"Common Assumptions" section** (lines 31-46 data, 399-426 UI) — 14 quoted clichés with no explanation of *why* they're wrong in Israel. Zero value.

2. **"Surprises" section** (lines 175-186 data, 572-598 UI) — Repeats points already in "Why It Feels Loaded" and "How Renting Works."

3. **"What This Isn't About" section** (lines 188-194 data, 600-641 UI) — Telling people what a guide *doesn't* cover is filler. The cross-links to tools/tax guide can move to the bottom CTAs.

4. **"BuyWise" section** (lines 196-217 data, 643-676 UI) — Pure self-promotion. No user value.

5. **"Calm Reframe" closing** (lines 678-705 UI) — Generic motivational copy. Replace with a short, direct closing line.

6. **Pain-point cards in Overview** (lines 349-368) — Vague statements that repeat what the intro already says.

## Sections to REWRITE

### "Why It Feels Loaded" — trim from 7 to 4 reasons
Keep only the Israel-specific ones with sharper descriptions:
- **Housing Scarcity** — specific: "In cities like Tel Aviv and Jerusalem, demand consistently outpaces supply. Apartments sell within days, creating FOMO that pushes people to buy before they're ready."
- **Cultural Ownership Norms** — specific: "In Israeli society, owning a דירה is a life milestone. Family and friends may ask 'when are you buying?' within months of arrival."
- **Weak Rental Protections** — specific: "No standard inventory process, 1-year leases with no renewal guarantee, and landlords can raise rent annually via Madad indexation."
- **Lease Culture Gaps** — specific: "Israeli leases often exclude appliances, light fixtures, even kitchen cabinets. Early termination clauses favor landlords."

### "How Buying Changes Things" — rewrite with Israel-specific content
Replace the 4 generic cards with concrete Israeli realities:
- **Currency Lock-in** — "Your mortgage will be in shekels (with CPI-linked tracks). If you earn in USD/EUR/GBP, you're taking on exchange rate risk for 15-30 years."
- **Purchase Tax Hit** — "Foreign buyers pay 8-10% purchase tax on the full price. That's money you won't recover if you sell in a few years."
- **Selling Is Slow and Expensive** — "Selling takes 3-6 months minimum, involves capital gains tax (Mas Shevach), and lawyer/broker fees. Buying is not easily reversible."
- **Vaad Bayit and Arnona** — "As an owner, you're responsible for building maintenance fees and municipal tax — costs that don't exist when renting."

### "Buyer Status" — condense into a single compact card
Merge the 4 profiles into one concise section with a short line per profile instead of full cards.

## Other fixes
- **Update nav sections** to remove deleted sections. Final nav: Overview, Why It Feels Loaded, How Renting Works, How Buying Changes Things, Buyer Status, Closing.
- **Update hero**: "10 sections" → "6 sections", "Updated 2025" → "Updated 2026".
- **Simplify Overview**: Keep only the gradient CTA box and the "One-Sentence Reality" card. Remove pain-point cards.
- **Closing**: Replace "Calm Reframe" with a single-paragraph direct summary + the existing bottom CTAs.
- **Clean up unused imports and data arrays**.

## What stays unchanged
- Hero section (design is clean)
- "How Renting Works" section (high-value, Israel-specific content)
- Bottom CTAs (useful cross-links)
- Sticky navigation (good UX)

## Result
~760 lines → ~400 lines. 4 deleted sections, 2 rewritten with real specifics, 1 condensed. Guide becomes: overview → why it's loaded → renting in Israel → buying realities → buyer status → closing + CTAs.

