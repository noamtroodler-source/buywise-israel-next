

## Plan: Add Sort Dropdown to Blog Filters

Add a compact sort dropdown next to the search bar, keeping the clean design. The sort options will be **Newest**, **Most Viewed**, and **Most Saved** — reusing the existing `sortBy` support already built into `useBlogPosts`.

### Layout

Search bar and sort dropdown on the same row. Search takes most of the width, sort sits to the right as a small Select dropdown. Category pills remain below unchanged.

```text
[ 🔍 Search articles...              ] [ Newest ▼ ]
[All] [Buying Process] [Legal & Tax] [Financing] ...
```

### Changes

**`src/components/blog/BlogFilters.tsx`**
- Add `sortBy` and `onSortChange` props (type `BlogSortOption`)
- Import `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` from shadcn
- Replace the centered search `div` with a flex row: search input (flex-1, max-w-md) + Select dropdown on the right
- Sort options: Newest, Most Viewed, Most Saved
- Style the Select to match the rounded/minimal design (rounded-xl, same height as search)

**`src/pages/Blog.tsx`**
- Add `sortBy` state (default `'newest'`)
- Pass `sortBy` and `onSortChange` to `BlogFilters`
- Pass `sortBy` to `useBlogPosts` filter object

No database or hook changes needed — `useBlogPosts` already supports `sortBy` with `'newest'`, `'most_viewed'`, and `'most_saved'` options.

