# Plan: Fully Build Out the Remaining Price Context System

## Goal
Finish the Price Context implementation so it matches the brief end-to-end: buyer trust layer, agency correction/enrichment workflow, admin/data-quality controls, KPI measurement, and mature rollout hooks.

Current status: Phases 15–20 are implemented. The Price Context system now has the buyer trust layer, agency/admin review workflow, analytics/KPIs, controlled rollout hooks, and a QA/security pass.

```text
Buyer sees safe Price Context
        ↓
Agent/agency can explain or request benchmark review
        ↓
Admin resolves benchmark/data issues
        ↓
Analytics prove trust, lead quality, and data-health impact
        ↓
Rollout controls decide where Price Context affects discovery/placement
```

## Phase 15: Final buyer-facing Price Context module

Build the final brief-compliant public module on property detail pages.

### Buyer UX
- Rename/position the public section as “BuyWise Price Context”.
- Add a short “Trusted Friend” subtitle explaining recorded sales, local benchmarks, and property-specific context.
- Keep the safe public status badge driven by `priceContext.publicLabel`.
- Preserve the one-sentence “BuyWise Take”.
- Show three clear summary cards:
  - Asking price / sqm.
  - Recorded local benchmark range.
  - Comparable confidence.
- Keep benchmark display as ranges, never false-precision point estimates.
- Keep public percentage gaps suppressed unless the existing confidence gate allows them.
- Split premium drivers into:
  - “Confirmed by agency”.
  - “Detected from listing”.
- Show smart buyer questions generated from property context.
- Add an expandable “How we calculated this” area with:
  - Comp set summary.
  - Limitations/caps.
  - SQM-source explanation.
  - Ownership-type context where available.
  - Legal/data disclaimer.
- Track interactions:
  - Module viewed.
  - Details opened.
  - Trust feedback submitted.
  - Comparable details viewed.

### Guardrails
- No “overpriced” language.
- No harsh “requires closer review” public status.
- No mock data.
- Use NIS internally; display according to existing preferences.
- Use semantic Tailwind tokens only.

## Phase 16: Agent/agency benchmark review request flow

Give professionals a fair correction path when they believe the benchmark is stale, wrong, or missing context.

### Agent/agency UI
- Add a “Request benchmark review” action in relevant listing management surfaces and/or Price Context badge states.
- Use a structured dialog with reasons from the brief:
  - Wrong location or geocode.
  - Wrong property type.
  - Wrong sqm.
  - Wrong room count.
  - New-build compared to resale.
  - Penthouse/garden/sea-view features not reflected.
  - Comps are too old or too far away.
  - Price includes parking, storage, furniture, or extras.
  - Better comparable sales exist.
  - Recent deal not yet in government records.
  - Other explanation.
- Include optional notes.
- Update the listing to `benchmark_review_status = requested`.
- Save `benchmark_review_reason` and `benchmark_review_notes`.
- Log immutable `price_context_events` event: `benchmark_review_requested`.
- Show “Context under review” on agent/agency badges after submission.

### Data additions if needed
If existing fields are insufficient, add:
- `benchmark_review_requested_at`.
- `benchmark_review_resolved_at`.
- `benchmark_review_admin_notes`.
- `benchmark_review_resolution`.

## Phase 17: Admin benchmark review queue and resolution tools

Turn admin transparency into an operational workflow.

### Admin queue
- Add a Price Context Review Queue in the admin area.
- Filter by:
  - Requested.
  - Under review.
  - Resolved.
  - Confidence tier.
  - Property class.
  - City/area.
- For each listing, show:
  - Property identity and listing details.
  - Review reason and agency notes.
  - Price Context status, confidence tier, score, public label.
  - Confidence cap audit from Phase 14.
  - Comp-pool summary.
  - SQM source and ownership type.
  - Premium drivers and explanation.
  - Event history.

### Admin actions
- Mark as `under_review`.
- Resolve as:
  - Benchmark accepted.
  - Listing data corrected.
  - Confidence downgraded / public label softened.
  - More data needed.
- Add admin notes.
- Log each decision to `price_context_events`.
- Refresh derived badge/status metadata after resolution where appropriate.

## Phase 18: Price Context analytics and KPI dashboard

Build the measurement layer requested in the brief.

### Buyer metrics
- Price Context module view rate.
- Expandable-details open rate.
- Comparable-view click/open rate.
- Save after viewing Price Context.
- Inquiry after viewing Price Context.
- Trust-feedback helpful/not-helpful rate.
- Clarity-session conversion if that event exists in the app.

