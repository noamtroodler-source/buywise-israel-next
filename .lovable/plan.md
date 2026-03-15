

# Phase H: Role Guards Audit

## Problem

Two gaps in route protection:

1. **All 14 `/agency/*` routes** (except `/agency/register`) use `<ProtectedRoute>` without `requiredRole="agent"`, meaning any logged-in user (even a plain buyer) can access agency dashboard, settings, team, etc. Compare with `/agent/*` and `/developer/*` routes which all use `requiredRole="agent"` / `requiredRole="developer"`.

2. **Agency-admin-only actions** (team management, settings, billing, import) have no client-side guard checking if the current user is the agency's `admin_user_id`. Any agent in the agency can currently access these pages.

## Changes

### 1. Add `requiredRole="agent"` to all agency routes (except register)

In `src/App.tsx`, update 13 routes from `<ProtectedRoute>` to `<ProtectedRoute requiredRole="agent">`:
- `/agency`, `/agency/analytics`, `/agency/settings`, `/agency/listings`, `/agency/properties/new`, `/agency/projects/new`, `/agency/properties/:id/edit`, `/agency/blog`, `/agency/blog/new`, `/agency/blog/:id/edit`, `/agency/billing`, `/agency/featured`, `/agency/import`, `/agency/team`

`/agency/register` stays as `<ProtectedRoute>` (no role required — that's how users become agents).

### 2. Add `isAgencyAdmin` flag to `useAgencyManagement`

Expose a computed boolean `isAgencyAdmin` from the existing hook by comparing `agency.admin_user_id === user.id`. This avoids a new hook.

### 3. Guard admin-only pages with redirect

Add an `isAgencyAdmin` check in admin-only pages. If the logged-in agent is not the agency admin, show a message or redirect to `/agency`:
- `AgencySettings.tsx`
- `AgencyTeam.tsx`
- `AgencyBilling.tsx`
- `AgencyImport.tsx`

These pages will show an `EnhancedEmptyState` with "Admin access required" and a CTA back to the agency dashboard.

## Files touched

| File | Change |
|------|--------|
| `src/App.tsx` | Add `requiredRole="agent"` to 13 agency routes |
| `src/hooks/useAgencyManagement.tsx` | Export `isAgencyAdmin` boolean |
| `src/pages/agency/AgencySettings.tsx` | Add admin guard |
| `src/pages/agency/AgencyTeam.tsx` | Add admin guard |
| `src/pages/agency/AgencyBilling.tsx` | Add admin guard |
| `src/pages/agency/AgencyImport.tsx` | Add admin guard |

