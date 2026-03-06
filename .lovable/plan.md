

## Changes to NewVsResaleGuide.tsx

### 1. Replace "Choose Resale If..." card #3
**Remove:** "Location in an established neighborhood" (MapPin icon)
**Replace with:** "Simpler, more predictable transaction"
- Icon: `FileCheck` or `CheckCircle`
- Content: One negotiation, one closing, predictable timeline. No staged payments tied to construction milestones, no index linkage risk, no developer bankruptcy exposure. Lower transaction complexity overall.

### 2. Add developer risk callout after "Choose New If..." section
Insert a warning/callout card between "Choose New If..." and "Choose Resale If..." sections with heading like **"The other side of new construction"** — styled as a muted warning card (not alarmist, just real):

Four bullet points:
- **Punch list battles (Tekufat Bedek):** Getting defects fixed — plumbing, tiling, electrical — can drag on for months. Developers aren't always responsive, even reputable ones.
- **Sales agency ≠ developer:** The agency that sold you the apartment often has no power over the developer. When something goes wrong, you may not know who to call — or who's actually responsible.
- **Flipping restrictions:** Many developer contracts include clauses that limit resale before completion, or charge transfer fees. Read the fine print before assuming you can sell early.
- **Power imbalance:** You're one buyer with one lawyer against a company with a legal department. Disputes over finishes, delays, or spec changes rarely end quickly.

### Files changed
- `src/pages/guides/NewVsResaleGuide.tsx` — two edits (replace card #3, add new section after "Choose New If...")

