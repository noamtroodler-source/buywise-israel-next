

## Convert Yellow Interactive/Decorative Elements to Primary Blue

Six files use yellow/amber for interactive or decorative elements (stars, trophies, ratings) rather than semantic warnings. All will be converted to the primary blue palette.

### Changes

| File | Element | Yellow Now | Blue After |
|------|---------|-----------|------------|
| `GlossaryTermCard.tsx` | Bookmark star button | `text-yellow-500 hover:text-yellow-600` | `text-primary hover:text-primary/80` |
| `ToolFeedback.tsx` | Star rating (hover/selected) | `fill-amber-400 text-amber-400` | `fill-primary text-primary` |
| `AngloFriendlinessScore.tsx` | Star rating display | `fill-amber-400 text-amber-400` | `fill-primary text-primary` |
| `AdminCitiesPage.tsx` | Featured city toggle star | `fill-yellow-400 text-yellow-400` / `text-yellow-500` | `fill-primary text-primary` / `text-primary` |
| `AgentLeaderboard.tsx` | Trophy icon + rank badge | `text-yellow-500 bg-yellow-50 border-yellow-200` | `text-primary bg-primary/10 border-primary/20` |
| `LeadQualityTab.tsx` | Trophy icon | `text-yellow-500` | `text-primary` |

### What Stays Yellow
All semantic warning/caution uses (admin status badges, budget alerts, tax caution boxes, pending states, verification warnings) remain unchanged.

### Technical Details

**`src/components/glossary/GlossaryTermCard.tsx`** -- line 81: change saved-state class from yellow to primary blue.

**`src/components/tools/shared/ToolFeedback.tsx`** -- line ~83: change star fill/stroke from `fill-amber-400 text-amber-400` to `fill-primary text-primary`.

**`src/components/city/AngloFriendlinessScore.tsx`** -- line ~62: change filled star colors from `fill-amber-400 text-amber-400` to `fill-primary text-primary`.

**`src/pages/admin/AdminCitiesPage.tsx`** -- find featured star toggle and replace yellow classes with primary blue equivalents.

**`src/components/agency/AgentLeaderboard.tsx`** -- line ~42 (rank 1 badge): change from `text-yellow-500 bg-yellow-50 border-yellow-200` to `text-primary bg-primary/10 border-primary/20`. Also update the Trophy icon color in the header from `text-yellow-500` to `text-primary`.

**`src/components/leads/LeadQualityTab.tsx`** -- change Trophy icon from `text-yellow-500` to `text-primary`.

