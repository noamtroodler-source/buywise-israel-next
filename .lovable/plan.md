
# Make BuyWise Takes Unmissable on /intel

Three coordinated changes so readers see our angle before the wire-service noise.

## 1. Promote the Take above the headline (hero + Briefing cards)

On `IntelTodaysTake` and any Briefing card that has a Take, insert a one-line "Buyer Impact" chip *above* the headline:

```text
TODAY'S TAKE · MORTGAGE & RATES
● BUYER IMPACT  Rate cut, but shekel still strong — payments ease, dollar buys less.
Shekel gains sharply despite interest rate cut
```

- Pulled from `signal` (truncated to ~90 chars, no rewrites).
- Brand-blue pill + short summary line, clickable → scrolls to the full 3-beat block below.
- Hidden entirely when no Take exists (no empty chip).
- Full Signal / Why you care / Our move block stays where it is for the deep read.

## 2. Fix the misleading "Take" link in Watchlist + Long List

Today every Watchlist row shows a blue "Take" link even when no Take exists. Replace with two real states:

- **Has a Take:** Inline collapsed row showing `▸ Buyer impact: <signal first sentence>`. Click toggles an accordion that reveals all three beats inline — no navigation, no modal.
- **No Take:** Show nothing. Row stays clean with just headline + source + time.

Applies to `IntelWatchlist`, `IntelLongList`, and `IntelArticleCard` (non-featured variant).

## 3. "With BuyWise Take" filter toggle

Next to the beat tabs (All · Mortgages · Tax & Legal · …), add a small right-aligned toggle:

```text
[ All · Mortgages · Tax & Legal · Market · Cities · … ]      ◯ With BuyWise Take
```

- Persists in URL as `?takes=1` (matches existing `category` param pattern).
- When on, filters the feed to articles where `take_body` or `signal` is present.
- Counter shows current matches: `With BuyWise Take (23)`.
- Off by default so the firehose still works for power users.

## Technical Section

**Files to touch (frontend only — no DB or edge changes):**

- `src/components/intel/IntelTakeBlock.tsx` — extract a small `TakeChip` subcomponent (pill + signal preview) reusable above headlines.
- `src/components/intel/IntelTodaysTake.tsx` — render `TakeChip` between the category eyebrow and the H2.
- `src/components/intel/IntelBriefing.tsx` (or whichever component renders Briefing cards) — same chip above each headline when Take present.
- `src/components/intel/IntelWatchlist.tsx` — remove fake "Take" link; add collapsible inline Take row with accordion state (local `useState`, lucide `ChevronRight`/`ChevronDown`).
- `src/components/intel/IntelLongList.tsx` — same accordion treatment.
- `src/components/intel/IntelArticleCard.tsx` — keep current behavior but ensure no "Take" affordance shows when `take_body`/`signal` are null.
- `src/components/intel/IntelBeatTabs.tsx` — add right-aligned "With BuyWise Take" toggle (shadcn `Toggle` or simple button); emit change up.
- `src/pages/Intel.tsx` — read `takes` query param, pass to `useIntelFeed` filter, pipe `setTakes` into `IntelBeatTabs`. Filter `pool` / `featured` selection when on.
- `src/hooks/useIntel.ts` — accept optional `withTakeOnly: boolean` in `useIntelFeed`; add `.not('take_body', 'is', null)` to query when set. Same for `useIntelFeatured` (fall back to most recent Take-bearing article when on).

**Styling:** Use existing primary/blue tokens. Chip uses the same `bg-primary` + `text-primary-foreground` already used by the BUYER IMPACT label. No new colors.

**Telemetry:** Wrap the new chip click and accordion toggle in existing `trackIntelClick` pattern (add a `surface` param: `take_chip`, `take_inline_expand`).

**Edge cases:**
- Hebrew articles with translated Take → chip uses translated `signal_en` if present.
- Long signal sentences truncated with `line-clamp-1` to keep the chip a single line.
- Filter toggle + category filter compose (e.g. `?category=mortgages&takes=1`).

**Out of scope (this pass):** No DB schema changes, no edge-function changes, no Deep Read changes.
