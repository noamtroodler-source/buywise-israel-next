# Revised plan: BuyWise Price Context implementation

## Strategic direction

Keep the Market Intelligence feature, but reposition it as **BuyWise Price Context**.

The feature should protect buyers without publicly attacking agencies or making weak data look authoritative. Buyers get context, smart questions, and transparency. Agencies get a tool that helps explain legitimate premiums, improve listing quality, and create better-qualified leads.

Core operating rule:

```text
1. Normalize listing data
2. Assign property class
3. Select allowed same-class comp pool
4. Calculate benchmark range and internal raw gap
5. Score comparable confidence
6. Check premium context and review state
7. Generate buyer-facing public label
```

Important rule: **raw gap math can never directly create a public warning.** Public output is generated from confidence tier, property class, premium context, and review state first.

## Phase 1: Public safety and language cleanup

Goal: prevent obvious damage while preserving buyer value.

1. Rename buyer-facing section:
   - From **Market Intelligence**
   - To **BuyWise Price Context**

2. Remove public harsh language:
   - Do not show “Asking price requires closer review” publicly.
   - Do not show “overpriced,” “bad deal,” “above market,” or “market warning.”
   - Use “above selected recorded-sale benchmarks,” not “above market.”

3. New public status labels:
   - In line with available benchmarks
   - Moderate premium to recorded sales
   - Premium features identified
   - Large premium — context important
   - Limited comparable match
   - Premium property — standard comps may not apply
   - Not enough recorded data to benchmark reliably
   - Market context under review

4. Public percentage suppression rule:
   - Exact or rounded percentage may show only when all are true:
     - confidence is strong
     - property class is standard resale
     - comps are same-class
     - no unresolved benchmark review exists
     - gap is 25% or less
   - Medium confidence: qualitative only.
   - Low confidence: qualitative only.
   - Premium/unique property: qualitative only.
   - 26%+ gap: qualitative only.
   - 100%+ gap: admin-only raw number; buyer sees confidence/property-class explanation, not the raw gap.

5. Add public disclaimer:
   - “BuyWise Price Context is based on available recorded transactions, listing information, and agency-provided context where available. It is not an appraisal, valuation, legal opinion, or offer recommendation. Recorded sales may be incomplete and may not reflect renovation, view, floor, parking, storage, outdoor space, furniture, ownership structure, or other value drivers. Buyers should verify independently with qualified professionals before making purchase decisions.”

## Phase 2: Deterministic confidence engine

Goal: make the logic implementable and consistent.

Create a shared Price Context engine in `src/lib/marketFit.ts` or a new `src/lib/priceContext.ts`.

### Confidence inputs

Score confidence using these factors:

1. Comp count
   - Strong: 8+ comps
   - Medium: 5–7 comps
   - Weak: 1–4 comps

2. Radius
   - Strong: 300m or less
   - Medium: 301–600m
   - Weak: more than 600m, especially in dense cities

3. Recency
   - Strong: 12 months or less
   - Medium: 12–24 months
   - Weak: 24–36 months
   - Older than 36 months should normally be insufficient

4. Room match
   - Strong: exact Israeli room-count match
   - Medium: plus/minus 1 room
   - Weak: plus/minus 2 or more rooms

5. Size match
   - Strong: within 10% sqm
   - Medium: within 20% sqm
   - Weak: 30%+ mismatch

6. Property-class match
   - Strong: exact same class
   - Medium: similar class only when allowed
   - Weak: different class

7. Dispersion
   - Strong: tight comp range
   - Medium: moderate spread
   - Weak: wide spread

8. Data quality penalties
   - Missing or unknown sqm source
   - Missing or unknown ownership type
   - missing size
   - missing coordinates
   - suspicious size/price/floor data
   - inconsistent room counts

### Hard confidence caps

Any one of these caps public confidence at **Limited comparable match** or below:

- fewer than 5 comps
- radius above 600m in dense city/neighborhood contexts
- property-class mismatch
- unknown sqm source
- unknown ownership type
- wide comp dispersion
- unresolved benchmark review
- standard resale comps used for premium/unique property class

### Confidence tiers

1. Strong comparable match
   - Same-class comps are strong.
   - Public benchmark range can be shown.
   - Rounded percentage band may be shown only if standard resale and gap is 25% or less.

2. Directional benchmark
   - Useful context, not authoritative.
   - Public UI shows qualitative language and ranges, not exact gap.

3. Limited comparable match
   - Weak comp set or data-quality issue.
   - Public UI emphasizes limitations and buyer questions.

4. Premium/unique property
   - Property class or premium drivers mean standard comps may not apply.
   - Public UI focuses on why standard comps can miss value drivers.

