

## Firm Personality Colors

Add a unique brand accent color to each professional's profile, creating a subtle visual identity that makes each card and detail page feel "owned" rather than generic.

### What you'll see

**On the listing cards** (`/professionals`):
- A thin 3px left border in each firm's brand color
- The logo background circle tinted with that firm's color instead of the generic primary blue

**On the detail page** (`/professionals/:slug`):
- A soft gradient banner across the top of the hero card using the firm's color at ~5% opacity
- The category badge tinted with the firm's accent color
- The logo background uses the firm's color

### Color assignments (curated per firm)

| Firm | Color | Rationale |
|------|-------|-----------|
| Cohen, Levy & Partners | `#1B4D6E` | Navy — classic legal authority |
| Adv. Sarah Goldstein | `#6B4C9A` | Purple — distinctive, modern counsel |
| Shapira Legal Group | `#2C5F3F` | Forest green — stability, trust |
| Ben-David & Associates | `#8B5A2B` | Warm brown — approachable, grounded |
| Israel Mortgage Advisors | `#0E6B5C` | Teal — financial confidence |
| FirstHome Finance | `#D4761C` | Warm orange — first-time buyer energy |
| Global Lending IL | `#2A5CAA` | Blue — global, institutional |
| Aliyah Mortgage Solutions | `#1A7A4F` | Green — growth, new beginnings |
| Katz & Co. Accounting | `#4A4A4A` | Charcoal — precision, seriousness |
| Stern Tax Advisory | `#7B3B3A` | Burgundy — established, premium |
| Levi Financial Partners | `#2E5B8A` | Steel blue — corporate finance |
| Dvora Mizrachi, CPA | `#8A6B3D` | Gold-brown — personal, warm expertise |

---

### Technical details

**1. Database migration** -- Add `accent_color` column to `trusted_professionals`:
```sql
ALTER TABLE trusted_professionals ADD COLUMN accent_color TEXT DEFAULT NULL;
```
Then populate with the curated colors above via UPDATE statements.

**2. Update TypeScript type** -- Add `accent_color` to the `TrustedProfessional` interface in `useTrustedProfessionals.ts`.

**3. Create helper** -- A small `professionalColors.ts` with a hardcoded fallback map (so colors work even before DB values load), plus a `getAccentColor(professional)` function that prefers DB value, falls back to the map, then falls back to the theme primary.

**4. Update `ProfessionalCard.tsx`**:
- Add `borderLeft: 3px solid ${accentColor}` inline style on the Card
- Tint the logo container background with `${accentColor}10` (6% opacity)

**5. Update `ProfessionalDetail.tsx`**:
- Add a gradient overlay on the hero card: `background: linear-gradient(135deg, ${accentColor}08, transparent)`
- Tint the category badge and logo background with the accent color
- Keep all other UI unchanged

**Files modified:**
- `src/hooks/useTrustedProfessionals.ts` (add `accent_color` to interface)
- `src/components/professionals/professionalColors.ts` (new file -- fallback map + helper)
- `src/components/professionals/ProfessionalCard.tsx` (left border + logo tint)
- `src/pages/ProfessionalDetail.tsx` (hero gradient + badge tint)
- Database migration (add column + seed colors)
