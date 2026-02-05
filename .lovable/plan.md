
# Move "Questions to Ask" After Location Section

## The Change

Reorder the detail page sections so "Questions to Ask" appears after Location but before Next Steps on all listing types.

## New Section Order

| # | Section | Status |
|---|---------|--------|
| 1 | Hero | No change |
| 2 | Quick Summary | No change |
| 3 | Description & Amenities | No change |
| 4 | Floor Plans / Property Details | No change |
| 5 | Cost Breakdown | No change |
| 6 | Timeline (projects only) | No change |
| 7 | Location | No change |
| 8 | **Questions to Ask** | ← Moved here |
| 9 | Next Steps | No change |
| 10 | Feedback, FAQ, Agent, Developer | No change |

## Files to Update

| File | Change |
|------|--------|
| `src/pages/ProjectDetail.tsx` | Move `ProjectQuestionsToAsk` after `PropertyLocation` |
| `src/pages/PropertyDetail.tsx` | Move `PropertyQuestionsToAsk` after `PropertyLocation` |

## Why This Works

1. **Context before questions** - Users understand the property/project fully before seeing what to ask
2. **Natural lead-in to action** - Questions prime users for the Next Steps and agent contact
3. **Scroll depth signal** - Users who reach this section are highly engaged and ready to take action