5. Insufficient data
   - Not enough reliable evidence.
   - Public UI shows macro/city/neighborhood context only.

## Phase 3: Same-class comp enforcement

Goal: avoid false comparisons.

Property class assignment must happen before comp selection, not after.

Required classes:

- Standard resale apartment
- New-build / project / Kablan unit
- Penthouse / mini-penthouse
- Garden apartment
- Beachfront / first-line / direct sea-view
- Duplex / unique configuration
- House / villa / cottage
- Land
- Commercial
- Luxury-renovated / designer-finish overlay where detectable
- Tama 38 / Pinui Binui affected building where detectable

Hard comparison rules:

1. New-build/project units should only be benchmarked directly against new-build/project comps.
2. Penthouses and mini-penthouses should only use same-class comps for listing-level judgment.
3. Garden apartments should not be judged against standard upper-floor apartments.
4. Beachfront/direct sea-view should not be judged against normal neighborhood resale stock unless explicitly downgraded to directional context.
5. Tama 38 / Pinui Binui buildings require extra caution because old units and new additions can exist in the same building.
6. If same-class comps are not available, buyer-facing output becomes:
   - “Premium property — standard comps may not apply” or
   - “Limited comparable match”
7. Admin can still see raw comparisons for review, but buyer UI cannot present them as authoritative.

## Phase 4: Public / agency / admin display matrix

Goal: define who sees what.

```text
Data item                         Buyer UI                         Agent/Agency UI                    Admin UI
Raw internal gap %                 Usually hidden; shown only        Visible in preview with             Always visible
                                   when strong + standard + <=25%    explanation and suppression state

Rounded gap band                   Strong standard comps only        Visible when buyer would see it      Always visible

Confidence tier                    Always visible                   Always visible                       Always visible + reasons

Comp count/radius                  Shown as context/tooltip          Visible in preview                   Always visible

Property class                     Shown when relevant               Visible and editable/reviewable       Always visible

Premium drivers                    Shown as confirmed/detected       Confirm/edit workflow                Always visible

Premium explanation                Shown if supplied                 Editable                            Always visible

Benchmark review state             “Market context under review”     Request/review status                Full workflow state

Exact comp list                    Expandable, when useful           Preview/diagnostic                   Full diagnostic

Public label                       Primary buyer status              Previewed before submit              Shown with internal rationale
```

## Phase 5: Database and audit foundation

Goal: make the feature explainable and operational.

Add fields to `properties`:

- `price_context_property_class`
- `price_context_confidence_score`
- `price_context_confidence_tier`
- `price_context_public_label`
- `price_context_percentage_suppressed`
- `price_context_badge_status`
- `comp_pool_used`
- `sqm_source`
- `ownership_type`
- `benchmark_review_status`
- `benchmark_review_reason`
- `benchmark_review_notes`

Create a Price Context event log table, for example `market_intelligence_events` or `price_context_events`, logging:

- listing created/submitted
- benchmark calculated
- confidence assigned
- public label generated
- public percentage shown/suppressed
- premium context edited
- benchmark review requested/resolved
- admin override
- badge status changed
- comp pool changed

Security:

- Use RLS.
- Admins can read all event logs.
- Listing owners/agency users can see relevant high-level workflow status where appropriate.
- Public buyers never see internal raw event data.

## Phase 6: Agency wizard improvements

Goal: turn Price Context into an agency benefit.

1. Add SQM source in the listing details step:
   - Tabu registered size
   - Arnona size
   - Contractor / plan size
   - Marketing / gross size
   - Net internal size
   - Agent estimate
   - Unknown

2. Add ownership type:
   - Tabu / private ownership
   - Minhal / Israel Land Authority leasehold
   - Company registration / other structure
   - Unknown

3. Improve premium context collection:
   - Detected premium drivers from listing fields.
   - Agency-confirmed premium drivers.
   - Short buyer-facing explanation.
   - Prompt required or strongly emphasized when internal gap is 25%+.

4. Add agency pre-publish preview:
   - buyer-facing status badge
   - BuyWise Take
   - price/sqm card
   - recorded benchmark/range card if allowed
   - confidence label
   - premium drivers grouped by confirmed/detected
   - buyer questions
   - disclaimer

5. Preview actions:
   - Add premium context
   - Confirm/edit premium drivers
   - Correct sqm, price, property type, location
   - Add sqm source and ownership type
   - Request benchmark review
   - Submit as-is

## Phase 7: Pricing Context Complete badge

Goal: create a positive agency incentive.

Badge name: **Pricing Context Complete**.

The badge must not mean BuyWise endorsed the price as fair. It means the agency supplied enough context for international buyers to understand the listing better.

