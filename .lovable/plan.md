

## Plan: Rearrange Project Wizard StepBasics — Address-first flow with smart City/Neighborhood auto-fill

### Current State
`StepBasics.tsx` has: Project Name → City (dropdown) → Neighborhood → Street Address → Map → Status.

The City field is a plain `<Select>` dropdown (no search/typing). The address autocomplete already extracts city and neighborhood from Google Places, but city must be selected first.

### Proposed Changes

**1. Reorder fields** in `StepBasics.tsx`:
```
Project Name → Street Address + Map → City (searchable) → Neighborhood (searchable) → Status
```

**2. Replace City `<Select>` with `<CityAutocomplete>`**
- Already exists at `src/components/agent/wizard/CityAutocomplete.tsx` — type-to-search, filters from `useCities()`.

**3. Smart auto-fill from address selection**
- Update `handleAddressSelect` to auto-fill city (using `matchedSupportedCity`) and neighborhood.
- For neighborhood: check if the Google-extracted neighborhood matches any name in our database (via `useNeighborhoodNames`). If it matches, auto-fill it. If not, leave it blank so the user must pick from the searchable neighborhood dropdown.
- Remove the `selectedCity` constraint from `AddressAutocomplete` since city now comes *after* address — the address will *set* the city, not be validated against it.

**4. Neighborhood stays as `<NeighborhoodAutocomplete>`** (already searchable) — just ensure it's scoped to the auto-filled/selected city.

### Files to Edit

| File | Change |
|------|--------|
| `src/components/developer/wizard/steps/StepBasics.tsx` | Reorder fields, swap `<Select>` for `<CityAutocomplete>`, add neighborhood matching logic from address, remove `selectedCity` prop from `AddressAutocomplete` |

Single file change. All components (`CityAutocomplete`, `NeighborhoodAutocomplete`, `AddressAutocomplete`) already exist and support search.

