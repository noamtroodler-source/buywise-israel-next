Based on the brief and the implementation already completed, the system is roughly 65–70% built out. The foundations are in place: confidence scoring, safe public labels, wizard fields, pre-publish preview, persistence, agent/agency badges, and an admin audit history.

What is still needed for a “perfectly built out” Price Context system is mainly the final buyer UX, benchmark-review workflow, analytics, and rollout controls.

## Remaining phases

### Phase 1: Complete buyer-facing Price Context module
Upgrade the current property-page module from a good first version into the final brief-compliant structure:

1. Header: “BuyWise Price Context”.
2. Clear subtitle explaining recorded sales, local benchmarks, and property-specific context.
3. Status badge driven by the safe public label.
4. One-sentence “BuyWise Take”.
5. Three core cards:
   - Asking price / sqm
   - Recorded local benchmark range
   - Comparable confidence
6. Premium drivers split into:
   - Confirmed by agency
   - Detected from listing
7. Smart buyer questions.
8. Expandable “How we calculated this” section with comp set, limitations, sqm-source explanation, and disclaimer.

Important: keep public listing-level gap percentages suppressed unless the confidence gate allows them. Use ranges, not single-point “fair value” claims.

### Phase 2: Build benchmark review request flow for agents/agencies
The database has benchmark-review fields, but the full agent-side workflow still needs to be built.

Add a “Request benchmark review” flow from the listing management UI and/or Price Context badge:

- Structured reasons:
  - Wrong location or geocode
  - Wrong property type
  - Wrong sqm
  - Wrong room count
  - New-build compared to resale
  - Penthouse/garden/sea-view features not reflected
  - Comps are too old or too far away
  - Price includes parking, storage, furniture, or extras
  - Better comparable sales exist
  - Recent deal not yet in government records
  - Other explanation
- Optional notes field.
- Update the listing’s `benchmark_review_status` to `requested`.
- Save reason/notes.
- Log an immutable `price_context_events` event.
- Show “Context under review” on the agent/agency listing badge.

### Phase 3: Admin benchmark review queue and resolution tools
Extend the existing admin review/audit work into a dedicated operational queue.

Add admin controls to:

- Filter listings where benchmark review is requested/under review.
- See structured reason, notes, property class, confidence score, public label, and comp-pool snapshot.
- Mark review as:
  - Under review
  - Resolved: benchmark accepted
  - Resolved: listing data corrected
  - Resolved: confidence downgraded / label softened
- Write admin notes.
- Log every decision into `price_context_events`.
- Refresh the listing’s badge/public label after resolution.

### Phase 4: Price Context analytics and KPI dashboard
The brief calls for a measurement layer. This is the biggest remaining production-readiness item.

Implement event tracking for:

Buyer metrics:
- Price Context module viewed
- Expandable details opened
- Comparable sales viewed/clicked
- Inquiry after Price Context viewed
- Save after Price Context viewed

Agency metrics:
- Premium-context completion rate
- Price Context Complete badge rate
- Benchmark review request rate
- Time-to-submit/listing friction
- Context-complete vs incomplete inquiry conversion

Data-health metrics:
- Listings by confidence tier
- Unknown sqm-source rate
- Unknown ownership-type rate
- High-gap listings with/without premium explanation
- Most common benchmark review reasons

Surface this in the existing admin analytics area, likely as a dedicated Price Context/Price Intelligence dashboard section.

### Phase 5: Mature marketplace controls and ranking hooks
This should be built after the system is stable, but the hooks can be prepared now.

Add internal-only controls for:

- Whether listing-level Price Context is shown broadly or only softly.
- Whether context-complete listings become eligible for stronger placement.
- Whether featured placement requires Price Context completion.
- Buyer filter: “Show listings with complete Price Context”.

For now, these should be admin/feature-flag controlled, not hard-coded as public behavior.

## Recommended next build

The best next phase is Phase 1 + Phase 2 together:

1. Finalize the buyer-facing Price Context module so the public product feels polished and trust-building.
2. Add the agent/agency benchmark review request flow so professionals have a fair correction mechanism.

That combination closes the most important product loop:

```text
Buyer sees safe context
        ↓
Agency can add/explain/request review
        ↓
Admin can audit and resolve
        ↓
Buyer-facing trust improves without attacking listings
```

## Technical implementation plan for the next build

### Files likely to update
- `src/components/property/MarketIntelligence.tsx`
- `src/lib/priceContext.ts`
- `src/components/property/PriceContextBadge.tsx`
- Agent/agency listing management pages using the badge
- `src/hooks/useAgentProperties.tsx`
- `src/hooks/useAgencyListings.tsx`
- `src/hooks/useListingReview.tsx`

### New files likely to add
- `src/components/property/PriceContextModule.tsx`
- `src/components/property/PriceContextDetailsDrawer.tsx` or similar expandable details component
- `src/components/property/BenchmarkReviewDialog.tsx`
- `src/hooks/useBenchmarkReview.tsx`

### Database/backend changes likely needed
Use a migration only if the current fields are not enough. The current fields may be sufficient for the first version:
- `benchmark_review_status`
- `benchmark_review_reason`
- `benchmark_review_notes`
- `price_context_events`

If needed, add timestamps such as:
- `benchmark_review_requested_at`
- `benchmark_review_resolved_at`

### Guardrails
- No mock data.
- No raw public “overpriced” language.
- No public percentage display unless the confidence gate allows it.
- Keep all internal math/storage in NIS.
- Preserve the “Trusted Friend” tone.
- Use “International buyers”, never “Anglo” in public UI.

After this next build, the remaining work would mostly be analytics and mature rollout controls rather than core product UX.