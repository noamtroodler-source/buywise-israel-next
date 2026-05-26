
# BuyWise Intel — FT × DealBook Redesign Plan

Goal: turn `/intel` from a 3-tier card stack into a **calm, dense, editorial market page** that feels like FT's homepage (information-rich, restrained, serif authority) layered with NYT DealBook's signature move (one big editor's Take at the top, then a long clean list of headlines underneath). The BuyWise twist: every editorial beat is framed for an international buyer making a real purchase decision in Israel.

---

## The new page shape

```text
┌─────────────────────────────────────────────────────────────┐
│  EYEBROW: "Tuesday · May 26 · Tel Aviv"   [Subscribe →]    │  ← Dateline strip
├─────────────────────────────────────────────────────────────┤
│  BuyWise Intel                                              │
│  Israeli property news, decoded for international buyers.   │  ← Quiet masthead
├─────────────────────────────────────────────────────────────┤
│  MARKET BAR: BoI rate · Prime · ₪/$ · TA index · Avg ₪/sqm │  ← FT ticker row
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│   TODAY'S TAKE           │   What we're watching            │  ← DealBook spine
│   (lead story + Take)    │   • headline                     │
│                          │   • headline                     │
│   "By the BuyWise desk"  │   • headline                     │
│                          │   • headline (8–12 items)        │
│                          │                                  │
├──────────────────────────┴──────────────────────────────────┤
│  THE BRIEFING — 3 mid-weight stories, each with 1-line Take │  ← FT "Opinion" row
├─────────────────────────────────────────────────────────────┤
│  BY THE BEAT  [Mortgages] [Tax] [Aliyah] [Cities] [Policy]  │  ← Beat tabs, not chips
│  Compact two-column list per beat, 5 per beat               │
├─────────────────────────────────────────────────────────────┤
│  THE LONG LIST — chronological, dense, zebra rows           │  ← FT "Latest news"
└─────────────────────────────────────────────────────────────┘
```

Sidebar (desktop only, sticky): Brief subscribe → "How we choose stories" → Sources we read.

---

## What changes vs today

| Today | New |
|---|---|
| Big eyebrow + 50px headline + long subtitle | Dateline strip + quiet serif masthead |
| Tier 1 featured card | **Today's Take** — lead story w/ named desk byline, anchored left of the spine |
| Tier 2 "Stories worth slowing down for" grid | **The Briefing** — 3 horizontal items, 1-line Take each |
| Filter bar (category dropdown + source + sort + search) | **Beat tabs** (Mortgages / Tax / Aliyah / Cities / Policy / Macro) — FT-style underlined nav. Search collapsed into icon. Source filter moves to sidebar. |
| Single "Latest" list of everything else | Split: **What we're watching** (curated headlines next to Today's Take) + **The Long List** (full chronological feed, zebra rows, dense) |
| No market context | **Market bar**: BoI rate, Prime, ₪/$, TA-125, avg ₪/sqm Israel (real values, link to source) |

---

## The BuyWise twist (what makes it ours, not a clone)

1. **Every Take ends with a "What this means for you" line** — one sentence aimed at an international buyer (e.g. *"If you're closing in Q3, lock your rate this week."*). DealBook gives analysis; we give a decision.
2. **Beat tabs map to buyer jobs**, not news desks — Mortgages, Tax & Legal, Aliyah, Cities, New Developments, Policy. Same enum we already have; just relabeled and reordered.
3. **Dateline shows Israel time + week-of-purchase context** ("Week 22 · BoI decision in 14 days") when relevant.
4. **Market bar values come from our existing tables** (`calculator_constants`, `national_market_benchmarks`) — no new data sources. Never fabricate; show "—" if a value is stale.
5. **Hebrew sources stay Hebrew in headline**, but every Hebrew story in Today's Take or The Briefing must have an English BuyWise Take or it falls to The Long List. (Already half-implemented; we make it a hard rule in the view.)
6. **Source attribution stays loud** ("Globes" · "Calcalist") — FT respects sources; we respect ours and avoid any "we wrote this" ambiguity (per data-integrity standard).
7. **No images in the feed.** FT-style text-first density. Only Today's Take may carry a small thumbnail if the source provides one. This is the biggest single calm-down move.

---

## Section-by-section spec

### 1. Dateline strip
Thin row, `border-b`, muted. Left: `Tuesday · May 26 · Tel Aviv`. Right: `Get the weekly brief →` (anchor to subscribe card). No background color.

### 2. Masthead
Serif display font (use existing `font-serif` token — likely Cormorant/Instrument Serif from brand). `text-4xl md:text-5xl`. Single-line tagline below in body sans, muted. Max-width ~640px. No gradient, no chip.

### 3. Market bar
Horizontal row of 5 stats, divider lines between, monospace numerals. Sticky on scroll past masthead (optional v2). Sourced from existing constants tables; each stat has a tiny `as of …` tooltip. If we don't have a live value, omit that slot rather than fake it.

