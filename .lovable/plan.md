

## Plan: Enhance "Why This Developer" Card

Rewrite `src/components/project/ProjectDeveloperCard.tsx` to surface all available developer data in a structured, trust-building layout.

### Layout Structure

**1. Identity Strip** (existing, refined)
- Logo, Name + link, Verified badge, "Est. {year}", "{N} Projects"

**2. "At a Glance" Fact Chips** (new section)
- Horizontal wrap of `bg-muted rounded-full` pills, only rendered when data exists:
  - `is_publicly_traded` + `tase_ticker` → "Publicly Traded (TASE: {ticker})" with TrendingUp icon
  - `specialties[]` → one chip per specialty (e.g. "Residential", "Mixed-Use")
  - `regions_active[]` → "Active in {regions}" chip with MapPin icon
  - `company_size` → chip with Users icon
  - `company_type` → chip (e.g. "Public Company")
- Entire section hidden if no data exists for any chip

**3. Track Record** (new section, conditional)
- If `notable_projects[]` exists: "Notable Projects" label + comma-joined list
- If `completed_projects_text` exists: brief text block
- If `awards_certifications` exists: Award icon + text
- Labeled as developer-supplied: subtle "From the developer" muted text prefix
- Section hidden entirely if none of these fields have data

**4. Value Proposition** (existing, reframed)
- Keep the quoted italic text but add a small "From the developer:" muted label above it
- Falls back to `description` if no value_proposition

**5. Contact Actions** (existing, unchanged)
- Call / Email / Website / View All Projects

### File Changes

**`src/components/project/ProjectDeveloperCard.tsx`** — Full rewrite of card body with the new sections. New imports: `MapPin`, `Users`, `TrendingUp`, `Award` from lucide-react. No new components or files needed.

