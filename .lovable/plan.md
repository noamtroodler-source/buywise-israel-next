

# Adjust Mock Sold Transaction Prices for a More Balanced Market Verdict

## Problem
The listing's price/sqm is ~$25,875 ($10.35M / 400sqm). All 5 nearby comps currently have lower price/sqm ($21,786 - $25,714), making every comp show a red "Listing is X% above this sale" badge. This creates an overwhelmingly negative impression.

## Solution
Update the sold prices on the 5 mock transactions so the price/sqm spread is more balanced around the listing's $25,875/sqm:

| Address | Current Price/sqm | New Sold Price | New Price/sqm | Result |
|---------|------------------|---------------|--------------|--------|
| Dubnov 14 (280sqm) | $21,786 | $7,840,000 | $28,000 | Green: listing is *below* this sale |
| Rachel Imenu 5 (350sqm) | $24,286 | $9,450,000 | $27,000 | Green: listing ~4% below |
| Lloyd George 8 (380sqm) | $23,421 | $9,880,000 | $26,000 | Green: ~in line |
| Cremieux 12 (320sqm) | $22,500 | $7,680,000 | $24,000 | Amber: listing ~8% above |
| Emek Refaim 40 (420sqm) | $23,333 | $10,080,000 | $24,000 | Amber: listing ~8% above |

This gives 3 green and 2 amber badges -- a balanced, agent-friendly presentation that still looks honest.

## Technical Details
- 5 UPDATE statements on the `sold_transactions` table (data-only, no schema or code changes)
- The `price_per_sqm` column auto-recalculates
- The Market Verdict badge will shift from red to green ("Priced in line with recent sales") since the average comp price/sqm will be ~$25,800, nearly matching the listing
