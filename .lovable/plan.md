

# Trusted Professionals Page & Detail Pages

This plan creates a curated "Trusted Professionals" directory with individual profile pages for each firm, following existing design patterns from the Principles, Agencies, and Agent Detail pages.

---

## Architecture Overview

Two new pages, one new database table, one new component directory.

```text
/professionals              - Directory page (curated list by category)
/professionals/:slug        - Individual firm profile page
```

Data is stored in a `trusted_professionals` table managed via admin. No public submission form for now -- firms are added manually (or later via an application flow).

---

## 1. Database: `trusted_professionals` Table

Create a new table to store professional firms:

```sql
CREATE TABLE public.trusted_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,  -- 'lawyer', 'mortgage_broker', 'accountant'
  company text,
  logo_url text,
  description text,        -- Short factual description
  long_description text,   -- Extended bio for detail page
  languages text[] DEFAULT '{}',
  website text,
  email text,
  phone text,
  whatsapp text,
  booking_url text,        -- Link to book / schedule
  specializations text[] DEFAULT '{}',
  cities_covered text[] DEFAULT '{}',
  works_with_internationals boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  display_order int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Public read access (this is a public-facing directory)
ALTER TABLE public.trusted_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published professionals"
  ON public.trusted_professionals FOR SELECT
  USING (is_published = true);

-- Admin write access
CREATE POLICY "Admins can manage professionals"
  ON public.trusted_professionals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

Fields like `reviews`, `pricing_range`, `service_areas` (polygon), `application_status` are intentionally omitted -- future-proofing without premature complexity.

---

## 2. Directory Page: `/professionals`

**New file: `src/pages/Professionals.tsx`**

Design follows the Principles page pattern (hero with gradient, sectioned content) combined with the Agencies grid pattern (cards with logos).

### Sections:

**Hero** (gradient background, centered text):
- Title: "Trusted Professionals"
- Subtitle: Calm, factual -- "Buying in Israel requires multiple experts. Language, law, banking, and taxes work differently here. These are professionals that international buyers have successfully worked with."
- No hype. Matches brand voice.

**Category Sections** (3 for launch):
Each category rendered as a titled section with a short intro line and a grid of professional cards.

1. **Lawyers** -- "Navigate contracts, due diligence, and title registration"
2. **Mortgage Brokers** -- "Understand financing options and secure the right terms"
3. **Accountants & Tax Advisors** -- "Plan for purchase tax, capital gains, and cross-border obligations"

**Professional Card** (within each category):
- Logo (or fallback icon) on the left
- Name + company
- Short description (1-2 lines, factual tone)
- Language badges
- "Works with international buyers" badge (if true)
- Click navigates to `/professionals/:slug`

**Trust Disclaimer** (bottom):
A styled box (similar to the Principles page "promise" section):
> "BuyWise connects buyers with professionals many internationals have successfully worked with. Buyers should always evaluate which advisor is right for their personal situation."

**CTA** (bottom):
- "Looking for a specific type of professional?" link to Contact page
- SupportFooter component

---

## 3. Detail Page: `/professionals/:slug`

**New file: `src/pages/ProfessionalDetail.tsx`**

Follows the Agent Detail page pattern but simplified (no listings/stats tabs).

### Sections:

**DualNavigation**: Back button + "Trusted Professionals" parent link

**Hero Card**:
- Logo (larger, 80x80) + Name + Company
- Category badge ("Lawyer", "Mortgage Broker", etc.)
- "Works with international buyers" badge
- Language badges
- City/area badges

**Contact Actions** (right side on desktop, full-width on mobile):
- WhatsApp button (if phone provided)
- Email button
- "Visit Website" button (if URL provided)
- "Book Consultation" button (if booking_url provided)

**About Section**:
- `long_description` rendered as prose text
- Specializations as badges

**Trust Footer**:
Same disclaimer as directory page, inline variant.

---

## 4. Data Hook

**New file: `src/hooks/useTrustedProfessionals.ts`**

```typescript
// useTrustedProfessionals() - fetch all published, ordered by display_order
// useTrustedProfessional(slug) - fetch single by slug
// useProfessionalsByCategory(category) - fetch by category
```

Uses `@tanstack/react-query` with standard patterns from existing hooks.

---

## 5. Component Structure

**New directory: `src/components/professionals/`**

- `ProfessionalCard.tsx` -- Card used in the directory grid (logo, name, description, badges)
- `ProfessionalHero.tsx` -- Hero section for the detail page
- `ProfessionalContactCard.tsx` -- Contact sidebar/actions for detail page

---

## 6. Routing & Navigation

**`src/App.tsx`**: Add two routes:
```
<Route path="/professionals" element={<Professionals />} />
<Route path="/professionals/:slug" element={<ProfessionalDetail />} />
```

**`src/lib/routes.ts`**: Add `PROFESSIONALS: '/professionals'`

**`src/lib/navigationConfig.ts`**: Add "Trusted Professionals" link to the "More" nav or to the Buy/Rent mega-menus under a relevant column.

**`src/components/layout/Footer.tsx`**: Add link in the appropriate footer column.

---

## 7. SEO

**`src/lib/seo/`**: Add `generateProfessionalMeta()` and `generateProfessionalJsonLd()` (using `ProfessionalService` schema type).

Both pages get `SEOHead` with proper title, description, and canonical URL.

---

## 8. Design Standards Compliance

- Blue and neutral palette only (no yellow/amber except warnings)
- `object-cover` on all avatar/logo images
- `motion` fade-in animations matching Principles page
- `SupportFooter` at bottom of directory page
- Mobile-first responsive grid (1 col mobile, 2 col tablet, 3 col desktop for cards)
- Cards use `hover:border-primary/30` transition pattern
- Warm Professional brand voice throughout

---

## Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Database migration | SQL migration |
| 2 | Data hooks | `src/hooks/useTrustedProfessionals.ts` |
| 3 | Shared components | `src/components/professionals/ProfessionalCard.tsx`, `ProfessionalHero.tsx`, `ProfessionalContactCard.tsx` |
| 4 | Directory page | `src/pages/Professionals.tsx` |
| 5 | Detail page | `src/pages/ProfessionalDetail.tsx` |
| 6 | SEO utilities | `src/lib/seo/` updates |
| 7 | Routing + navigation | `App.tsx`, `routes.ts`, `navigationConfig.ts`, `Footer.tsx` |

