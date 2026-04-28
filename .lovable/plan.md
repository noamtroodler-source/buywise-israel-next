## Quick answer: use existing features first, then add a small premium-context layer

Yes, many premium drivers should be pulled automatically from existing listing data. The system should not make agents re-enter obvious things like `sea_view`, `parking`, `storage`, `mamad`, `sukkah_balcony`, `garden_apartment`, `penthouse`, high floor, renovation condition, or furnished status.

But it should still have its own lightweight section because existing features do not answer the full question: “why does this listing deserve to sit above recorded sales?”

### Best approach
Use a hybrid model:

1. **Auto-detect premium drivers** from selected features, property type, floor, parking, condition, furnished status, furniture items, highlighted text, and description.
2. **Show a “Premium Context” card only when needed** — not as a permanent scary compliance step.
3. **Let agents confirm, add missing drivers, or write one short explanation**.
4. **Feed that into BuyWise Take and Market Intelligence** so public language becomes cleaner and fairer.

### Pros of only pulling from existing features
- Less friction for agents.
- No duplicate data entry.
- Cleaner wizard.
- Uses structured fields the app already stores.

### Cons of only pulling from existing features
- Existing features are too generic.
- They do not capture nuance like “direct sea view from salon,” “boutique building,” “rare street,” “fully furnished with appliances,” or “project unit priced differently from resale comps.”
- The system may still say “premium needs context” even when the agent knows exactly why.
- Agencies lose a chance to frame the property properly.

### Pros of a standalone Premium Context card
- Gives agencies a positive marketing moment instead of a warning.
- Helps BuyWise protect the agency publicly.
- Creates better Market Intelligence language.
- Gives admins a cleaner review signal.

### Cons of a standalone section
- If shown always, it adds friction.
- If worded badly, it feels like compliance/punishment.
- If duplicated with Features, it feels annoying.

### Final decision
Do **not** add a full separate wizard step at first. Add an intelligent **Premium Context card** inside the existing Features/Review flow. It should appear conditionally when the listing is above comps or likely premium, and it should pre-fill from existing fields.

---

# Build plan: Market Fit Review system

## Phase 1 — Clean public Market Intelligence language

Goal: fix the current public experience quickly without building the entire workflow yet.

### Changes
- Replace harsh or overconfident language in Market Intelligence.
- Stop labels like “Well above recent sales — negotiate” from feeling too judgmental.
- Use softer BuyWise labels:
  - `In line with recorded sales`
  - `Above recorded sales`
  - `Premium needs context`
  - `Feature-driven premium likely`
  - `Limited comparable match`
  - `Asking price requires closer review`
- Keep BuyWise Take, but make it shorter and more structured.
- Update the AI market insight prompt so it avoids words like “astronomical,” “error,” “doesn’t make sense,” or “overpriced” unless the data is clearly impossible.

### Public UI result
Instead of long repeated paragraphs, buyers see:

```text
Premium needs context
This listing sits above nearby recorded sales. View, floor, renovation, outdoor space, parking, or rarity may explain part of the gap, but the current listing data does not fully explain the premium.
```

Or:

```text
Feature-driven premium likely
Recorded sales may not fully reflect this home’s view, floor, renovation, outdoor space, parking, or rarity.
```

## Phase 2 — Add Market Fit logic layer

Goal: create a reusable rule engine that decides which state a listing is in.

### Market Fit states
- `normal_range`
- `above_recorded_sales`
- `premium_needs_context`
- `feature_driven_premium`
- `limited_comparable_match`
- `agency_review_needed`

### Inputs
Use existing data first:
- price
- size
- price/sqm
- nearby comps deviation
- comp count
- radius used
- city/neighborhood averages
- property type
- floor / total floors
- condition
- parking
- features array
- furnished status / furniture items
- property description
- featured highlight
- listing status

### Initial threshold logic
```text
0–15% above comps: normal / active listing margin
15–35%: above recorded sales
35–70%: ask for premium context
70–100%: require premium context or confirmation
100%+: force review/confirmation unless strong premium context or weak comps explain it
```

### Softening factors
Reduce severity when:
- comp count is low
- comps are old or sparse
- property type differs
- listing is penthouse/garden/project/new build
- listing has sea view, beachfront, high floor, renovation, parking, large balcony, luxury finish, rare street, bundled extras
- neighborhood has high variance
- recent sales are not close enough in size/rooms/floor

## Phase 3 — Premium Context inside the listing wizard

Goal: help agencies explain premium listings without scaring them.

### Placement
Add a conditional **Premium Context** card inside the existing Features step and a compact reminder on Review.

Do not add a full extra step initially.

### Trigger
Show the card when:
- price appears materially above market, or
- property has premium signals, or
- the agent selects premium features like sea view, penthouse, garden apartment, high floor, renovation, parking, large balcony, luxury finish, furnished extras.

### Behavior
The card should say:

```text
Help buyers understand the premium
We detected features that may make this home compare differently from nearby recorded sales. Confirm what applies so BuyWise can present the market context fairly.
```

