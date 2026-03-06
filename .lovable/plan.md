

## Plan: Add Resale / New Construction Toggle to Cost Timeline

### What Changes
**File: `src/pages/guides/TrueCostGuide.tsx`**

1. **Add state** — `useState<'resale' | 'new_construction'>('resale')` in the component

2. **Replace single `timelineStages` array** with two arrays:

**Resale timeline (7 steps):**
| Stage | Costs | Amount |
|-------|-------|--------|
| Research & Discovery | Browse listings, compare cities... (same text) | ₪0 (free on BuyWise Israel) |
| Offer to Contract | Lawyer retainer begins. Verbal offer, negotiation, due diligence on title (Tabu extract, zoning). | ₪3,000–5,000 |
| Contract Signing | Purchase tax due within 50 days. Lawyer fees, partial agent commission. Typically 10–20% deposit. | ₪70k–200k+ (tax-dependent) |
| Mortgage Process | Appraisal, file-opening fee, optional broker fee. | ₪3,000–10,000 |
| Engineering Inspection | Pre-purchase structural inspection. Strongly recommended before final payment. | ₪2,000–5,000 |
| Closing & Key Handover | Remaining balance paid. Agent commission balance, deferred legal fees, Tabu registration. | ₪5,000–15,000 |
| Post-Closing | Arnona registration, movers, overlap payments, renovation. | ₪3,000–250,000+ |

**New Construction timeline (8 steps):**
| Stage | Costs | Amount |
|-------|-------|--------|
| Research & Discovery | Same as resale | ₪0 (free on BuyWise Israel) |
| Reservation & Sales Office | Reservation deposit to hold the unit (usually deducted from purchase price). | ₪20k–50k (refundable/deductible) |
| Contract Signing | Developer's lawyer fees (0.5–1.5% + VAT, paid by buyer). Your own lawyer fees. Purchase tax filed. First payment tranche (10–20%). | ₪40k–90k+ (legal + tax) |
| Construction-Linked Payments | Staged payments tied to milestones (foundation, structure, finishing). Linked to Construction Input Index (Madad). | Per schedule (index-linked) |
| Mortgage Process | Appraisal on the planned unit. File-opening fee. Often arranged closer to delivery. | ₪3,000–10,000 |
| Pre-Delivery Inspection | Engineer checks the finished unit against specs. Punch list (Tekufat Bedek) begins. | ₪2,000–5,000 |
| Key Handover | Final payment tranche. Agent commission if applicable. Registration with developer's lawyer. | ₪5,000–15,000 |
| Post-Delivery | Arnona registration, fit-out (new construction often delivered "bare" — no flooring, minimal kitchen). | ₪30,000–250,000+ |

3. **Add toggle UI** — A pill-style toggle (matching the guide's existing nav pill style) placed between the section subtitle and the timeline, centered. Two options: "Resale" and "New Construction". Uses `bg-primary text-primary-foreground` for selected, `text-muted-foreground hover:text-foreground hover:bg-muted` for unselected — same pattern as the sticky nav pills already in the file.

4. **Render conditionally** — The timeline section maps over whichever array matches the current toggle state. Same rendering code, just different data.

### No other files change. No database changes needed.

