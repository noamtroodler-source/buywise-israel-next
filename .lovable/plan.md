

## Research Journey Widget

A compact, motivational card at the top of the Profile Activity column showing the user's property research progress.

---

### What It Shows

A single card with a summary line and 3 stat pills:

```text
[Search icon] Your Research Journey
"You've explored 12 properties across 3 cities over the past 2 weeks"

[12 Properties]  [3 Cities]  [Top: Ra'anana]
```

- **Properties researched**: Count of recently viewed properties
- **Cities explored**: Unique city count from viewed properties
- **Top city**: Most frequently viewed city
- **Time span**: Calculated from earliest to latest `viewed_at` timestamp (e.g., "2 weeks", "3 days")

### Display Rules

- Only shown for **logged-in users** (guests don't have persistent history worth celebrating)
- Only rendered when the user has viewed **3 or more** properties (avoids awkward "You've explored 1 property across 1 city")
- No empty state -- the widget simply doesn't appear below the threshold

### Where It Appears

- **Desktop**: Top of the right "Activity" column on the Profile page, above Search Alerts
- **Mobile**: After the welcome header, before Buyer Profile section (first content card)

---

### Technical Details

**New file:** `src/components/profile/ResearchJourneyCard.tsx`
- A single component that consumes `useRecentlyViewed()` 
- Derives stats from `recentProperties` (city counts) and `dbRecentlyViewed` timestamps
- Uses `date-fns` `formatDistanceToNow` or manual calculation for the time span
- Styled to match existing card pattern: `rounded-xl border border-border bg-card p-4`
- Subtle gradient or primary-tinted background to make it feel like an achievement card

**Modified file:** `src/hooks/useRecentlyViewed.tsx`
- Expose `dbRecentlyViewed` raw data (or just the `viewed_at` timestamps) so the widget can compute the research duration
- Minor change: add `viewedDates` to the return object (array of `viewed_at` strings from DB results)

**Modified file:** `src/pages/Profile.tsx`
- Import `ResearchJourneyCard`
- Desktop: Place above `<AlertsCompact />` in the right column
- Mobile: Place as second item after `<ProfileWelcomeHeader />`

**No database changes. No new hooks. No new dependencies.**

