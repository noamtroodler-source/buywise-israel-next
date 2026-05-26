# BuyWise Intel — Buildout Plan to 100%

Goal: take `/intel` (and `/admin/intel`) from "live but rough" to a genuinely best-in-class Israeli real-estate news desk for international buyers.

Grounding from the current state:
- 4 of 10 enabled sources are Hebrew → ~40% of feed is unreadable to target audience
- 168 of 279 articles (60%) sit in `category = 'general'` → Beat tabs are mostly empty
- `image_url` column exists but is mostly NULL
- `last_error` / `last_fetched_at` tracked but not surfaced
- No dedup, no click tracking, no AI assistance for Takes
- The Weekly Brief is explicitly out of scope per your last message

Sequencing rule: do data-quality fixes (1–4) before UX polish (5–9). Without 1–4, polish dresses up a noisy feed.

---

## Phase 1 — Data quality (the feed must be readable and accurate)

### Step 1. Hebrew translation pipeline
**Why first:** unlocks ~40% of the feed for the audience.

- DB migration: add `headline_en TEXT`, `excerpt_en TEXT`, `translated_at TIMESTAMPTZ` to `intel_articles`.
- Update `fetch-intel-feeds`: when `source_language = 'he'`, call Lovable AI Gateway (`google/gemini-3-flash-preview`) per article with a tight system prompt: "Translate this Israeli real-estate headline and excerpt into clear, neutral English for international buyers. Preserve numbers, agency names, and place names. Return JSON." Use tool-calling for structured output.
- Backfill edge function `translate-intel-backlog` — one-shot, paginates through existing Hebrew articles with no `translated_at`, rate-limited (2/sec).
- Frontend: `IntelTodaysTake`, `IntelWatchlist`, `IntelBriefing`, `IntelLongList` render `headline_en || headline` and `excerpt_en || excerpt`. Add a tiny `HE→EN` badge when translation was used, with original headline in a `<details>` or tooltip.
- Admin: in `/admin/intel`, show both original and translated; allow editing the translation inline (writes to `headline_en`).

### Step 2. AI-powered auto-categorization
**Why second:** Beat tabs are currently misleading (60% bucket is wrong).

- Extend the same translation call to also return `category` from the existing enum + a 1–5 `relevance_score`. Single AI call per article = cheap.
- For English articles, run a categorize-only call (no translation).
- Add `category_confidence NUMERIC(3,2)` and `auto_categorized BOOLEAN DEFAULT true`. Admin overrides set `auto_categorized = false` so backfills never overwrite manual choices.
- Backfill edge function `recategorize-intel-backlog` for the 168 "general" rows.
- Admin: filter "low confidence (<0.6)" to triage borderline cases.

### Step 3. Cross-source deduplication
**Why third:** when BoI changes rates, the same story arrives from 5 outlets and floods the Long List.

- Add `dedup_group_id UUID` and `is_duplicate BOOLEAN DEFAULT false` columns.
- In `fetch-intel-feeds`, after categorization, run a similarity check against articles published in the last 48h:
  - Cheap pre-filter: same `category` + token-Jaccard ≥ 0.5 on title.
  - Confirmation: Jaro-Winkler ≥ 0.85 on the English headline (post-translation).
- On match: assign same `dedup_group_id`; mark the lower-tier source's article as `is_duplicate = true`.
- `intel_feed_v` filters `is_duplicate = false` by default.
- Admin: "Show duplicates" toggle reveals hidden duplicates with a "Promote this version" action.

### Step 4. Image enrichment (or commit to text-first)
**Decision needed before building** — see Question 1 below.

If we go the image route:
- Extend fetcher to fetch each article URL once and extract `og:image` / `twitter:image` via a lightweight regex (no full DOM parse needed).
- Store in existing `image_url` column. Add `image_checked_at` so we don't refetch every cron run.
- Frontend: Today's Take hero shows image; Watchlist remains text-only; Briefing cards get a thumbnail.

If text-first:
- Drop the image column from the schema and the IntelTodaysTake hero slot. Lean fully into the DealBook editorial aesthetic.

---

## Phase 2 — Operational lift (so you can actually run this daily)

### Step 5. AI-assisted BuyWise Take drafting
**Why:** without this, the human bottleneck caps you at ~5 Takes/day. With it, ~30/day is realistic.

- New edge function `draft-intel-take` — input: `article_id`. Output: `{ take_label, take_body }` using Gemini 3 Flash with a system prompt locking the Trusted-Friend voice and the "what this means for international buyers" framing (2–3 sentences max).
- Admin `/admin/intel`: in the Take editor dialog, add "Draft with AI" button → populates fields → admin edits → saves. Saved Takes record `ai_drafted BOOLEAN` for analytics.
- Add "Regenerate" + a label dropdown (Buyer Impact / Mortgage Math / Tax Watch / Market Read / Policy Watch) the AI picks from.

