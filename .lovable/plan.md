

# Clean Up "Buying a Property in Israel" Guide

## Changes

### 1. Remove redundant sections
- **Delete "Surprises" section** (lines 660-692): Every item here is already covered in the timeline stages or Big Picture. Pure repetition.
- **Delete "Decision Points" section** (lines 694-731): Generic tradeoffs ("rent first or buy now?") that aren't Israel-specific enough to justify a section. The timeline already contextualizes these.
- **Delete "Exit" section** (lines 733-781): Generic real estate advice. Not actionable for someone reading a "how to buy" guide.

### 2. Remove self-promotional "BuyWise helps you" boxes from timeline
- In the `StageCard` component (lines 343-353), remove the entire `buyWiseHelp` rendering block. These are marketing copy, not value for the reader.
- Remove the `buyWiseHelp` field from all 14 timeline stage data entries.

### 3. Remove the 3 pain-point cards in opener
- Delete the grid of 3 cards (lines 479-489): "Rooms are counted differently..." etc. These repeat Big Picture content and delay getting to the guide narrative.

### 4. Trim the Readiness Checklist
- Remove meta-items like "I can explain the 14-stage sequence start to finish" — that's about the guide, not about buying readiness.
- Keep 8 genuinely actionable items across 2 groups instead of 3.

### 5. Update nav sections
- Remove `surprises`, `decisions`, `exit` from `navSections` array since those sections are gone.

### 6. Rename "BuyWise Readiness Checklist" → "Readiness Checklist"
- Drop the brand name from section headers.

## What stays
- Hero section (clean, informative)
- Opener narrative paragraph (the "no single source of truth" text)
- Big Picture section (concise, unique facts)
- Buyer Status Reality Check (valuable, unique)
- Glossary (high-value reference)
- 14-stage Timeline (the core of the guide, minus BuyWise boxes)
- Readiness Checklist (trimmed)
- Bottom CTAs

## Net result
~914 lines → ~700 lines. Removes ~4 sections of redundant/generic content. Guide becomes: opener → big picture → buyer status → glossary → timeline → checklist → CTAs.

