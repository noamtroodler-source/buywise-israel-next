# Phased plan: remove manual Market Intelligence review infrastructure

## Goal

Move BuyWise Price Context / Market Intelligence from a manual review workflow to an automatic, confidence-based system.

The final model should be:

```text
Listing data + recorded sales + local benchmarks
        ↓
Automatic Price Context engine
        ↓
Buyer-facing guidance with confidence, limitations, and premium/luxury caution
```

Not:

```text
Agent submits listing
        ↓
Price Context marked incomplete / under review
        ↓
Admin resolves benchmark review
        ↓
Listing becomes eligible
```

## Phase 1 — Remove buyer-facing and pro-facing review UI, keep database untouched

Purpose: clean the product without risky schema changes.

### Remove from listing pages
- Remove any remaining “Market context under review” logic.
- Remove “Price Context complete,” “Needs price context,” and “Context under review” badge behavior.
- Keep the actual Market Intelligence section.
- Keep Premium/Luxury mode.
- Keep limited-data and disclaimer copy.

### Remove from agent / agency workflows
- Remove “request benchmark review” buttons/dialogs.
- Delete or disconnect `BenchmarkReviewDialog`.
- Delete or disconnect `useBenchmarkReview`.
- Remove review request fields from listing creation/edit flows:
  - `benchmark_review_status`
  - `benchmark_review_reason`
  - `benchmark_review_notes`
  - `benchmark_review_requested_at`
  - `benchmark_review_resolved_at`
  - `benchmark_review_admin_notes`
  - `benchmark_review_resolution`

### Keep useful wizard inputs
Keep fields that help the automatic engine produce better buyer guidance:
- `sqm_source`
- `ownership_type`
- `premium_drivers`
- `premium_explanation`

### Replace wizard messaging
Where the wizard currently implies Price Context needs approval/review, replace it with lightweight copy like:

> BuyWise will generate buyer-facing price context automatically from available recorded sales, listing details, and local benchmarks.

## Phase 2 — Simplify admin review and analytics

Purpose: remove the operational workflow while preserving useful admin visibility.

### Admin listing review
- Remove the Price Context benchmark review queue from admin review screens.
- If the admin review page also handles general listing quality, keep the page but remove only the Market Intelligence review parts.
- If the page exists only for Price Context review, remove the route and page.

### Admin cards and dashboards
Remove review workflow concepts from:
- Listing review cards
- Price analytics cards
- Feature flag / rollout screens if they were only managing Price Context review

Replace “review workflow” analytics with automatic-quality analytics:
- Strong context
- Limited context
- Insufficient data
- Premium/luxury context
- Percentage suppressed
- Buyer interactions with the module

## Phase 3 — Decouple rankings, featured listings, and filters from review status

Purpose: prevent hidden product behavior from depending on old manual approval fields.

### Remove old eligibility logic
Stop using:
- `price_context_badge_status`
- `benchmark_review_status`
- `price_context_filter_eligible`
- `price_context_placement_eligible`
- `price_context_featured_eligible`

### Keep ranking quality signals
Featured/listing ranking can still use automatic signals:
- `price_context_confidence_tier`
- `price_context_percentage_suppressed`
- `price_context_property_class`
- listing status
- featured status
- freshness / existing ranking rules

### Expected result
Listings should not be penalized because a manual review was never requested or resolved. If the data is limited, the buyer-facing module simply says it is limited.

## Phase 4 — Clean app code types and dead components

Purpose: remove leftover code after the product behavior is stable.

### Delete or retire dead files
Likely candidates:
- `src/hooks/useBenchmarkReview.tsx`
- `src/components/property/BenchmarkReviewDialog.tsx`
- `src/components/property/PriceContextBadge.tsx` if no longer used

### Simplify engine types
In `src/lib/priceContext.ts`:
- Remove manual review status handling.
- Remove `blocked` / `incomplete` as product states if they only existed for review workflow.
- Keep confidence tiers and premium/luxury classifications.

### Simplify helper files
Update or remove:
- `src/lib/priceContextGuardrails.ts`
- `src/lib/priceContextRanking.ts`
- `src/lib/wizardPriceContext.ts`

