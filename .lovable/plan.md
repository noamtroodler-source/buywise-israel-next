

## Plan: Simplify Blog Filters (Option A)

Strip `BlogFilters` down to just **Search + Category pills**. Remove City, Audience, and Sort dropdowns.

### Changes

**`src/components/blog/BlogFilters.tsx`**
- Remove imports: `SlidersHorizontal`, `Sparkles`, `Badge`, `ScrollArea`, `ScrollBar`, `Select*`, `Popover*`, `Checkbox`, `Label`, `BlogAudience`, `AUDIENCE_OPTIONS`
- Remove props: `cities`, `selectedCity`, `onCityChange`, `selectedAudiences`, `onAudienceChange`, `sortBy`, `onSortChange`
- Remove the entire filter bar container (sort, city, audience dropdowns) — keep only the search input
- Remove the "Active Filters" section (city/audience badges) — keep only category badge dismissal inline
- Layout: Search centered above category pills, clean and minimal

**`src/pages/Blog.tsx`**
- Remove the city/audience/sort state variables and their props passed to `BlogFilters`
- Remove `useBlogCities` import if no longer used elsewhere
- Keep the filtering logic for category and search only