### Step 6. Source health monitoring
**Why:** broken feeds currently go undetected for weeks.

- New view `intel_source_health_v`: source name, enabled, last_fetched_at, last_error, hours_since_fetch, recent_article_count (7d).
- `/admin/intel` top banner: red alert when any enabled source has `hours_since_fetch > 48` OR `last_error IS NOT NULL`. Click → opens the Sources tab pre-filtered to broken sources.
- Add "Test fetch" button per source in admin (calls fetcher for one source only).

### Step 7. Outbound click tracking
**Why:** you need to know which Takes drive engagement before you can optimize.

- New table `intel_article_clicks` (id, article_id, user_id nullable, session_id, referrer_path, created_at). RLS: anyone can insert, admins can read.
- Edge function `track-intel-click` (verify_jwt = false) → records click, returns 302 redirect to `intel_articles.url`.
- Frontend: "Read at source" link points to `/functions/v1/track-intel-click?id=...` instead of direct URL.
- Admin: "Top performing Takes (30d)" widget on `/admin/intel` dashboard tab. Columns: headline, take_label, clicks, CTR (clicks / impressions — impressions can come later from existing page-view tracking).

---

## Phase 3 — UX polish & discoverability

### Step 8. Mobile beat tabs overflow
- Replace wrapping flex with horizontally scrollable container; add gradient edge fades and snap-scroll; active tab auto-scrolls into view. Pattern already used in the city detail page tabs — reuse it.

### Step 9. Beat-specific empty states
- Replace generic `IntelEmptyState` content with per-beat copy when filtered ("No mortgage news in the last 7 days — the market is quiet"). Driven by a small map in `IntelEmptyState.tsx`.

### Step 10. SEO & discoverability
- Add `/intel` to dynamic sitemap generator (one entry per beat: `/intel?category=mortgage-rates` etc.).
- JSON-LD upgrade: switch from generic `CollectionPage` to `CollectionPage` containing `ItemList` of the visible articles (top 10 by relevance), each as `NewsArticle`. Crawlers get a real article index.
- Per-article rel=nofollow on outbound source links (already done? verify).
- Add Open Graph image to `/intel` route — generate one branded "BuyWise Intel" hero card via imagegen.

### Step 11. Admin UX polish
- "Undo" toast on hide/feature/pin actions.
- Keyboard shortcuts on admin list: `H` hide, `P` pin, `F` feature, `T` open Take editor (newsroom muscle memory).
- Bulk select + bulk hide (for cleaning up dedup misses).

---

## Out of scope (intentionally, per your direction)
- Weekly Brief email send pipeline + unsubscribe
- BuyWise Intel RSS output for syndication
- Comment / discussion system

These can be Phase 4 once Phases 1–3 are live.

---

## Technical notes
- All AI calls go through Lovable AI Gateway (`LOVABLE_API_KEY` already provisioned). Default model `google/gemini-3-flash-preview`. Tool-calling for structured output (translation + categorization in one call).
- All edge functions follow existing standards (`EdgeRuntime.waitUntil`, `corsHeaders` from `npm:@supabase/supabase-js@2/cors`, no path-based invokes).
- Migrations: 4 needed total (translation cols, dedup cols, category confidence, click tracking table). Each carries the required `GRANT` block.
- No new public-key secrets required.
- Existing `intel_feed_v` view gets one update (filter duplicates by default) — recreated as part of the dedup migration.

---

## Open questions before build

1. **Step 4 — images or text-first?** RSS rarely fills `og:image` cleanly, and scraping every URL adds latency + failure modes. My recommendation: **commit to text-first DealBook aesthetic** and drop the image slot entirely. It's more honest to the voice and removes a constant maintenance tax. But your call.

2. **Step 1 — translation tone.** When a Hebrew headline is colorful ("הריבית קופצת — והממשלה לוחצת"), do you want literal English ("Interest jumps — and the government pushes") or a normalized BuyWise voice ("BoI rate up; coalition pressure intensifies")? I'd go normalized for headlines, literal for excerpts.

3. **Step 5 — Take label taxonomy.** I proposed 5 labels (Buyer Impact / Mortgage Math / Tax Watch / Market Read / Policy Watch). Want to confirm, edit, or let me ship with these as defaults that admin can extend?

Answer those three and I'll move to build mode and ship Phase 1 first.
