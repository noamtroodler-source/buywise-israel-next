

## Center Blog Filters and Category Pills

A quick layout update to `BlogFilters.tsx` to center-align the filter bar and category pills, giving the blog page a cleaner, more editorial feel.

### Changes

**File: `src/components/blog/BlogFilters.tsx`**

1. **Filter bar (search + dropdowns)**: Change the inner flex layout from `flex-col lg:flex-row` to centered with `justify-center` and `items-center`, so the search box, sort, city, and audience controls sit centered within the container.

2. **Category pills row**: Add `justify-center` to the scrollable category pills container so the 6 category buttons are centered rather than left-aligned.

3. **Active filters row**: Add `justify-center` so the active filter badges also sit centered beneath the pills.

No other files need changes -- the blog page container already constrains the width.

