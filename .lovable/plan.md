

## Standardize Terminology to "Projects" Site-Wide

### Scope

After auditing the full codebase, there are **~30 instances** across **~20 files** where "New Development(s)" or "New Construction" is used to label platform features (cards, badges, section headers, descriptions). These should all say "Projects" or "New Project."

**Important distinction:** The guide titled *"New Construction vs Resale"* is an educational concept about property types — not a platform label. Renaming that to "Projects vs Resale" would be confusing. I'll leave guide *content* that discusses the real estate concept of new construction intact, and only change labels/badges/descriptions that refer to the platform's project listings.

### Changes by File

| File | Current Text | New Text |
|------|-------------|----------|
| `ProjectsHighlight.tsx` | "New Developments" heading, "New Project" badges | "Projects" heading, keep "New Project" badges (they're accurate) |
| `MapProjectCard.tsx` | Badge: "New Development" | "New Project" |
| `MapProjectOverlay.tsx` | Badge: "New Development" | "New Project" |
| `Index.tsx` | SEO description: "new developments" | "projects" |
| `HeroPreview.tsx` | "looking for new developments" | "looking for projects" |
| `Favorites.tsx` | "Browse new developments" | "Browse projects" |
| `DeveloperDashboard.tsx` | "New Development Showcase", "new development listing" | "Project Showcase", "project listing" |
| `PlatformStats.tsx` | description: "New developments" | "New projects" |
| `ProfessionalTypeChooser.tsx` | "new development projects" | "projects" |
| `GetStarted.tsx` | "new construction projects" | "projects" |
| `Developers.tsx` | "new construction projects" | "projects" |
| `Guides.tsx` | Guide title: "New Construction vs Resale" | "New Projects vs Resale" |
| `metaGenerators.ts` | "New Development in {city}" | "New Project in {city}" |
| `ProjectQuickSummary.tsx` | "New development in" | "New project in" |
| `AdminProjects.tsx` | "new construction projects" | "projects" |
| `AdminFeatured.tsx` | "New development projects" | "Projects" |
| `ListingsGuide.tsx` | "new developments" | "projects" |
| `BuyingInIsraelGuide.tsx` | "New Construction" link label | "New Projects vs Resale" |
| `ListingFeedback.tsx` | "new development listings" | "project listings" |
| `DeveloperOnboardingProgress.tsx` | "new development" | "project" |
| `AgentProfileStep.tsx` | specialization "New Construction" | "New Projects" |
| `seed-demo-data` | "New developments" specialization | "New projects" |
| `process-retention-emails` | "New Construction vs Resale" title | "New Projects vs Resale" |
| `TermsOfService.tsx` | "New development project information" | "Project information" |

### What stays unchanged
- Guide **content** discussing new construction as a real estate concept (legal structures, payment schedules, Madad indexation, etc.)
- The URL `/guides/new-vs-resale` (no need to break links)
- Internal admin tools for data import (`ImportGovMapData.tsx`) where "New Construction" is a data classification filter
- Property cost breakdown explanations about developer fees for new construction purchases
- `ReadinessCheckTool.tsx` checklist items about understanding new vs resale (educational context)

### Estimated scope
~20 files, text-only changes — no logic or structural modifications.

