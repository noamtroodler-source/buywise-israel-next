

## Plan: Redesign Neighborhood Guide for All Listing Pages

### What's Changing

The current `NeighborhoodContextCard` shows 8 verbose expandable sections with icons — way too much text. We're replacing it with a clean, single-paragraph narrative card using the content from the uploaded file, plus a "Best for" one-liner.

### 1. Database: Add `narrative` column

Add a `narrative` text column to `neighborhood_profiles` to store the 3-4 sentence description.

### 2. Import the 360 narratives

Create an edge function `import-neighborhood-narratives` that:
- Accepts the raw markdown text
- Parses `## City — Neighborhood` headers to extract each narrative paragraph and "Best for" line
- Upserts into `neighborhood_profiles` matching on `(city, neighborhood)`, setting the `narrative` column

Build a simple admin trigger on the existing import page (or a one-off call) to upload the MD file and populate data.

### 3. Redesign `NeighborhoodContextCard`

Replace the current 8-section layout with:

```
📍 Neighborhood Guide

"Baka has quietly become one of the most sought-after 
neighborhoods in Jerusalem..."

Best for: English-speaking families and olim looking 
for charm, walkability, and a strong Anglo community.
```

- Subtle `MapPin` icon + "Neighborhood Guide" label header
- Narrative in `text-sm leading-relaxed` italic style — warm, readable
- "Best for" as a small highlighted callout with `bg-primary/5` and primary text
- No icons per section, no accordions, no sources toggle
- Falls back to not rendering if no `narrative` exists

### 4. Wire into ProjectDetail.tsx

Add after the Location/map section, before "Questions to Ask the Developer":

```tsx
{project.neighborhood && (
  <MobileCollapsibleSection
    id="neighborhood-guide"
    title={`${project.neighborhood} Guide`}
    icon={<Compass className="h-5 w-5" />}
    summary="Know the neighborhood before you commit"
    alwaysStartClosed
  >
    <NeighborhoodContextCard
      city={project.city}
      neighborhood={project.neighborhood}
    />
  </MobileCollapsibleSection>
)}
```

PropertyDetail.tsx already has this wired — it just needs the component redesign.

### 5. Update hook

Add `narrative` to the `NeighborhoodProfile` interface. The query already selects `*` so no query change needed.

### Implementation Order

1. Migration: add `narrative` column
2. Edge function: parse MD and upsert narratives
3. Redesign `NeighborhoodContextCard` component
4. Add to `ProjectDetail.tsx`
5. Invoke edge function with the uploaded MD content to populate data

