
## Beef Up Guides and Content with Harvested Knowledge Base

The uploaded PDF contains a comprehensive extraction from NativeIsrael, SellingIsrael, and Nefesh B'Nefesh covering buying, renting, mortgages, taxes, due diligence, and move-in logistics. Here is where the new data fills gaps or sharpens existing content without adding new pages.

---

### 1. Mortgages Guide (`MortgagesGuide.tsx`)

**Enhance `howMortgagesDiffer` array with specific data points:**
- Add entry: "Mortgage sub-loan flexibility" -- Israeli mortgages can combine multiple sub-loans (prime-linked, CPI-linked, fixed, foreign-currency), each with different terms. This flexibility is uncommon in the US/UK.
- Add entry: "No rate locks" -- Mortgage lenders rarely offer rate locks; interest rates can change before closing, so borrowers should plan for fluctuations.
- Add entry: "Zakaut mortgage for Olim" -- Government-subsidised loan available within 15 years of immigrant status; fixed inflation-linked rate (~3%), no prepayment penalty.
- Enhance existing "Buyer status determines LTV limits" entry: add that some lenders offer up to 70% for strong foreign profiles (not just flat 50%).
- Enhance "Pre-payment penalties" entry: specify that fixed-rate loans up to 20 years exist but may incur significant penalties if rates drop.
- Add entry: "Foreign-currency loans" -- denominated in USD/EUR with interest based on LIBOR + premium; matches income currency but carries exchange-rate risk.

**Enhance `commonAssumptions` array:**
- Add: "Mortgage offers stay valid indefinitely" -- in reality, rates can shift before closing.

**Update the `processSteps` array step 1:**
- Change "Consult banks or mortgage brokers" detail to include: "Foreigners generally need 50% down and should gather: passport, proof of income, credit report, bank statements, and signed purchase agreement."

---

### 2. Rent vs Buy Guide (`RentVsBuyGuide.tsx`)

**Enhance `rentingAspects` array with specific data from PDF:**
- Update "Lease Norms" description: add that Israeli leases often include only the bare apartment -- appliances, lighting fixtures and furnishings are usually excluded unless explicitly listed.
- Update "Security Deposits" description: add that deposits must be returned within 60 days of lease end; deposits can be cash, post-dated cheques, or bank guarantees.
- Add entry: "Landlord Repair Obligations" -- Landlords must fix structural issues (leaks, mold, safety) within a reasonable time, not later than 30 days from notification. Tenants must repair damages caused by unreasonable use.
- Add entry: "Brokerage Agreements" -- Brokers may ask tenants to sign a brokerage agreement before viewing an apartment; once signed, the fee is due if the tenant proceeds. Clarify who pays before signing.

---

### 3. Purchase Tax Guide (`PurchaseTaxGuide.tsx`)

**Enhance `termsData` array:**
- Update "Aliyah Benefit" reality text: add that the benefit must be claimed within 7 years of aliyah date, and the Zakaut-eligible window is 15 years.
- Add entry for "Capital Gains Tax (Mas Shevach)" -- applicable when selling; rate depends on profit and holding period. Late payment interest can reach 5% monthly.
- Add entry for "Betterment Levy (Heitel Hashbacha)" -- municipal tax on value increase due to building rights; must be paid before transfer of title. Outstanding levies can block registration.

**Enhance `commonAssumptions` array:**
- Add: "They think off-plan and resale transactions are taxed the same way" (already exists, good)
- Add: "They underestimate late payment penalties -- interest up to 5% monthly on unpaid capital gains tax"

---

### 4. True Cost Guide (`TrueCostGuide.tsx`)

**Enhance `costCategories` array -- Renovation entry:**
- Replace generic description with specific renovation cost benchmarks from the PDF: repainting (~NIS 4,000), flooring (~NIS 15-22k), bathrooms (~NIS 25-30k). Budget 5-10% of purchase price.

**Enhance `surprises` array:**
- Add: "Ignoring currency risks when taking foreign-currency mortgages; exchange-rate shifts can offset any tax savings"
- Add: "Failing to budget for renovation and furnishing, which can add tens of thousands of shekels"

