
# Phase E: Pricing Page Improvements

## Overview
Enhance the pricing page with a feature comparison matrix, FAQ section, real-time promo code validation, Founding Program benefits section, social proof banner, and enterprise card redesign.

## Changes

### 1. Feature Comparison Matrix
**New file**: `src/components/billing/FeatureComparisonTable.tsx`

A responsive table showing all features across tiers for the selected entity type (agency or developer). Columns = plan tiers (Starter, Growth, Pro, Enterprise). Rows:
- Active Listings
- Team Seats
- Blog Posts / Month
- Priority Support
- Dedicated Account Manager
- Visibility Credits (monthly schedule for Founding)
- API Access

Uses the same `membership_plans` data already fetched in the Pricing page. Renders check marks, numbers, or "Unlimited" per cell. Highlighted column for "Growth" (most popular). On mobile, horizontally scrollable.

### 2. FAQ Accordion Section
**New file**: `src/components/billing/PricingFAQ.tsx`

Uses the existing `Accordion` UI component. Hardcoded questions:
- "Can I cancel anytime?"
- "How do credits work?"
- "What happens when I hit my listing limit?"
- "What's the Founding Program?"
- "Can I switch plans later?"
- "What payment methods do you accept?"

### 3. Promo Code Real-Time Validation
**Modified file**: `src/components/billing/PromoCodeInput.tsx`

Add `onBlur` validation that queries the `promo_codes` table:
- Lookup by `code`, check `is_active = true`, `valid_from <= now()`, `valid_until IS NULL OR valid_until > now()`
- On valid: show green checkmark + benefit summary text ("60-day free trial + 25% off for 10 months + monthly credits")
- On invalid: show red X + "Invalid or expired code"
- While validating: show spinner

Props change: add `validationResult` state to parent (Pricing.tsx) so validated promo data flows to checkout. The component will accept new props: `onValidated(promoData | null)` callback.

### 4. Founding Program Benefits Section
**New file**: `src/components/billing/FoundingProgramSection.tsx`

A dedicated section between plans and credits with:
- Headline: "Founding Program" with Sparkles icon
- Three benefit cards in a row:
  1. "60-Day Free Trial" -- try any plan risk-free
  2. "25% Off for 10 Months" -- after trial ends
  3. "Monthly Credits" -- 150 credits in months 1-2, then 50/mo for 10 months
- Small note: "Use code FOUNDING2026 at checkout"

### 5. Social Proof Banner
Added inline in `Pricing.tsx` between hero and plan cards:
- "Join 150+ agencies already growing with BuyWise" (placeholder count)
- Small row of avatar placeholders or building icons

### 6. Enterprise Card Redesign
**Modified file**: `src/components/billing/PlanCard.tsx`

When `isEnterprise = true`, render a distinct design:
- Gradient border (primary-to-purple)
- List of enterprise-specific features: "Unlimited everything", "Dedicated account manager", "Custom integrations", "SLA guarantee", "Priority onboarding"
- "Contact Sales" button styled as primary gradient

## Files Created
- `src/components/billing/FeatureComparisonTable.tsx`
- `src/components/billing/PricingFAQ.tsx`
- `src/components/billing/FoundingProgramSection.tsx`

## Files Modified
- `src/pages/Pricing.tsx` -- add comparison table, FAQ, founding section, social proof; pass validation callback to PromoCodeInput
- `src/components/billing/PromoCodeInput.tsx` -- add blur validation with DB lookup, show benefit summary or error
- `src/components/billing/PlanCard.tsx` -- redesign enterprise variant with gradient border and richer feature list

## Page Layout (top to bottom)
1. Hero (existing) with promo code input (now with live validation)
2. Social proof banner (new)
3. Entity toggle + billing cycle toggle (existing)
4. Plan cards (existing, enterprise redesigned)
5. Feature comparison table (new)
6. Founding Program benefits section (new)
7. Security note (existing)
8. Credit packages (existing)
9. FAQ accordion (new)

## Technical Notes
- Promo validation queries `promo_codes` table directly via Supabase client (RLS should allow read for active codes; if not, a simple `SELECT` policy will be added)
- No new database changes needed -- `promo_codes` table already has all required columns
- Comparison table data is derived from the already-fetched `membership_plans` query
- All new components are pure presentational except PromoCodeInput which gets a small async validation function