### Agency metrics
- Premium-context completion rate.
- Price Context Complete badge rate.
- Benchmark review request rate.
- Time-to-publish/listing-friction indicators where timestamps exist.
- Lead-quality rating averages.
- Inquiry conversion for context-complete vs incomplete listings.

### Data-health metrics
- Listings by confidence tier.
- Unknown SQM-source rate.
- Unknown ownership-type rate.
- High-gap listings with/without premium explanation.
- Most common benchmark review reasons.
- Confidence-cap frequency.
- Insufficient-data rate by city/area/property class.

### Admin UI
- Add a dedicated “Price Context” or “Price Intelligence” tab in existing admin analytics.
- Use real persisted data only; no placeholder metrics.
- Display “not enough data yet” states when counts are too low.
- Add CSV export if consistent with the existing analytics patterns.

## Phase 19: Mature marketplace controls and ranking hooks

Prepare controlled rollout without making aggressive public changes too early.

### Controls
- Add internal feature flags/settings for:
  - Showing listing-level Price Context broadly vs softly.
  - Enabling buyer filter: “Show listings with complete Price Context”.
  - Allowing context-complete listings to qualify for stronger placement.
  - Requiring complete Price Context for some featured placements later.
- Apply existing `priceContextGuardrails` so listings under review or blocked do not receive enhanced placement.
- Add buyer-facing filter only if it can be backed by real listing metadata.

### Ranking integration
- Do not overhaul ranking immediately.
- Expose a safe eligibility signal such as `price_context_feature_eligible` or use an existing guardrail helper in listing queries/cards.
- Keep this admin-controlled until the system has enough real data.

## Phase 20: QA, security, and memory cleanup

Status: Done — verified event-history RLS, rollout flags, review eligibility guardrails, honest no-data states, and public-language safety. Added an agency-admin event insert policy so agency-owned benchmark review requests can log immutable events without exposing event history publicly.

### QA checklist
- Verify property pages across:
  - Strong comparable match.
  - Directional benchmark.
  - Limited match.
  - Premium/unique property.
  - Insufficient data.
  - Under review.
- Verify agent/agency review submission permissions.
- Verify admin-only review queue permissions.
- Verify event logging does not expose private buyer data publicly.
- Verify public UI never shows raw harsh gap language.
- Verify empty states are honest and do not fabricate metrics.

### Security/data rules
- Keep roles in dedicated role tables only.
- Do not rely on localStorage/client flags for admin access.
- Use existing Lovable Cloud RLS patterns for new or updated tables.
- Do not edit generated backend client/type files manually.

## Technical implementation map

### Likely files to update
- `src/components/property/MarketIntelligence.tsx`
- `src/components/property/PriceContextBadge.tsx`
- `src/lib/priceContext.ts`
- `src/lib/priceContextDisclaimer.ts`
- `src/lib/priceContextGuardrails.ts`
- `src/hooks/useBenchmarkReview.tsx`
- Agent/agency listing management pages/components
- Admin listing review components
- Admin analytics components
- Listing filter/query components if the buyer filter is added

### Likely new files/components
- `src/components/property/PriceContextModule.tsx`
- `src/components/property/PriceContextDetailsPanel.tsx`
- `src/components/property/BenchmarkReviewDialog.tsx`
- `src/components/admin/PriceContextReviewQueue.tsx`
- `src/components/admin/analytics/PriceContextAnalyticsTab.tsx`
- `src/hooks/usePriceContextAnalytics.tsx`
- `src/hooks/usePriceContextReviewQueue.tsx`

### Likely backend/database updates
Use migrations only for missing persisted fields. Expected additions may include:
- Benchmark review timestamps.
- Admin resolution fields.
- Optional structured analytics/event metadata indexes.
- Optional app setting/feature flag records if no suitable table already exists.

RLS policies must ensure:
- Agents/agencies can request reviews only for listings they own/manage.
- Admins can read and resolve all review requests.
- Public users cannot read internal event history or admin notes.

## Recommended execution order

1. Phase 15: finish public buyer module.
2. Phase 16: add agent/agency benchmark review requests.
3. Phase 17: add admin review queue and resolution.
4. Phase 18: add analytics dashboard and event aggregation.
5. Phase 19: add controlled rollout/ranking/filter hooks.
6. Phase 20: QA/security pass.

This order finishes the visible product loop first, then adds operations, measurement, and controlled marketplace impact.