---

### 5. Buying in Israel Guide (`BuyingInIsraelGuide.tsx`)

**Enhance section "2. Legal Framework":**
- Add detail about freehold vs leasehold: "Two main ownership types exist: freehold (full ownership of land and building) and leasehold (long-term lease of state-owned land, usually up to 99 years, while owning the building). For leasehold, resale or renovation may require approval from the Israel Land Authority."
- Add: "Israeli property deals are only legally binding once a written contract is signed and registered; verbal agreements or messages carry no legal weight."

**Enhance section "5. Purchase Process":**
- Add step about He'arat Azhara: "Your lawyer should file a cautionary note (He'arat Azhara) in the Tabu immediately after signing to protect your rights before final registration."
- Add: "Title transfer can take months after receiving keys. Final registration requires tax clearances and municipal certificates; funds should be held in escrow until completion."

**Enhance section "8. Making an Offer":**
- Add red flag items: "Seller cannot provide proof of ownership or Tabu extract" and "Pressure to sign a 'verbal deal' without legal review" and "Developer asking for more than 7% deposit without offering legally required safeguards."

---

### 6. New vs Resale Guide (`NewVsResaleGuide.tsx`)

**Enhance new construction section details:**
- Add: "Developers are prohibited from collecting more than 7% of the price without offering one of five legal safeguards: bank guarantee, insurance, first mortgage, warning notice in the registry, or transfer of property rights."
- Add: "Payments must be made via vouchers issued by the financing bank into a designated project account."

**Enhance `surprises` array:**
- Add: "Not knowing that the developer must provide one of five legal safeguards before collecting payments over 7%"

---

### 7. Talking to Professionals Guide (`TalkingToProfessionalsGuide.tsx`)

**Enhance `lawyerDetails.responsible` array:**
- Add: "Verify the property has proper building permits (Heter B'nia) and occupancy permits (Tofes 4)"
- Add: "Hold funds in escrow until seller produces tax clearance certificates and municipal approvals"

**Enhance `mortgageDetails` section:**
- Add to timeline: "Mortgage approval for foreigners takes about 4-6 weeks"
- Add to eligibility: "Required documents include valid passport, proof of income, credit report, bank statements, and signed purchase agreement"

---

### 8. Project FAQ (`ProjectFAQ.tsx`)

**Add one new FAQ entry:**
- "What legal protections exist for off-plan buyers?" -- Answer covering the five safeguard types (bank guarantee, insurance, first mortgage, warning note, property rights transfer), the 7% threshold, and the requirement for developer declaration within 7 days of signing.

---

### Files to Modify

| File | Enhancement |
|------|------------|
| `src/pages/guides/MortgagesGuide.tsx` | Add sub-loan flexibility, no rate locks, Zakaut, foreign-currency loans; enhance LTV and penalty details |
| `src/pages/guides/RentVsBuyGuide.tsx` | Add bare apartment norms, deposit return timeline, landlord repair obligations, brokerage agreements |
| `src/pages/guides/PurchaseTaxGuide.tsx` | Add capital gains tax and betterment levy terms; late payment penalty warning |
| `src/pages/guides/TrueCostGuide.tsx` | Add specific renovation cost benchmarks; add currency risk and renovation budget surprises |
| `src/pages/guides/BuyingInIsraelGuide.tsx` | Enhance legal framework with freehold/leasehold details; add escrow and He'arat Azhara details; add red flags |
| `src/pages/guides/NewVsResaleGuide.tsx` | Add developer safeguard requirements and payment voucher details |
| `src/pages/guides/TalkingToProfessionalsGuide.tsx` | Add permit verification and escrow to lawyer duties; add timeline and docs to mortgage section |
| `src/components/project/ProjectFAQ.tsx` | Add new FAQ about off-plan legal protections |

### What Won't Change
- No new pages or routes
- No new dependencies
- No structural or layout changes
- Existing section patterns and card styles preserved
- All additions are data-level enhancements to existing arrays and content blocks
