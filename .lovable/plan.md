

# Buyer Journey Tracker

## Concept
A dedicated `/my-journey` page that acts as a personal purchase-stage dashboard. The buyer manually sets their current stage from 6 phases, and the platform surfaces exactly the right resources, tools, and actions for that stage — nothing more. This replaces the "everything at once" approach with contextual guidance.

## 6 Stages & What Surfaces At Each

| Stage | Key Label | Surfaced Content |
|-------|-----------|-----------------|
| **Researching** | "Understanding the market" | Buying guide, area pages, affordability calculator, city search |
| **Shortlisting** | "Narrowing down" | Saved properties, comparison tool, neighborhood guides, true cost calculator |
| **Viewing** | "Visiting properties" | Questions to ask guide, commute calculator, saved locations |
| **Offer** | "Making an offer" | Pre-signing checklist (document checklist filtered to "pre-purchase"), true cost calculator, readiness check |
| **Legal** | "Legal & contracts" | Professional directory filtered to lawyers, document checklist (legal stage), talking-to-professionals guide |
| **Completing** | "Closing & moving in" | Post-purchase document checklist, arnona info, congratulations state |

## Database Change
Add a `journey_stage` column to `buyer_profiles`:
```sql
ALTER TABLE buyer_profiles 
ADD COLUMN journey_stage TEXT DEFAULT 'researching';
```
No new table needed — this is a single user preference field on an existing table.

## New Files
- **`src/pages/MyJourney.tsx`** — The full page with stepper + stage content
- **`src/components/journey/JourneyStepper.tsx`** — Horizontal stepper showing all 6 stages, current highlighted, clickable to change
- **`src/components/journey/StageContent.tsx`** — Renders the right cards/links/tools for the active stage
- **`src/hooks/useBuyerJourneyStage.ts`** — Read/update `journey_stage` from `buyer_profiles`

## Page Design
1. **Top**: Horizontal stepper (icons + labels for each stage). Current stage is highlighted with primary color. All stages clickable (non-linear). On mobile: horizontal scroll with current stage centered.
2. **Stage header**: Title + encouraging subtitle ("You're exploring — here's what matters now")
3. **Content grid**: 2-column cards linking to existing resources. Each card has icon, title, description, and a link. Cards are curated per stage — not generated, hardcoded mapping.
4. **Progress insight**: A subtle line like "Most buyers spend 2-4 weeks at this stage" — psychological permission to slow down.
5. **Bottom CTA**: "When you're ready" nudge to advance, plus a "Not sure? Take the Readiness Check" link.

## Integration Points
- Add route `/my-journey` in App.tsx (lazy loaded, auth-protected)
- Add link in profile Overview tab (replace or complement the Research Journey card)
- Add "My Journey" to the profile command center nav or as a prominent card
- The existing `ReadinessCheckTool` already saves to `readiness_snapshot` — link from journey page

## Files to Modify
- `src/App.tsx` — Add `/my-journey` route
- `src/pages/Profile.tsx` — Add journey tracker card/link in Overview tab
- `src/hooks/useBuyerProfile.tsx` — Add `journey_stage` to the BuyerProfile interface

