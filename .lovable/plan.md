

## Plan: Simplify Target Cities Step — Search + Popular Picks

### What's Changing

Replace the overwhelming 4-region city grid (Step 8) with a clean search-first design:

1. **Search input** at the top — autocompletes from the 25 whitelisted cities
2. **Popular picks** — 5-6 quick-select chips below: Tel Aviv, Jerusalem, Herzliya, Ra'anana, Modi'in, Netanya
3. **Selected cities** shown as dismissible chips below the search
4. All other cities accessible via search typing

### Visual Layout

```text
┌─────────────────────────────────┐
│ 🗺  Which areas are you         │
│    considering?                  │
│ We'll prioritize these...        │
│                                  │
│ ┌─ 🔍 Search cities... ────────┐│
│ │                               ││
│ └───────────────────────────────┘│
│  (autocomplete dropdown appears) │
│                                  │
│ Popular with international buyers│
│ [Tel Aviv] [Jerusalem] [Herzliya]│
│ [Ra'anana] [Modi'in] [Netanya]   │
│                                  │
│ Selected:                        │
│ [Tel Aviv ✕] [Herzliya ✕]       │
│                                  │
│ 2 cities selected                │
└─────────────────────────────────┘
```

### File Changes

**`src/components/onboarding/BuyerOnboarding.tsx`** — Replace lines ~984-1063 (the 4 regional group divs) with:

- A search `Input` with `Search` icon, filtering from the full 25-city list
- Autocomplete dropdown (same pattern as `CityAutocomplete.tsx` — inline dropdown, click to add)
- "Popular with international buyers" section with 6 Toggle chips for quick picks
- Selected cities rendered as dismissible chips (click ✕ to remove)
- Keep the existing `selectedCities` state and counter — no state changes needed

### Technical Details

- Reuses existing `Input` component + inline dropdown pattern from `CityAutocomplete.tsx`
- All 25 cities defined inline (already hardcoded in current step) — filtered by search query
- No new components or dependencies needed
- Toggle chips for popular cities use same styling as current step
- Search uses simple `toLowerCase().includes()` filtering

