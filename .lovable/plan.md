

# Phase 1: Critical Data Accuracy Fixes

Based on the Perplexity audit report (10 critical errors, 10 significant errors), this phase addresses all items that pose financial/legal risk or contain demonstrably false data.

---

## What's being fixed

### Group A: Mortgage & Tax Calculation Errors (3 files)

**1. PTI cap: 40% → 50%**
- `src/lib/calculations/constants.ts` — `MAX_PTI: 0.40` → `0.50`, update comment to explain 40% is risk-weight trigger, not prohibition
- `src/lib/calculations/mortgage.ts` — hardcoded `MAX_PTI = 0.40` → `0.50`, update comment
- `src/components/tools/AffordabilityCalculator.tsx` — hardcoded `MAX_PTI = 0.40` → `0.50`, update educational text from "40%" to "50%"

**2. Variable rate limit: 33.33% → 66.67%**
- `src/lib/calculations/constants.ts` — `VARIABLE_RATE_MAX_PERCENT: 0.3333` → `0.6667`, update comment to "max 2/3 variable (min 1/3 fixed)"

**3. CGT exemption period: 18 → 24 months**
- `src/lib/calculations/constants.ts` — `CAPITAL_GAINS_EXEMPT_PERIOD: 18` → `24`, update comment

**4. Nesach Tabu fee: 128.60 → 17 (electronic) / 85 (paper)**
- `src/lib/calculations/constants.ts` — `TABU_NESACH_FEE: 128.60` → `17` (electronic default), add comment noting 85 for paper
- Update registration fees: `178` → `185` for both `TABU_REGISTRATION_FEE` and `MORTGAGE_REGISTRATION_FEE`

**5. Tax bracket threshold rounding**
- `src/lib/calculations/purchaseTax.ts` — fix `20183560` → `20183565` (3 instances across first_time, oleh, upgrader brackets)
- Update file header comment from "2024" to "2025/2026 (frozen by Temporary Order)"

### Group B: Arnona Discount Swap (1 file)

**6. Disability discounts are inverted**
- `src/lib/calculations/arnona.ts`:
  - `disabled_90`: `maxPercent: 80` → `40`, update description
  - `disabled_75`: `maxPercent: 40` → `80`, update description  
  - `idf_active`: add `areaLimitSqm: 70` (was `null`)

### Group C: City Data Corrections (database updates)

**7. Critical city data fixes** — SQL UPDATE statements via insert tool:

| City | Field | Old → New |
|------|-------|-----------|
| Haifa | avg_price | 1,357,100 → 1,879,900 |
| Hadera | avg_price | 1,662,500 → 2,032,700 |
| Jerusalem | socioeconomic_index | 6 → 3 |
| Jerusalem | population | 970,000 → 1,050,153 |
| Beit Shemesh | socioeconomic_index | 5 → 2 |
| Beit Shemesh | population | 130,000 → 176,786 |
| Ra'anana | population | 155,000 → 82,964 |
| Ra'anana | socioeconomic_index | 9 → 8 |
| Ashkelon | population | 130,000 → 166,864 |
| Eilat | socioeconomic_index | 4 → 6 |
| Eilat | population | 69,440 → 56,004 |
| Herzliya | socioeconomic_index | 10 → 8 |
| Herzliya | population | 97,470 → 110,884 |
| Ashdod | population | 225,939 → 228,562 |
| Ashdod | socioeconomic_index | 6 → 5 |
| Givat Shmuel | socioeconomic_index | 9 → 8 |
| Hadera | socioeconomic_index | 5 → 6 |
| Kfar Saba | population | 110,456 → 99,410 |
| Ma'ale Adumim | socioeconomic_index | 7 → 6 |
| Modi'in | socioeconomic_index | 8 → 9 |
| Netanya | population | 278,182 → 234,813 |
| Netanya | socioeconomic_index | 7 → 6 |
| Pardes Hanna | socioeconomic_index | 6 → 7 |
| Tel Aviv | population | 432,892 → 494,900 |
| Zichron Yaakov | socioeconomic_index | 7 → 8 |
| Zichron Yaakov | population | 26,375 → 24,201 |
| Ramat Gan | population | 167,794 → 172,242 |
| Beer Sheva | population | 228,808 → 223,587 |
| Efrat | population | 11,000 → 12,114 |
| Gush Etzion | population | 40,000 → 27,812 |
| Hod HaSharon | population | 68,000 → 66,398 |
| Mevaseret Zion | population | 28,144 → 25,789 |
| Petah Tikva | population | 260,000 → 270,403 |

**8. Ashkelon false editorial claims** — UPDATE `city_market_factors` to remove "-20% decline" and "population exodus" claims, replace with verified CBS data (~-1.7% YoY)

### Group D: Directive 329 & Source References (2 files)

**9. Update Directive version references**
- `src/lib/calculations/toolSources.ts` — all "Directive 329 v11" → "Directive 329 v12", effectiveDate → '2026-02-08'
- `src/pages/guides/MortgagesGuide.tsx` — update "40%" display to "50%"

**10. Database constants update** — UPDATE `calculator_constants` table for PTI, variable rate, CGT exemption, and fee values

### Group E: Glossary Fixes (database update)

**11. Glossary corrections:**
- UPDATE `glossary_terms` — "Minhal" / "Israel Land Authority" → "Rashut Mekarkei Yisrael (RMI)" with note about 2009 rename
- UPDATE `glossary_terms` — Add TAMA 38 status note: "Program ended Aug 2024 in most cities; active in select cities until May 2026"

Also update hardcoded references:
- `src/lib/calculations/toolSources.ts` line 145: 'Israel Land Authority' → 'Israel Land Administration (RMI)'
- `src/pages/guides/BuyingPropertyGuide.tsx` line 51: update glossary entry

---

## Execution order

1. Fix code files (constants.ts, mortgage.ts, AffordabilityCalculator.tsx, arnona.ts, purchaseTax.ts, toolSources.ts, MortgagesGuide.tsx, BuyingPropertyGuide.tsx)
2. Update database `calculator_constants` values
3. Update database `cities` table (population, SEI)
4. Update database `city_market_factors` (Ashkelon claims)
5. Update database `glossary_terms` (ILA name, TAMA 38)

