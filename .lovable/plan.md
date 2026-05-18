# AI-Assisted Listing Kickstart

Goal: From the Agency Provisioning page, let you drop in any number of screenshots (Yad2, Madlan, agency PDFs, WhatsApp images, floor plans) plus a free-text description, and have AI extract every listing field it can — bedrooms, baths, size, price, rental vs resale, amenities, address — then open the standard agency listing wizard pre-filled with those values for you to review and submit.

## User flow

1. In `Admin → Agency Provisioning`, the new **"Add a listing manually"** card gets an additional primary button: **"Kickstart with AI"** (the existing "New listing" button stays as the empty-wizard path).
2. Clicking it opens a dialog:
   - **Photos / screenshots dropzone** — drag-and-drop multiple files (jpg/png/webp/pdf-page-as-image). Thumbnails shown, can remove individuals. No hard cap, soft warn after 12.
   - **Description textarea** — paste anything: Hebrew, English, broker WhatsApp blurb, MLS-style copy, voice-note transcript.
   - **Quick hints row** (optional, helps AI when photos are ambiguous): listing intent (Sale / Rent / Auto-detect), city pre-pick.
   - **Analyze** button.
3. Edge function runs Gemini 3 Flash vision with all images + the description text and a strict structured-output schema covering the wizard fields. Returns a `PropertyWizardData` partial plus a per-field confidence map and a list of "source notes" ("price read from Yad2 header", "bedrooms inferred from floor plan").
4. Result preview panel inside the dialog shows extracted values with confidence chips. You can edit any field inline, then click **"Open wizard with these values"**.
5. The extracted draft is written to the existing wizard draft key (`agency-property-wizard-draft`) and the route navigates to `/agency/properties/new`. Wizard loads pre-filled; uploaded images are attached to Step 4 (Photos) so they ride along into the listing.
6. You review step-by-step, fix anything the AI got wrong, and submit normally. No new submission path — same `useCreatePropertyForAgency` mutation.

## What the AI extracts

Mapped 1:1 to `PropertyWizardData`:

- **Basics**: title, property_type (apartment / penthouse / garden_apartment / duplex / house / etc.), listing_status (`for_sale` vs `for_rent` — auto-detected from "להשכרה / לשכירות" or "₪/month" cues, overridable), price (NIS, normalized from "$" or "₪" or "מיליון"), city + neighborhood + address (Hebrew → matched against city whitelist + neighborhood roster via `neighborhoodMatcher`).
- **Details**: bedrooms, additional_rooms (computed via Israeli room count standard from "5 חדרים"), bathrooms, size_sqm (with sqm_source = `agent_estimate` unless an explicit tabu/arnona reference appears), floor / total_floors, year_built, parking.
- **Features**: condition, ac_type, balcony/elevator/storage booleans, vaad_bayit_monthly, lease_term/furnished_status/pets_policy/agent_fee_required (rental only), features[] (mamad, sukkah balcony, accessible, renovated, etc. — using the existing Israeli listing fields vocabulary).
- **Description / highlights**: AI rewrites the source into the "Trusted Friend" voice in English (per brand voice memory), preserves any factual claim, flags anything it had to invent so you can delete.

Fields the AI is NOT allowed to invent: price (must appear in a photo or the text), address/city (must match the city whitelist), license/agent identity. Missing → left blank with a "needs human" note.

## Technical sketch (for engineering)

```text
src/
  components/admin/agency-provisioning/
    ManualAddListingSection.tsx          # adds 2nd button "Kickstart with AI"
    AiListingKickstartDialog.tsx         # new — dropzone, textarea, results panel
  lib/
    aiListingKickstart.ts                # client helper: uploads to storage, calls fn,
                                         # writes draft to localStorage, navigates
supabase/
  functions/
    ai-extract-listing/index.ts          # new — Gemini 3 Flash vision + Output.object
                                         # schema mirroring PropertyWizardData
                                         # uses createLovableAiGatewayProvider
```

- Images are uploaded to the existing property-images storage bucket under a temp prefix (`kickstart/<uuid>/...`) so we get stable URLs to feed Gemini and to pre-attach to Step 4 Photos. Anything not used in 24h is cleaned by a small cron (or we can skip cleanup for v1).
- Edge function: `verify_jwt = true`, admin role check via `has_role(auth.uid(), 'admin')`, returns `{ data, confidence, notes }`.
- Wizard hydration: extend the existing `loadFromSaved` path — already supports localStorage drafts; we only need to pre-populate it before navigation.
- No new tables, no schema migration. Reuses storage, wizard, mutation, validation.

## Out of scope (v1)

- Auto-submit without review (always lands in wizard for human approval).
- PDF parsing as documents (we treat PDFs as one image per page via a quick client-side rasterize — or punt to "upload pages as images" if rasterize is fiddly).
- Floor-plan dimensioning (sqm comes only from explicit numbers in the input, not from measuring the plan).

## Open question for you

Should the AI also try to **assign an agent** from the agency roster when it can read an agent name off the screenshot (e.g. Yad2 listing card shows "סוכן: David Cohen")? Default plan: yes, soft-match by name → if confident, pre-fill Step 1 (Assign Agent), else leave blank.
