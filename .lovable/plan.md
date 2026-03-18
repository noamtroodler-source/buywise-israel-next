

## Redesign: New Developments → Horizontal Card Strip

Replace the current bento/hero layout with a clean, compact horizontal scroll of equal-sized cards. Target height: ~320px total (down from ~500px+).

### Layout
```text
┌─────────────────────────────────────────────────────────┐
│  New Developments                          ← → View All │
├────────┬────────┬────────┬────────┬─────────────────────┤
│ [img]  │ [img]  │ [img]  │ [img]  │  (peek next card)   │
│        │        │        │        │                     │
│ Name   │ Name   │ Name   │ Name   │                     │
│ 📍City │ 📍City │ 📍City │ 📍City │                     │
│ From ₪X│ From ₪X│ From ₪X│ From ₪X│                     │
└────────┴────────┴────────┴────────┴─────────────────────┘
```

### Design Details
- **Card structure**: Image on top (aspect-[4/3], ~200px), white info area below (~100px) with name, location, price
- **Desktop**: Show 4 cards in a row, no carousel needed (or subtle horizontal scroll if >4)
- **Mobile**: Horizontal scroll with 1.5 cards visible, progress bar below
- **Favorite button**: Stays on image top-right
- **Hover**: Subtle image zoom + card shadow lift
- **No hero/bento distinction** — all cards are equal size

### File Changes
- **`src/components/home/ProjectsHighlight.tsx`**: Full rewrite of the component. Remove hero/side logic, remove desktop bento grid. Replace with a simple horizontal card row. Card redesign: image block on top, info on white/card background below (not overlaid on image).

### What stays the same
- `useFeaturedProjects` hook — no changes
- `ProjectFavoriteButton` — reused as-is
- `PropertyThumbnail` — reused as-is
- Mobile carousel with Embla + progress bar — kept but with new card design
- Header with title, subtitle, nav arrows, View All button

