

# About Page Overhaul

## Problem
The current page is repetitive (mission statement appears 3 times in nearly identical wording), lacks the investor pitch's clarity about *the problem we solve*, has no human/trust signals, no SEO metadata, and uses a monotonous card-grid layout throughout.

## Changes

### 1. Add SEOHead
Add `<SEOHead>` with proper title/description/canonical for the About page.

### 2. Rewrite Hero — Lead with the Problem
Replace the current hero subtitle with language derived from the investor pitch: "Every international buyer faces the same problem: the only way in is through an agency. There's no trusted, neutral starting point." Then position BuyWise as the answer. Remove the duplicated mission statement.

### 3. Replace "If This Sounds Familiar" with "The Problem We Solve"
Reframe from emotional/therapy-speak to a clear problem statement. Use a single bold paragraph (like the investor pitch) instead of 3 italic quote cards. More direct, less hand-holding.

### 4. Add "We Are / We Are Not" Comparison Section
A two-column layout replacing the current "What BuyWise Actually Is" card grid (which repeats the mission *again*). Left column: what we are (neutral entry point, clarity layer, pro-agent). Right column: what we're not (brokerage, commission-based, replacement for professionals). Clear, scannable, no fluff.

### 5. Keep "What We Believe" Principles — Tighten Copy
The 4 principles are good. Keep them but remove redundant language that echoes earlier sections.

### 6. Rework Pro-Agent Section — Add Concrete Value
Keep the pro-agent positioning but add the investor pitch angle: "We do the lifting so agencies don't have to change how they operate — enhancing their listings, elevating their presentation, and ensuring buyers arrive informed and ready."

### 7. Remove "The Promise" Quote Section
It repeats the "six months" line already in the principles section and the "no pressure" message already in the CTA. Cut it entirely — the page is stronger without the repetition.

### 8. Add Social Proof / Traction Numbers
A small horizontal stats bar (e.g., "X calculations run", "X properties tracked", "X guides published"). Even placeholder numbers signal credibility. Place between principles and pro-agent sections.

### 9. Improve CTA — Add Guide Link
Add a third CTA button: "Read a Guide" linking to `/guides`, matching the editorial standard of guiding users toward education first.

### 10. Visual Variety
Break the card-grid monotony:
- Problem section: full-width text block, no cards
- "We Are / We Are Not": two-column list with check/X icons
- Stats: horizontal inline row
- Principles: keep existing 2x2 grid (it works here)

## File to Edit
- `src/pages/Principles.tsx` — full rewrite of content and layout structure

## No Breaking Changes
Same route, same component export, same Layout wrapper. Pure content and visual restructure.

