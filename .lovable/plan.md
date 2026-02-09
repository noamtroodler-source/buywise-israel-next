

## Beef Up Guides with Brochure Content

The Gabai Real Estate brochure contains practical, expert-level details about buying property in Israel that can fill specific gaps in the existing guides. Here's what to enhance, without adding new pages or restructuring anything.

---

### 1. Complete Buying Guide (`BuyingInIsraelGuide.tsx`)

This guide currently has only 6 collapsible sections and is the thinnest of all guides despite being labeled "Complete Guide" with "14 chapters."

**Add a new section: "7. Home Inspections"**
- Specific inspection checklist from the brochure: structural integrity, current condition, quality of build, dampness and susceptibility to future dampness, plumbing status, electrical level, drainage, appliances
- Note that in Israel it is the buyer's responsibility to check and the seller's responsibility to declare issues
- Recommend hiring a licensed engineer specializing in home inspections, done after sides agree on price

**Add a new section: "8. Making an Offer"**
- Factors to consider when making an offer (from brochure): why the owner is selling, how long on market, property registration type (church lease, private), building infractions, structural issues, mortgage and payment terms, additional competing offers, carrying costs, date of occupancy, property/building restrictions
- Note about cross-referencing comparable sales from the tax authority website

**Add a new section: "9. The Walk-Through"**
- From the brochure's process checklist: on the date of last payment or occupancy, schedule a walk-through with your agent and seller, ensure property is in appropriate condition, transfer utilities and municipal taxes into your name

**Enhance existing section "4. Taxes and Purchase Costs"**
- Add the brochure's concrete benchmark: "On a $1M USD property, a local buyer pays approximately 6.5% in total costs (2.5% tax + 2% agent + 1% lawyer + 1% other). A foreign buyer pays approximately 12% (8% tax + 2% agent + 1% lawyer + 1% other)."

**Enhance existing section "3. Financing"**
- Add the detail that banks will not necessarily appraise the property for the full purchase amount, so buyers should get a realistic appraisal estimate before signing
- Add recommendation to work with a mortgage broker who can navigate the Israeli banking system

---

### 2. Talking to Professionals Guide (`TalkingToProfessionalsGuide.tsx`)

**Enhance the lawyer section** with the brochure's 4 attorney selection criteria:
- Specialization: Real estate law is not general law; tax rules and contract requirements change frequently
- Local knowledge: A Jerusalem-based attorney can expedite due diligence by knowing the right municipal contacts; understands local registration types like church leases
- Foreign buyer experience: Critical for opening escrow accounts and transferring money internationally; navigating tax regulations
- English-speaking ability: Important for international buyers

**Enhance the agent section** with specific value points:
- A good agent cross-references comparable sales from the tax authority, local MLS systems, and their own sales in the area
- They can explain why two similar properties sold for different prices (contextual insight)
- Seeing "enough but not too many" properties -- an experienced agent finds the balance

---

### 3. True Cost Guide (`TrueCostGuide.tsx`)

**Add a concrete cost summary benchmark** in the overview or a new subsection:
- Local buyer total on a ~$1M property: approximately 6.5% above purchase price (2.5% tax + 2% agent + 1% lawyer + 1% other)
- Foreign buyer total on a ~$1M property: approximately 12% above purchase price (8% tax + 2% agent + 1% lawyer + 1% other)
- This gives readers an instant mental model before diving into the details

---

### 4. Mortgages Guide (`MortgagesGuide.tsx`)

**Enhance the "How Much Can I Borrow" section** with more specific practical guidance:
- Banks will not necessarily appraise the property at the full purchase price -- get a realistic appraisal estimate before signing a sales contract
- Emphasize working with a mortgage broker to navigate the process, as mortgage products in Israel vary greatly from other countries

---

### Files to Modify

| File | Enhancement |
|------|------------|
| `src/pages/guides/BuyingInIsraelGuide.tsx` | Add 3 new sections (Inspections, Offers, Walk-Through) + enhance 2 existing sections with concrete data |
| `src/pages/guides/TalkingToProfessionalsGuide.tsx` | Enhance lawyer and agent detail sections with specific selection criteria |
| `src/pages/guides/TrueCostGuide.tsx` | Add a concrete cost benchmark card in overview |
| `src/pages/guides/MortgagesGuide.tsx` | Enhance borrowing section with appraisal and broker guidance |

### What Won't Change
- No new guide pages
- No navigation config changes
- No new dependencies
- Existing section structure and styling patterns preserved
- All new content follows the same card/list/callout patterns already used
