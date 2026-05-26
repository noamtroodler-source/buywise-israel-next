
# Fix broken Intel layout (overlap + escaping accordion)

The new inline-Take accordion I added to Watchlist and Long List broke the column flow:

- Watchlist used `pl-[5.75rem]` assuming a fixed thumbnail width. The accordion sat as a sibling *below* the `<a>` row instead of inside the content column, so it ignored `min-w-0` and pushed the row wider than the watchlist column, bleeding into the sidebar.
- Long List used `sm:pl-[13rem]` the same way.
- Result on `/intel`: watchlist headlines collide with sidebar content; "TAKE" chips float in the gap; "BuyWise Brief" card sits on top of watchlist text.

## What to fix

### 1. `IntelWatchlist.tsx` — keep the accordion inside the content column

- Restructure each row so the `<a>` link and the accordion are both children of `min-w-0 flex-1`, with the thumbnail still floated left.
- Drop `pl-[5.75rem]`. Use natural flow: thumbnail (w-20 shrink-0) + a single `min-w-0 flex-1` column that contains headline → meta → Take accordion stacked vertically.
- Add `min-w-0` and `max-w-full` to the accordion button so long signal text truncates instead of expanding the row.
- Wrap the expanded beats block with `min-w-0` and `break-words` so it can't push outward.

### 2. `IntelLongList.tsx` — same treatment

- Drop `sm:pl-[13rem]`. Render the accordion as a sibling of the row link but inside a `px-3` container that respects the list's full width (not an indent that pushes outward).
- Constrain the accordion button to `max-w-full` and `min-w-0`; clamp signal preview to one line.
- Indent visually with a left border or muted background instead of fixed pixel padding.

### 3. Defensive guards on the page columns

- `src/pages/Intel.tsx`: add `min-w-0` to the Today's Take + Watchlist grid columns so nothing inside can overflow horizontally.
  - `lg:grid-cols-[1.6fr,1fr]` parent → both children need `min-w-0`.
  - Top-level `lg:grid-cols-[1fr,320px]` parent → main column already has `min-w-0`; verify and keep.

### 4. Beat tabs row — keep toggle from clipping

- `IntelBeatTabs.tsx`: my new flex wrapper put the toggle next to a horizontally-scrolling `<nav>`. On narrow widths the toggle gets squeezed.
- Mark the desktop toggle as `shrink-0` (already done) and add `min-w-0` to the nav wrapper so the toggle stays visible and the tabs scroll horizontally inside their own container.

## Out of scope

- No DB or edge-function changes.
- No copy changes (chip text and labels stay the same).
- No new components — just structural fixes to the four files above.

## Technical Section

Files to edit:
- `src/components/intel/IntelWatchlist.tsx` — restructure `WatchRow`: thumbnail + single content column; accordion nested inside content column with `min-w-0`.
- `src/components/intel/IntelLongList.tsx` — restructure `LongRow`: accordion is a `<div className="px-3 pb-3">` sibling using a left border for visual indent, no pixel padding tied to the row's date/source columns.
- `src/pages/Intel.tsx` — add `min-w-0` to the Today's Take grid columns.
- `src/components/intel/IntelBeatTabs.tsx` — confirm nav wrapper has `min-w-0 flex-1` so toggle has room.

Test after: at 873px viewport (current preview), at 1280px, and at 1440px. Confirm no horizontal overflow on the watchlist column and the sidebar sits cleanly to the right.
