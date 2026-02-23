
# Show Agency Logo Instead of Agent Avatar on Map Listing Popups

## What Changes

The small circular profile picture on the map listing popup (bottom-right of the image carousel) currently shows the agent's personal avatar. This will be changed to show the agency's logo instead, falling back to the agent's avatar if no agency logo exists.

## Technical Approach

### 1. Extend the database query to include agency logo

The property queries currently use `agent:agents(*)` which fetches all agent fields but not the related agency data. This needs to change to a nested select that also grabs the agency's `logo_url`:

```
agent:agents(*, agency:agencies(id, name, logo_url))
```

This change applies to:
- `src/hooks/usePaginatedProperties.tsx` (used by the map search)
- `src/hooks/useProperties.tsx` (used by listings pages, detail page, etc.)

### 2. Update the Agent type

Add an optional nested `agency` field to the `Agent` interface in `src/types/database.ts`:

```ts
export interface Agent {
  // ... existing fields ...
  agency_id: string | null;
  agency?: { id: string; name: string; logo_url: string | null } | null;
}
```

### 3. Update the overlay components to prefer agency logo

In `MapPropertyOverlay.tsx` and `MapPropertyPopup.tsx`, change the avatar source from `agent.avatar_url` to `agent.agency?.logo_url ?? agent.avatar_url`, so it shows the agency logo when available and falls back to the agent's own photo.

## Files Modified

| File | Change |
|------|--------|
| `src/types/database.ts` | Add `agency_id` and optional `agency` nested type to `Agent` interface |
| `src/hooks/usePaginatedProperties.tsx` | Change select from `agent:agents(*)` to `agent:agents(*, agency:agencies(id, name, logo_url))` |
| `src/hooks/useProperties.tsx` | Same select change across all property queries |
| `src/components/map-search/MapPropertyOverlay.tsx` | Use `agent.agency?.logo_url` as primary avatar source |
| `src/components/map-search/MapPropertyPopup.tsx` | Same avatar source change |
