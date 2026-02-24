

## Enhance Trusted Professional Detail Pages

Two phases: quick wins using existing data, then a database migration for social links, founded year, and testimonials.

---

### Phase 1: Quick Wins (No Database Changes)

**1. Add Share Profile button to sidebar**
- Import and add `ProfileShareMenu` to the `ProfessionalContactCard` component (same component used on Agent/Agency pages)
- Place it below the existing contact buttons

**2. Promote "Works with internationals" as a visible badge**
- In `ProfessionalDetail.tsx`, show a prominent badge next to the category badge when `works_with_internationals` is true
- Styled with the accent color, using a Globe icon

**3. Promote Website link to hero area**
- Add a small "Visit Website" button in the hero card (next to the category badge row) so it's visible without scrolling to the sidebar
- Keep the existing website button in the sidebar contact card too

### Phase 2: Database Migration + UI Updates

**4. Add new columns to `trusted_professionals` table**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `linkedin_url` | text | null | LinkedIn profile |
| `instagram_url` | text | null | Instagram profile |
| `facebook_url` | text | null | Facebook page |
| `founded_year` | integer | null | Year established |
| `office_address` | text | null | Physical office location |
| `testimonial_quote` | text | null | Client testimonial text |
| `testimonial_author` | text | null | Testimonial attribution |

**5. Update `TrustedProfessional` interface**
- Add all 7 new fields to the TypeScript interface in `useTrustedProfessionals.ts`

**6. Social links in hero section**
- Display LinkedIn, Instagram, Facebook icons in the hero card (same pattern as Agency/Agent detail pages)
- Only render if at least one social URL exists

**7. "Established" year in hero**
- Show "Est. 2015" text below the company name when `founded_year` is populated

**8. Office address in sidebar**
- Add a MapPin row below the contact buttons in `ProfessionalContactCard` showing the office address

**9. Client testimonial card**
- New section between "About" and "Specializations" on the detail page
- Simple blockquote card with the testimonial quote and author attribution
- Only renders when `testimonial_quote` is populated

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useTrustedProfessionals.ts` | Add 7 new interface fields |
| `src/pages/ProfessionalDetail.tsx` | Add social links, founded year, website button in hero, "works with internationals" badge, testimonial card |
| `src/components/professionals/ProfessionalContactCard.tsx` | Add ProfileShareMenu, office address row |

### Database Migration

Single SQL migration adding 7 nullable columns to `trusted_professionals`. No RLS changes needed (table is already public-read).

