

## Plan: City-aware property suggestions in Rent vs Buy calculator

### What changes

**1. Add `city` param to `useToolPropertySuggestions` hook** (`src/hooks/useToolPropertySuggestions.ts`)
- Add optional `city?: string` to the options interface
- Include `city` in query key
- When city is provided, add `.eq('city', city)` filter to the query

**2. Add `city` prop to `ToolPropertySuggestions` component** (`src/components/tools/shared/ToolPropertySuggestions.tsx`)
- Add optional `city?: string` prop
- Pass it through to the hook
- Update the "See all" link to include `&city=` when city is set

**3. Update `RentVsBuyCalculator.tsx` usage** (lines ~1177-1184)
- Pass `selectedCity` to `ToolPropertySuggestions`
- Dynamic title/subtitle based on whether city is selected:
  - With city: `"Properties in {city} near ₪{price}"` / `"Homes matching your search in {city}"`
  - Without city: `"Properties near ₪{price}"` / `"See what's available at this price point"`

### Files modified
- `src/hooks/useToolPropertySuggestions.ts`
- `src/components/tools/shared/ToolPropertySuggestions.tsx`
- `src/components/tools/RentVsBuyCalculator.tsx`

