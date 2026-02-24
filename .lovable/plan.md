

## Upgrade Professional Detail Pages: Differentiation, Social Proof, and Process Clarity

Three targeted improvements that transform generic directory listings into compelling, firm-specific profiles.

---

### 1. Replace Generic "Why This Firm" with Curated Selling Points

**Problem:** The current system auto-generates highlights from data fields (languages, city count, specializations). Every firm looks the same.

**Solution:** Add a `key_differentiators` column -- a text array of 2-4 hand-written, firm-specific value propositions that you control.

Examples:
- "Handled 200+ Anglo purchases in Jerusalem"
- "Only firm offering fixed-fee closings"
- "Former Bank Leumi mortgage dept. manager"

**How it works:**
- New DB column: `key_differentiators text[]` (nullable)
- If `key_differentiators` has entries, display those instead of the auto-generated highlights
- If empty, fall back to the current auto-generated logic (so nothing breaks for unfilled profiles)
- Rename the section header from "Why this firm" to "What sets them apart"
- Each differentiator displayed as a clean text bullet with a subtle accent-colored check icon

**Files changed:**
- DB migration: add `key_differentiators` column
- `useTrustedProfessionals.ts`: add field to interface
- `ProfessionalHighlights.tsx`: prioritize curated differentiators over auto-generated ones

---

### 2. Multiple Testimonials with Context

**Problem:** Single testimonial slot with no context about who said it or what service they used.

**Solution:** A new `professional_testimonials` table supporting multiple reviews per professional, each with buyer context.

**Database design:**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid (PK) | |
| `professional_id` | uuid (FK) | Links to trusted_professionals |
| `quote` | text | The testimonial text |
| `author_name` | text | Attribution name |
| `author_context` | text | e.g., "First-time buyer from New York" or "Investor, 3 properties" |
| `service_used` | text | e.g., "Contract review", "Mortgage approval" |
| `display_order` | integer | Sort order |

- RLS: public read (matches parent table pattern)
- Existing `testimonial_quote` / `testimonial_author` fields on the main table will be migrated into this new table (keeping backward compat until data is moved)
- UI: Replace the single testimonial card with a new section showing up to 3 testimonials in a clean vertical stack, each with the quote, author name, their context badge, and service-used badge
- If only 1 testimonial exists, it renders exactly like the current card (no visual regression)

**Files changed:**
- DB migration: create `professional_testimonials` table with RLS
- New hook: `useProfessionalTestimonials.ts`
- `ProfessionalTestimonialCard.tsx`: refactored to support multiple testimonials with context badges

---

### 3. "What to Expect" Process Section

**Problem:** International buyers don't know how Israeli professionals work -- consultation fees, engagement models, timelines, and response times are invisible.

**Solution:** Add a `process_steps` JSONB column for structured engagement info, plus a `consultation_type` field for the quick headline.

**Database columns:**

| Column | Type | Example |
|--------|------|---------|
| `consultation_type` | text | "Free initial consultation" or "Paid consultation (250 ILS)" |
| `response_time` | text | "Within 24 hours" or "Same business day" |
| `engagement_model` | text | "Fixed fee" or "Percentage-based" or "Hourly rate" |
| `process_steps` | jsonb | Array of {step, description} objects |

Example `process_steps` value:
```text
[
  {"step": "Free intro call", "description": "30-min call to understand your needs"},
  {"step": "Document review", "description": "We review the contract and flag issues"},
  {"step": "Negotiation", "description": "We negotiate terms on your behalf"},
  {"step": "Closing", "description": "Title registration and key handover"}
]
```

**UI:** A new "How It Works" card placed between the About section and Testimonials on the detail page:
- Top row: quick-glance badges for consultation type, response time, and engagement model (only shown when populated)
- Below: numbered vertical step list (1, 2, 3, 4) with step title and description
- Styled with the firm's accent color for step numbers
- Only renders when at least one field is populated

**Files changed:**
- DB migration: add 4 columns to `trusted_professionals`
- `useTrustedProfessionals.ts`: add fields to interface
- New component: `ProfessionalProcessCard.tsx`
- `ProfessionalDetail.tsx`: add the new card between About and Testimonials

---

### Summary of Database Changes

Single migration adding:
- `trusted_professionals.key_differentiators` (text[])
- `trusted_professionals.consultation_type` (text)
- `trusted_professionals.response_time` (text)
- `trusted_professionals.engagement_model` (text)
- `trusted_professionals.process_steps` (jsonb)
- New table `professional_testimonials` with public-read RLS

### Section Order on Detail Page (after changes)

1. Hero card (name, logo, category, social links, languages, cities)
2. "What Sets Them Apart" (curated differentiators or auto-generated fallback)
3. About (long_description)
4. How It Works (process steps, consultation type, engagement model)
5. Client Testimonials (multiple, with context)
6. Specializations
7. Trust disclaimer

