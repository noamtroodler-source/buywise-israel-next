
# Semantic Color Update for Agent and Developer Performance Trends

## Overview
Update the trend indicators in both portals to use semantic color tokens, with a strategic approach: celebrate positive trends with green, and keep negative trends neutral (muted) rather than alarming red.

## Strategy: "Honest but not alarming"
- Positive trends (up arrow + percentage): solid semantic green text
- Neutral trends (no change): muted foreground (unchanged)
- Negative trends (down arrow + percentage): muted foreground instead of red -- the down arrow already communicates the direction, no need for red to amplify it

This keeps things honest (numbers and arrows are visible) without making the dashboard feel like a warning screen when metrics dip.

## Changes

### 1. Agent PerformanceInsights.tsx
**File:** `src/components/agent/PerformanceInsights.tsx`

Line 103: Replace `text-green-600` with `text-semantic-green` and `text-red-500` with `text-muted-foreground`

### 2. Developer DeveloperPerformanceInsights.tsx  
**File:** `src/components/developer/DeveloperPerformanceInsights.tsx`

Lines 38-40: Replace `bg-primary/10 text-primary` (positive) with `bg-semantic-green text-semantic-green-foreground`, and keep `bg-muted text-muted-foreground` for negative/neutral (already neutral, no change needed)

## What's NOT changing
- Agency portal: no semantic color spots found
- Renewal badges: don't exist in agent components
- Changes Requested badges: only in admin review cards (not agent/developer-facing)
- Wizards: no status indicators to update

Total: 2 files, text color swaps only.
