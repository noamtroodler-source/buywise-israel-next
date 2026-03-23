

# Site Review Fixes — Phased Implementation Plan

## Summary of All Issues (Excluding Deferred Items)

Based on the comprehensive site review, here are all actionable items organized into 4 phases. The deferred items (city data issues, empty floor plans, non-Israeli stock photos, mock data disclaimer) are excluded per your request.

---

## Phase 1: Critical Fixes (Immediate)

### 1.1 Google Analytics Placeholder
**Problem:** GA4 tag uses "G-XXXXXXXXXX" — zero data collection.
**Fix:** Ask you for your real GA4 Measurement ID, then replace it in `index.html` and `src/lib/analytics.ts`.
**Files:** `index.html`, `src/lib/analytics.ts`

### 1.2 Project Amenity Raw Strings
**Problem:** Amenities display as `ev_charging`, `security_24_7` instead of "EV Charging", "24/7 Security" on public project detail pages.
**Fix:** `ProjectAmenities.tsx` (line 100) displays `{amenity}` raw. Add the same `amenityLabels` lookup map that already exists in 5 other files (admin, wizard, review). Centralize it into a shared util and use it in the display component.
**Files:** New `src/lib/utils/amenityLabels.ts`, update `src/components/project/ProjectAmenities.tsx` + deduplicate from admin components.

### 1.3 Mortgage Calculator Currency Bug
**Problem:** The calculator does all math in NIS (property price ₪2,750,000 → loan → monthly payment). But `formatCurrency` (from `useFormatPrice`) converts NIS→USD when user has USD preference, making payments appear ~3.6x too high. Meanwhile `formatCurrencyRange` does NOT convert — just slaps on whatever symbol is passed. Result: inconsistent and overstated payments.
**Fix:** The mortgage calculator should work entirely in NIS internally and clearly label all outputs as NIS. When user has USD preference, show a secondary USD equivalent. Replace raw `formatCurrencyRange` calls with the preference-aware `useFormatPriceRange` hook, or make the calculator explicitly NIS-only with a conversion note.
**Files:** `src/components/tools/MortgageCalculator.tsx`, `src/components/tools/shared/ResultRange.tsx`

### 1.4 Affordability Calculator Input Bug
**Problem:** Income field appends values instead of replacing — typing "15000" into "25,000" yields "2,500,015,000". The `value={formatNumber(monthlyIncome)}` + `onChange` pattern fights cursor position.
**Fix:** Replace raw `<Input>` fields with the existing `FormattedNumberInput` component (already used in `InvestmentReturnCalculator.tsx`) which properly handles formatted number input with commas.
**Files:** `src/components/tools/AffordabilityCalculator.tsx`

---

## Phase 2: SEO & Routing Fixes

### 2.1 Add `/tools/total-cost` Route
**Problem:** `/tools/total-cost` returns 404. Existing redirects cover `total-cost-calculator` and `true-cost` but not `total-cost`.
**Fix:** Add `<Route path="/tools/total-cost" element={<Navigate to="/tools?tool=totalcost" replace />} />` to App.tsx.
**Files:** `src/App.tsx`

### 2.2 Canonical Tags on All Pages
**Problem:** Many pages already have `canonicalUrl` passed to `useSEO` (Index, Listings, PropertyDetail, ProjectDetail, Guides, Professionals, Privacy, etc.). But some pages are missing it.
**Fix:** Audit all pages using `useSEO` and ensure every page passes a `canonicalUrl`. Add canonical to pages that are missing it (Blog, Glossary, Tools, Areas, Contact, Terms, agent/developer pages).
**Files:** Multiple page files under `src/pages/`

### 2.3 JSON-LD Structured Data Gaps
**Problem:** Review says no Organization/WebSite/BreadcrumbList schema detected on homepage. However, `src/lib/seo/jsonLd.ts` already exports `generateHomepageJsonLd`, `generateOrganizationJsonLd`, etc. — and `Index.tsx` uses `generateHomepageJsonLd()`. Need to verify these are actually rendering correctly and add BreadcrumbList to key pages.
**Fix:** Verify homepage JSON-LD renders in DOM. Add BreadcrumbList to property detail, project detail, city pages, and guide pages. Ensure Organization schema is on every page (via layout or homepage).
**Files:** `src/lib/seo/jsonLd.ts`, `src/lib/seo/useSEO.ts`, page files

### 2.4 Meta Description Length
**Problem:** Meta description may exceed 160 characters and get truncated.
**Fix:** Audit and trim meta descriptions across all pages to ≤155 characters.
**Files:** Multiple page files

---

## Phase 3: Data & Content Polish

### 3.1 Jerusalem Region Classification
**Problem:** Jerusalem and surrounding cities (Beit Shemesh, Efrat, etc.) are grouped under "Central" on the Areas page, but Jerusalem is its own administrative district.
**Fix:** Create a new "Jerusalem & Hills" region in `src/pages/Areas.tsx`, moving Jerusalem, Beit Shemesh, Efrat, Gush Etzion, Ma'ale Adumim, and Mevaseret Zion out of "Central". Also update `src/components/home/RegionExplorer.tsx` if it has a similar grouping.
**Files:** `src/pages/Areas.tsx`, `src/components/home/RegionExplorer.tsx`

### 3.2 City Name Standardization
**Problem:** Inconsistent transliterations — "Modiin" vs "Modi'in", "3 Room apartment" vs "3-Room Duplex".
**Fix:** This is partially a database issue (listing titles), but the Areas page and any hardcoded references should use consistent names with proper transliteration (Modi'in, Ra'anana, Ma'ale Adumim). Already correct in Areas.tsx — check other references.
**Files:** Audit across components

### 3.3 Currency Display Standardization Across Tools
**Problem:** Different tools use $ for both USD and NIS. Buy listings show USD, projects show NIS.
**Fix:** Ensure all calculators clearly label the currency (₪ for NIS, $ for USD) and show the user's preferred currency with proper conversion. The key issue is `formatCurrencyRange` in `ResultRange.tsx` — it takes a raw symbol but doesn't convert. Update it to be preference-aware or deprecate it in favor of `useFormatPriceRange`.
**Files:** `src/components/tools/shared/ResultRange.tsx`, all calculator files

---

## Phase 4: Footer & Minor Polish

### 4.1 Social Media Links in Footer
**Problem:** No social media links anywhere.
**Fix:** Add social media icon links (Instagram, Facebook, LinkedIn, YouTube — whichever you have) to the Footer's contact section.
**Files:** `src/components/layout/Footer.tsx`

### 4.2 Accessibility: Chat Widget ARIA Labels
**Problem:** Chat widget missing aria-labels.
**Fix:** Add `aria-label` to the AskBuyWise floating button.
**Files:** `src/components/shared/AskBuyWise.tsx` (or similar)

### 4.3 Contradictory Project Timeline
**Problem:** "Started: TBD" with completion Feb 2027.
**Fix:** Add validation logic — if `construction_start` is null/TBD but completion date is < 12 months away, show a disclaimer or adjust display. This is partially a data issue but the UI should handle the inconsistency gracefully.
**Files:** `src/components/project/ProjectTimeline.tsx` or equivalent

---

## Implementation Order

Phases 1 → 2 → 3 → 4, tackling each issue within the phase sequentially. Phase 1 is the most critical for credibility. Phase 2 is important for SEO before any marketing push. Phase 3 is polish. Phase 4 is low-priority cleanup.

**Note:** For item 1.1 (Google Analytics), I'll need your GA4 Measurement ID to complete the fix.