### Auto-selected drivers
Pull from existing fields:
- `sea_view` → Sea view
- `property_type = penthouse / mini_penthouse` → Penthouse
- `property_type = garden_apartment` → Garden apartment
- high floor logic → High floor
- `condition = renovated / like_new / new` → Renovation / new build
- `parking > 0` or `parking` feature → Parking
- `storage` feature → Storage
- `mamad` feature → Mamad
- `sukkah_balcony` feature → Sukkah balcony
- `garden` feature → Larger outdoor space / garden
- `furnished_status` or `furniture_items` → Furnished / bundled extras
- `featured_highlight` or description contains sea/view/beach/renovated/luxury/boutique/rare → suggested, not auto-confirmed

### Agent-selectable drivers
- Sea view
- Beachfront / first line
- Full renovation
- New build / project unit
- Penthouse
- Garden apartment
- High floor
- Large balcony
- Sukkah balcony
- Parking
- Storage
- Mamad
- Luxury finish
- Rare street / boutique building
- Expansion rights / Tama potential
- Furnished / appliances / bundled extras
- Larger-than-normal outdoor space
- Other explanation

### Optional explanation
A short text box:

```text
Example: Direct sea view from salon and balcony, renovated in 2024, private parking.
```

This stays framed as marketing support, not compliance.

## Phase 4 — Store premium context properly

Goal: make the feature durable across creation, editing, public listing, admin review, and AI insights.

### Database schema additions
Add fields to `properties`:
- `premium_drivers text[]`
- `premium_explanation text`
- `market_fit_status text`
- `market_fit_confirmed_at timestamptz`
- `market_fit_confirmed_by uuid nullable`
- `market_fit_review_reason text nullable`

This is a schema change, so it will use a migration.

### Data policy
No fabricated market data. These fields store agent-provided context and computed status, not invented values.

## Phase 5 — Publish and review workflow

Goal: prevent extreme unexplained mismatches without punishing legitimate luxury listings.

### Publishing rules
- Normal / mild premium: submit normally.
- 35–70% gap: allow submit, but prompt for premium context.
- 70–100% gap: require either premium drivers or confirmation before submit.
- 100%+ gap: require confirmation and show a review message.

### Agency-facing language
Use:

```text
Help us present this listing accurately
The asking price is significantly above recorded nearby sales. If view, renovation, floor, outdoor space, parking, new-build status, or rarity explain the gap, add that context so buyers understand the premium.
```

Avoid:
- failed
- suspicious
- overpriced
- blocked
- bad data

### Existing published listings
Do not automatically unpublish normal expensive listings.

Use two levels:
- **Soft review**: listing stays live, agency dashboard asks for premium context.
- **Hard review**: only for extreme likely data mismatch, such as impossible size/price, missing size, wrong property type, or price/sqm far beyond market with no drivers.

## Phase 6 — Public listing design integration

Goal: make this feel like BuyWiseIsrael, not a compliance warning.

### Design direction
- “Trusted Friend” tone.
- Calm, factual, no shame language.
- Semantic design tokens only.
- Compact labels, short copy, expandable details.
- No generic red warning unless the data itself is likely invalid.

### Market Intelligence layout
Keep the section, but simplify hierarchy:

```text
Market Intelligence
[Status badge]
[3 compact value cards]
[Recent nearby sales]
[BuyWise Take — one concise sentence/card]
[Expandable: What recorded sales may not capture]
```

### BuyWise Take behavior
BuyWise Take becomes the conclusion layer. It should reflect the Market Fit status rather than independently writing a long defensive paragraph.

Examples:

```text
Feature-driven premium likely
Recorded sales may not fully reflect this home’s view, floor, renovation, outdoor space, parking, or rarity.
```

```text
Limited comparable match
Nearby recorded sales are useful context, but may not be a close match for this property class.
```

```text
Premium needs context
The asking price sits above nearby recorded sales, and the current listing data does not fully explain the premium.
```

## Phase 7 — Admin and agency dashboard follow-through

Goal: make the workflow operational after listings are submitted.

### Agency dashboard
Add a small status indicator:
- `Market context complete`
- `Premium context recommended`
- `Review price/details`

Add an edit action:
- `Add premium context`

### Admin review
Show:
- computed gap
- comp count
- detected premium drivers
- agent-entered explanation
- market fit status

This helps admins approve legitimate luxury listings faster.

## Phase 8 — AI insight update

Goal: make AI support the structured product logic instead of improvising.

### Edge function changes
Update the market insight function to receive:
- `market_fit_status`
- `premium_drivers`
- `premium_explanation`
- `comp_quality_notes`

### Prompt rules
The AI should:
- follow the computed status
- stay concise
- avoid harsh pricing judgments
- mention agent-provided premium context when relevant
- acknowledge recorded data limitations without repeating the same paragraph every time

## Recommended build order

1. Public wording + AI prompt cleanup.
2. Market Fit utility function.
3. Premium Context card in wizard using existing features.
4. Database fields for premium context/status.
5. Save/edit payload integration for agent and agency wizards.
6. Public Market Intelligence status display.
7. Publish gating/confirmation for extreme cases.
8. Agency/admin dashboard follow-up indicators.

## What this solves

- Buyers still get honest market context.
- Agencies do not get publicly embarrassed by generic comps.
- Luxury, sea-view, renovated, furnished, project, penthouse, garden, and rare listings are treated fairly.
- BuyWise keeps trust because it does not hide comps, but it also does not overstate what comps can prove.
- The wizard feels like a marketing enhancement, not a punishment.