Eligibility rules:

- price is present
- sqm is present, unless property class legitimately does not use interior sqm
- sqm source is entered or explicitly marked unknown
- ownership type is entered or explicitly marked unknown
- property class is clear
- premium drivers are confirmed when relevant
- premium explanation is added when internal gap is 25%+
- no unresolved benchmark review is open
- no blocking data issue exists
- listing is approved/published

Future optional upside:

- context-complete listings can become eligible for stronger marketplace placement, featured exposure, curated recommendations, or future buyer filters.

## Phase 8: Buyer-facing Price Context module

Goal: make the feature powerful but calm.

Top-level layout:

1. Header: **BuyWise Price Context**
2. Subtitle: “Recorded sales, local benchmarks, and property-specific context to help you understand the asking price.”
3. Status badge from the public label engine.
4. One-sentence **BuyWise Take**.
5. Three compact cards:
   - Asking price/sqm
   - Recorded local range or macro benchmark, only when confidence allows
   - Comparable confidence
6. Premium drivers:
   - Confirmed by agency
   - Detected from listing
7. Buyer questions based on property context.
8. Expandable details:
   - comp set
   - methodology
   - limitations
   - disclaimer
9. Link to city/neighborhood market guide.

Buyer question examples:

- What explains the premium over nearby recorded sales?
- Is the listed sqm based on Tabu, Arnona, contractor plans, or marketing size?
- Is parking registered, private, shared, robotic, or separate?
- Is storage included and registered?
- Which furniture, appliances, or extras are included?
- When was the property renovated, and what was included?
- Is the sea view direct, partial, protected, or vulnerable to future construction?
- For new-build: what is the delivery date, payment schedule, and included specification?
- Does the building have Tama 38 or Pinui Binui implications?
- Is there a registered Mamad or only a shared shelter?

## Phase 9: Admin review upgrades

Goal: give admin full diagnostics without exposing harsh raw signals publicly.

Admin Listing Review should show:

- raw internal gap percentage
- buyer-facing public label
- confidence tier
- confidence reasons/caps
- property class
- comp pool used
- public percentage suppressed: yes/no + reason
- premium drivers
- premium explanation
- SQM source
- ownership type
- benchmark review status
- Pricing Context Complete eligibility

Admin actions:

- approve normally
- approve with context
- request changes
- request benchmark review
- reject only for obvious wrong/fraudulent/broken data

Add one-click request-change copy, for example:

“Please add buyer-facing pricing context. The asking price is above selected recorded-sale benchmarks, and buyers will understand it better if you explain the relevant drivers such as renovation, view, floor, parking, outdoor space, storage, new-build status, or rarity.”

## Phase 10: Tracking and rollout controls

Goal: tune the system with real outcomes.

Buyer metrics:

- Price Context module view rate
- expandable details open rate
- comp-view click rate
- save/inquiry rate after viewing Price Context
- buyer trust feedback
- buyer complaint rate

Agency metrics:

- premium-context completion rate
- Pricing Context Complete badge rate
- benchmark review request rate
- time to publish
- lead quality feedback
- agency churn/issues tied to Price Context

Data metrics:

- confidence tier distribution
- share of listings with internal gap above 25%
- share of high-gap listings that become explainable after context
- false-positive rate from admin review
- unknown sqm-source rate
- unknown ownership-type rate
- common benchmark review reasons

Rollout:

- Early marketplace: soft buyer education, confidence labels, premium drivers, macro/local context. No public giant gap percentages.
- Growing marketplace: stronger listing-level Price Context when same-class confidence is strong.
- Mature marketplace: context-complete listings can influence ranking, featured placement, and filters.

## Validation and push verification

After implementation:

1. Validate database migration applies correctly.
2. Validate property creation/editing saves the new fields.
3. Validate buyer-facing Price Context no longer shows scary giant public percentages.
4. Validate admin still sees raw internal gap and confidence reasons.
5. Validate agent/agency preview matches the buyer-facing output.
6. Validate Pricing Context Complete badge appears only when eligibility rules are met.
7. Validate benchmark review state switches buyer UI to “Market context under review.”
8. Confirm the update is working in the Lovable preview/published flow after changes are pushed.

## Implementation priority

Build in this order:

1. Safety language + percentage suppression.
2. Confidence engine + property-class assignment.
3. Database fields + audit log.
4. Agency SQM/ownership/premium workflow.
5. Buyer-facing Price Context redesign.
6. Admin diagnostics + benchmark review workflow.
7. Metrics and rollout controls.

This keeps buyer trust as a permanent BuyWise moat while making the feature commercially tolerable and genuinely useful for agencies.