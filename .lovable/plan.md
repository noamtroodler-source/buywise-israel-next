

# Phase 4: Labeling & Transparency — Structural Changes

This phase addresses data presented as fact when no authoritative source exists, adding proper disclaimers, labels, and methodology disclosures across the platform.

---

## 1. Arnona Estimates — Add "BuyWise estimate" label (3 files)

Arnona rates displayed as single figures per city lack zone-level granularity. Add estimate disclaimers:

- **`src/components/city/CityArnonaCard.tsx`** — Add "(est.)" after "Monthly Estimate" label and a footnote: "BuyWise estimate based on municipal rate tables. Actual rates vary by zone and property classification."
- **`src/components/city/MarketOverviewCards.tsx`** — Add "(est.)" after the arnona monthly value and same disclaimer text
- **`src/components/city/CitySourceAttribution.tsx`** — Update methodology text for "Arnona Rates" from "sourced directly from municipality rate tables and verified against government publications" to "Estimated from municipal rate tables. Actual rates vary by zone, property classification, and exemption eligibility."

## 2. Vaad Bayit — Add building-type context (2 files)

Replace single-figure fallbacks with range context:

- **`src/components/tools/TotalCostCalculator.tsx`** — Already has "(est.)" from Phase 2. Add tooltip: "Typical ranges: Walk-up ₪80–150, Elevator ₪150–400, Luxury ₪800–2,000+/mo"
- **`src/components/property/PropertyValueSnapshot.tsx`** — Add "(est.)" label and same building-type tooltip to vaad bayit display

## 3. "25-Year Appreciation" Claims — Add editorial caveat (database)

16 city_market_factors rows claim "25-Year X% Appreciation" with year-2000 baselines. CBS city-level data only begins ~2017.

**Action:** UPDATE all 15 rows with title ILIKE '%25-year%' to prepend description with: "Editorial estimate — CBS city-level data begins ~2017. Year-2000 baselines are approximated from regional indices and historical records. "

This preserves the data while being transparent about methodology.

## 4. Rental Ranges — Add "Indicative" label (2 files)

- **`src/components/city/CityQuickStats.tsx`** — Add small text under rent display: "Indicative — based on CBS averages and listing data"
- **`src/components/city/CitySourceAttribution.tsx`** — Already says "derived from active listings analysis and CBS rental surveys" — update to add "Indicative ranges" prefix

## 5. Yield Percentages — Add methodology disclosure (2 files)

- **`src/components/shared/BuyWiseEstimateBadge.tsx`** — Enhance tooltip to include formula: "Gross yield = (annual rent ÷ purchase price) × 100. Inputs: median 4-room rent and median purchase price from verified sources."
- **`src/components/city/CitySourceAttribution.tsx`** — Expand "Yield Calculations" methodology: "Gross yield = (avg annual rent ÷ median purchase price) × 100. Net yield deducts ~25% for arnona, vaad bayit, maintenance, and vacancy. Inputs sourced from CBS and listing platforms."

## 6. Renovation Cost Estimator — Add source label (1 file)

- **`src/components/tools/RenovationCostEstimator.tsx`** — Update InfoBanner to: "Prices based on CBS construction cost index, contractor market research, and industry surveys (2024–2025). Ranges reflect typical quotes — get 3+ estimates for your specific project."

## 7. Anglo Presence — Already labeled (verify only)

Phase 2 already added "Editorial assessment by BuyWise" to `AngloFriendlinessScore.tsx`. No further changes needed.

## 8. Investment Score — Label as proprietary (1 file + database consideration)

`investment_score` exists in the DB and admin editor but does NOT appear in any public-facing component. It's admin-only metadata.

- **`src/components/admin/CityEditor.tsx`** — Add helper text: "Proprietary BuyWise score — not displayed publicly" next to the Investment Score field

---

## Execution Order

1. Arnona estimate labels (CityArnonaCard, MarketOverviewCards, CitySourceAttribution)
2. Vaad Bayit building-type tooltips (TotalCostCalculator, PropertyValueSnapshot)
3. 25-year appreciation caveats (database UPDATE on 15 city_market_factors rows)
4. Rental "Indicative" labels (CityQuickStats, CitySourceAttribution)
5. Yield methodology disclosure (BuyWiseEstimateBadge, CitySourceAttribution)
6. Renovation source label update (RenovationCostEstimator)
7. Investment score admin label (CityEditor)

