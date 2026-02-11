

# Replace "Not specified" with "Not provided — ask the agent"

## What We're Changing
Three places in `PropertyQuickSummary.tsx` where missing data currently shows "Not specified" will instead show a contextual nudge that turns missing data into a soft CTA toward the agent contact form.

## Changes (all in `src/components/property/PropertyQuickSummary.tsx`)

### 1. Floor display (line 207)
Change `'Not specified'` to `'Ask the agent'`

### 2. Condition display (line 215)
Change `'Not specified'` to `'Ask the agent'`

### 3. Year built (line 507)
Change `'Not specified'` to `'Ask the agent'`

## Styling
The "Ask the agent" text will use `text-muted-foreground` styling (already inherited from parent) so it reads as a subtle hint rather than an alert. No link, no button -- just honest text that signals "this info exists, the agent has it."

## Scope
- Only `PropertyQuickSummary.tsx` (user-facing listing detail)
- NOT touching `PropertyPreviewDialog.tsx` (agent's own preview -- they should see "Not specified" as a nudge to fill it in themselves)
- No new files, no backend changes

