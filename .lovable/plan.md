

# Phase E: Enhanced Empty States

## What
Replace plain-text empty states across agency pages with the existing `EnhancedEmptyState` component for consistent, engaging zero-data views with clear CTAs.

## Pages to update

| Page | Current empty state | New empty state |
|------|-------------------|-----------------|
| `AgencyAnalytics.tsx` (no agency) | Plain text "No Agency Found" | `EnhancedEmptyState` with BarChart3 icon, CTA to register |
| `AgencyFeatured.tsx` (no agency) | Plain text "No agency found." | `EnhancedEmptyState` with Star icon, CTA to /agency |
| `AgencyTeam.tsx` (no agency) | Plain text "No agency found." | `EnhancedEmptyState` with Users icon, CTA to /agency |
| `AgencyListings.tsx` (no agency) | Basic text + register button | `EnhancedEmptyState` with Building2 icon, CTA to register |
| `AgencyListings.tsx` (no listings) | Basic icon + text | `EnhancedEmptyState` with Home icon, suggestions list, CTA to add listing |
| `AgencyBlogManagement.tsx` (no posts) | Basic card with icon | `EnhancedEmptyState` with PenLine icon, suggestions, CTA to write article |

## How

For each page:
1. Import `EnhancedEmptyState` from `@/components/shared/EnhancedEmptyState`
2. Replace the inline empty-state markup with `<EnhancedEmptyState>` using appropriate props:
   - `icon` — contextual lucide icon
   - `title` / `description` — clear messaging
   - `primaryAction` — main CTA (link or onClick)
   - `suggestions` — helpful tips where relevant (listings, blog)
   - `variant="compact"` for inline empty states (inside cards), `"default"` for full-page

## Files touched
| File | Change |
|------|--------|
| `AgencyAnalytics.tsx` | Replace no-agency block (~lines 53-64) |
| `AgencyFeatured.tsx` | Replace no-agency block (~lines 16-24) |
| `AgencyTeam.tsx` | Replace no-agency block (~lines 54-62) |
| `AgencyListings.tsx` | Replace no-agency block (~lines 67-72) and no-listings block (~lines 236-249) |
| `AgencyBlogManagement.tsx` | Replace no-posts block (~lines 57-72) |

