

## Plan: Unsupported City Error + Neighborhood Searchable Dropdown

### Current State
- The `AddressAutocomplete` component **already validates** the selected address against the 25 supported cities and shows an error if unsupported (lines 170-178, 306-313). This is working.
- The City field is a plain `<Input>` that auto-fills from the address — this is fine.
- The Neighborhood field is a plain `<Input>` — needs to become a searchable dropdown.

### Changes

**1. Create `NeighborhoodAutocomplete` component** (`src/components/agent/wizard/NeighborhoodAutocomplete.tsx`)
- Similar pattern to `CityAutocomplete` — an input with a dropdown overlay
- Props: `value`, `onValueChange`, `cityName` (to scope neighborhoods), `placeholder`
- Uses `useNeighborhoodNames(cityName)` to fetch the neighborhood list for the selected city
- Searchable: typing filters the list; clicking or scrolling to select
- Shows all neighborhoods on focus (scrollable, max-h-60)
- Matches BuyWise design: `h-11 rounded-xl`, `bg-background border border-border rounded-xl shadow-lg`, check icon for selected item, `hover:bg-muted/50` — same as `CityAutocomplete`
- Resets value when city changes (if current neighborhood isn't in new city's list)

**2. Update `StepBasics.tsx`** (lines 256-269)
- Replace the plain `<Input>` for Neighborhood with the new `<NeighborhoodAutocomplete>` component
- Pass `cityName={data.city}` to scope the dropdown
- Keep the "Neighborhood is required" error message

**3. Improve the unsupported city error message** (in `AddressAutocomplete.tsx` lines 306-313)
- Make the error more descriptive — list a few example supported cities so agents understand the restriction
- Change from: `"{city}" is not a supported city. Please choose an address in one of our 25 focus cities.`
- To: `"BuyWise Israel currently operates in 25 cities. "{city}" is not yet supported. Please select an address in a supported city (e.g., Tel Aviv, Jerusalem, Herzliya, Ra'anana)."`

### Technical Details
- `useNeighborhoodNames` hook already exists and fetches neighborhoods from the `cities` table by city name
- The dropdown follows the exact same pattern as `CityAutocomplete`: ref-based outside click, input filtering, keyboard escape support
- When the city changes (via address selection), the neighborhood auto-fill from Google Places will still work — but the agent can override it with the dropdown