The goal is to make the code read as: automatic confidence system, not approval workflow.

## Phase 5 — Database cleanup migration, only after code no longer uses the fields

Purpose: remove unused schema safely.

This should be last, after the app has run without depending on the old fields.

### Drop old review columns from `properties`
Candidates to remove:
- `benchmark_review_status`
- `benchmark_review_reason`
- `benchmark_review_notes`
- `benchmark_review_requested_at`
- `benchmark_review_resolved_at`
- `benchmark_review_admin_notes`
- `benchmark_review_resolution`
- `price_context_badge_status`
- `price_context_filter_eligible`
- `price_context_placement_eligible`
- `price_context_featured_eligible`

### Drop old indexes
Remove indexes tied to the old columns, such as:
- `idx_properties_price_context_badge_status`
- `idx_properties_benchmark_review_status`
- `idx_properties_price_context_filter_eligible`
- `idx_properties_price_context_placement_eligible`

### Decide what to do with `price_context_events`
Options:
1. Keep it if it still stores useful analytics for module impressions/interactions.
2. Remove only event types tied to manual review.
3. Drop the table later if all useful analytics now live in `user_events`.

Recommended: keep it temporarily unless it is clearly unused.

## Phase 6 — QA checklist

After each phase, verify:

### Listing page
- Market Intelligence renders on normal listings.
- Premium/luxury listings show the cautious premium mode.
- Listings with limited comps show limited-data copy, not “under review.”
- No duplicate tags or review badges appear.

### Agent / agency portals
- New listing wizard still submits.
- Edit listing wizard still saves.
- Agents/agencies no longer see benchmark review requests.
- Helpful fields like size source, ownership type, and premium explanation still work.

### Admin
- Admin listing workflows still work if unrelated to Price Context.
- No broken admin routes or empty review queues.
- Analytics no longer count “complete / incomplete / under review” as operational states.

### Marketplace behavior
- Featured listings still load.
- Homepage listings still load.
- Property search still loads.
- No listing disappears just because old review fields are null/false.

## Recommended execution order

I recommend implementing this in three actual work batches:

### Batch A — UI and workflow removal
Covers Phases 1 and 2.

This gives the immediate product cleanup.

### Batch B — ranking/type/code cleanup
Covers Phases 3 and 4.

This removes hidden dependencies and dead code.

### Batch C — database cleanup
Covers Phase 5 only after Batch A/B are verified.

This avoids breaking code that still references old fields.

## Technical files likely involved

High-confidence files from the audit:

```text
src/hooks/useBenchmarkReview.tsx
src/components/property/BenchmarkReviewDialog.tsx
src/components/property/PriceContextBadge.tsx
src/components/property/MarketIntelligence.tsx
src/lib/priceContext.ts
src/lib/priceContextRanking.ts
src/lib/priceContextGuardrails.ts
src/lib/wizardPriceContext.ts
src/hooks/useListingReview.tsx
src/components/admin/ListingReviewCard.tsx
src/pages/admin/AdminListingReview.tsx
src/hooks/usePriceAnalytics.tsx
src/components/admin/PriceAnalytics.tsx
src/pages/agent/NewPropertyWizard.tsx
src/pages/agent/EditPropertyWizard.tsx
src/pages/agency/AgencyNewPropertyWizard.tsx
src/pages/agency/AgencyEditPropertyWizard.tsx
src/components/agent/wizard/PropertyWizardContext.tsx
src/components/agent/wizard/PriceContextSubmissionPreview.tsx
src/hooks/useFeaturedListings.ts
src/hooks/useHomepageFeatured.tsx
src/hooks/useProperties.tsx
src/hooks/usePaginatedProperties.tsx
src/App.tsx
```

Database cleanup later:

```text
properties benchmark_review_* columns
properties price_context_badge_status
properties price_context_*_eligible columns
old indexes for those fields
possibly manual-review event types in price_context_events
```

## Recommendation

Start with Batch A. That removes the visible and operational complexity while leaving the database alone. Once Batch A is stable, do Batch B. Only then do Batch C database cleanup.