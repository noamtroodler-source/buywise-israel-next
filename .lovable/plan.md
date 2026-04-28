## Plan: rebuild Admin Listing Review as a clean buyer-quality review workspace

I’ll replace the current increasingly cluttered listing card with a structured review system that lets you quickly decide: “Is this good enough to publish for buyers?”

## What will change

### 1. New review card layout

Each listing will become a compact publishing-desk style card:

```text
[Cover photo + quick facts]  [Quality score + decision controls]
---------------------------------------------------------------
Tabs / sections:
Overview | Data Audit | Photos | Market Intelligence | Buyer Page Fit
```

The collapsed/header view will show only the essentials:
- Listing title
- Price
- City / neighborhood / address signal
- Agent / agency
- Photo count
- Price per sqm
- Overall quality status
- Fast actions: Preview, Approve, Request Changes, Reject

### 2. Buyer-quality score and readiness badges

I’ll add an internal review scoring model with clear statuses:
- **Ready to approve**
- **Review recommended**
- **Needs changes**
- **Critical missing data**

The score will be based on real submitted listing fields only, not mock data.

Score categories:
- **Core data completeness**: title, price, city, neighborhood, address, rooms, size, description
- **Location quality**: full address, street number, map pin, neighborhood present
- **Photo readiness**: photo count and gallery sufficiency
- **Feature richness**: condition, parking, balcony/storage/elevator signals, AC/furnishing/rental fields
- **Market intelligence readiness**: size, city benchmark, location/comps availability, price variance warnings
- **Buyer page readiness**: whether public page modules will feel complete or thin

### 3. Agency wizard field audit

I’ll add a dedicated “Data Audit” section that mirrors the agency listing wizard:
- Basics
- Details
- Features
- Photos
- Description
- Market context

Each group will show:
- Passed checks
- Warnings
- Critical missing items
- Suggested request-change text

Examples:
- Address missing street number
- No map pin, so nearby sales comparison is weaker
- Neighborhood missing
- Size missing, so price/sqm and market intelligence are limited
- Description too short for buyer-facing quality
- Few features selected
- Sale listing has too few photos
- Rental listing missing lease/furnished/pets details

### 4. Better photo review section

I’ll replace the photo strip duplication with a cleaner photo panel:
- Large cover photo
- Thumbnail grid
- Photo count status
- Click any photo to open the buyer preview modal at that image
- Warnings for weak gallery quality

Photo standards:
- No photos = critical
- 1–2 photos = likely needs changes
- Sale listing target = at least 6 photos
- Rental listing target = at least 4 photos
- Larger/premium properties get stronger warnings if the gallery is thin

### 5. Market Intelligence review section

I’ll keep and improve the current market sanity logic so it feels aligned with the buyer-facing Market Intelligence module.

It will show:
- Price per sqm and sqft
- City / neighborhood benchmark
- Nearby sold comps when coordinates exist
- Spec-matched comps when address/map pin is missing
- Variance vs sold comps
- Premium drivers detected
- Saved premium explanation
- Confidence level
- Missing-data warnings

It will clearly say when the system cannot make a strong comparison, instead of implying false certainty.

### 6. Buyer Page Fit section

This new section will answer:

“Will the public listing page look complete and trustworthy?”

It will check:
- Hero/gallery readiness
- Whether Market Intelligence can render meaningfully
- Whether calculators and price/sqm cards have enough data
- Whether the listing has a strong buyer-facing description
- Whether premium claims are supported by features/context
- Whether empty/thin modules are likely

### 7. Cleaner decision panel

The approval area will become more intentional:
- Approve
- Feature on homepage
- Request changes
- Reject
- Admin notes
- “Market reviewed” confirmation when needed

For request changes, I’ll add quick reason chips so you don’t need to type repetitive feedback:
- Add full address
- Add map pin
- Add neighborhood
- Confirm size
- Confirm price
- Add more photos
- Improve description
- Add missing features
- Explain price premium
- Market comps look high

Clicking chips will build the feedback message automatically.

## Design direction

I’ll keep it within BuyWise’s current admin design system:
- Semantic tokens only: primary, muted, card, border, semantic-green, semantic-amber, semantic-red
- Clean card hierarchy
- Fewer visible blocks at once
- Stronger spacing and section rhythm
- Clear status language in a trusted, practical voice
- Desktop two-column review workspace, stacked on smaller screens

No generic flashy redesign; this should feel like a professional editorial/quality-control tool.

## Technical implementation

Files I expect to update:
- `src/components/admin/ListingReviewCard.tsx`
- potentially new admin subcomponents under `src/components/admin/listing-review/`
- possibly `src/hooks/useListingReview.tsx` if any missing review fields need to be selected

I’ll avoid editing generated backend client/type files.

I do not expect a database migration for this version because the review can be computed from existing listing fields and existing market/sold-comps hooks.

## Approval behavior

I’ll keep the existing approve/request/reject mutations intact.

I’ll improve the gating so approvals are discouraged or blocked only for truly risky cases:
- Market review confirmation required when market data exists or price looks unusual
- Critical missing data clearly highlighted before approval
- “Approve anyway” remains possible where appropriate, but with context visible first

## Result

After this, Admin → Review Listings should feel like a complete quality review workflow:

1. Scan the listing quickly
2. See what is missing
3. Inspect photos
4. Compare against market intelligence and nearby sales
5. Check whether the buyer-facing page will look credible
6. Approve or request precise changes