### 4. Today's Take + What we're watching (the spine)
Two-column grid, `lg:grid-cols-[1.6fr,1fr]`, divided by a vertical hairline.
- **Left (Today's Take):** serif headline (2xl–3xl), source/timestamp line, 2-sentence excerpt, then the **BuyWise Take block** with byline `By the BuyWise desk`, ending in the "What this means for you" line. One "Read on {source}" link.
- **Right (What we're watching):** section label, then 8–12 headline rows. Each row: tiny category dot, headline (sans, `text-[15px]`, 2-line clamp), `source · 2h`. No excerpts. No images. Hover underlines. This is the DealBook right-rail pattern.

### 5. The Briefing
Eyebrow "The Briefing". 3 columns on desktop, stacked on mobile. Each: small category label, sans headline (lg), one-line Take in italic serif, source line. Border-top hairline divider between items, no card chrome.

### 6. Beat tabs + per-beat lists
Underlined tab row (FT/NYT style), not pill chips. Selecting a beat filters the section below to 5 items in a **two-column dense list** with tiny excerpts. "See all {Beat} →" link routes to `/intel?category={slug}` (existing URL contract preserved).

### 7. The Long List
Eyebrow "Latest". Full-width single column, zebra rows (`even:bg-muted/30`), each row: timestamp · source · headline · category chip (tiny, right-aligned). No borders between rows except the zebra. Tap target full-row. Pagination or "Load more" at 30/60/120.

### 8. Sidebar (desktop)
Sticky. Three small modules, each with hairline divider:
1. **The BuyWise Weekly Brief** — subscribe card, reskinned to match (no gradient, just border + button).
2. **How we choose stories** — 3 bullets explaining curation (relevance to buyers, source tier, dated decisions).
3. **Sources we read** — collapsible list of source names with tier badges, links to `homepage_url`.

### 9. Mobile
Spine collapses: Today's Take first, then "What we're watching" as a horizontal scroll of headline cards (no, scratch that — keep vertical list, FT mobile is vertical). Beat tabs become a scrollable horizontal row. Long List unchanged. Subscribe at the end.

---

## Visual system (BuyWise design tokens)

- **Type:** masthead + Take headlines use the existing serif token; everything else stays sans. This creates the "editorial" feel without importing new fonts.
- **Color:** no new colors. Category dots reuse `CATEGORY_BY_ID` colors at low saturation. Primary stays as the single accent (links, eyebrows, beat-tab underline).
- **Density:** kill card shadows in the feed entirely. Use hairline borders (`border-border/60`) and whitespace as the only structure. Card chrome only on the sidebar modules and the Take block.
- **Numerals:** `tabular-nums` for the market bar and all timestamps.
- **Motion:** none beyond subtle hover underline + 150ms color on links. No fade-ins.

---

## Data & component work

### New components (`src/components/intel/`)
- `IntelDateline.tsx` — date strip
- `IntelMarketBar.tsx` — 5-stat row, pulls from existing constants/benchmarks hooks
- `IntelTodaysTake.tsx` — lead-story layout with desk byline
- `IntelWatchlist.tsx` — right-rail headline list (reuses `IntelHeadlineRow` styling, tighter)
- `IntelBriefing.tsx` — 3-column mid-tier
- `IntelBeatTabs.tsx` — underlined tab nav (replaces parts of `IntelFilterBar`)
- `IntelBeatList.tsx` — per-beat 2-col dense list
- `IntelLongList.tsx` — zebra full feed with "Load more"
- `IntelCurationNote.tsx` — sidebar "How we choose" module

### Refactor
- `IntelFilterBar.tsx` → demoted to a small search-icon + source-filter; source moves into sidebar
- `IntelArticleCard.tsx` → keep, but `variant="featured"` updated to match Today's Take spec; default variant unused in new layout (long list uses row component)
- `IntelTakeBlock.tsx` → add optional `byline` and `decisionLine` props; render byline as `By the BuyWise desk` and the decision line in a stronger weight
- `IntelHeadlineRow.tsx` → tighten for right-rail use; add `dense` variant
- `Intel.tsx` → rewrite composition to the new spine; URL params (`category`, `source`, `sort`, `q`) preserved

### Data
- No schema changes required for v1. Reuse `intel_feed_v`, `intel_takes`, `intel_sources`.
- **Optional v1.1:** add a `decision_line` column to `intel_takes` (nullable text) for the explicit "What this means for you" sentence. Falls back to last sentence of `take_body` if null. **Migration deferred** — confirm with user before adding.
- Market bar reuses existing hooks (`useCalculatorConstants`, `useNationalAveragePrices` or equivalent); if a stat lacks a hook, omit the slot rather than introduce mock data (per no-fabrication core rule).

### Admin
- No admin UI changes required for v1.
- v1.1 (if decision_line ships): add a second textarea to the Take editor in `useAdminIntel` flows.

---

## Build order (one PR each, shippable independently)

1. **Skeleton swap** — rewrite `Intel.tsx` composition, dateline + masthead + new spine, reusing existing components. No new data. Lowest risk, biggest visual win.
2. **The Long List + Briefing** — new row components, zebra styling, kill card chrome in feed.
3. **Beat tabs** — replace filter bar with underlined tabs; demote source filter into sidebar.
4. **Market bar** — wire 3–5 real stats from existing tables; gracefully omit missing ones.
5. **Decision line** (optional, requires user OK on migration) — schema + admin field + render.
6. **Polish pass** — sticky market bar, mobile beat-tab scroll, sidebar curation note, analytics events (`intel_take_read`, `intel_headline_click`, `intel_beat_change`).

---

## Out of scope (call out so we don't scope-creep)

- Hebrew → English auto-translation (separate project, needs AI budget decision)
- Push notifications / RSS out / sitemap entry (already on the earlier follow-up list, track separately)
- Personalization by buyer profile (interesting but a v2 — would need profile join)
- Comments, saves, share buttons on articles
- Any redesign of `/learn` nav or other Learn pages

---

## Open questions before build

1. Confirm the serif token to use for the masthead and Take headlines (project already has one in the brand identity memory — I'll pick the existing serif unless you prefer a specific one).
2. OK to add the `decision_line` column to `intel_takes` in step 5, or keep the "What this means for you" sentence as just a writing convention inside `take_body`?
3. For the market bar, which 5 stats matter most to you? My default: BoI rate, Prime, ₪/$ (or ₪/€), TA-125 close, national avg ₪/sqm. Swap any?

If you're good with the shape, I'll start with step 1 (skeleton swap) — that alone will make the page feel like a different product.
