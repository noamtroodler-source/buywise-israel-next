# BuyWise Intel — Build Plan

A legal RSS aggregator + original "BuyWise Take" editorial layer, placed under **Learn → Intel** at `/intel`. Voice: Trusted Friend. Design: existing tokens only. Zero stored third-party media.

---

## Phase 1 — Data Foundation & Ingestion

**Goal:** Articles flowing into Supabase hourly, categorized and scored.

### 1.1 Database migration
Tables (all snake_case, RLS on, no CHECK constraints on time-sensitive fields):

- **`intel_sources`** — `id`, `name`, `url`, `language` (en/he), `tier` (1/2), `enabled` bool, `last_fetched_at`, `last_error`. Seeded with the 12 feeds from the spec.
- **`intel_articles`** — `id`, `source_id` fk, `source_name` (denorm for fast reads), `source_language`, `source_tier`, `headline`, `excerpt` (≤2 sentences, trimmed server-side), `url` UNIQUE, `published_at`, `category`, `relevance_score` smallint, `is_featured`, `is_pinned`, `is_hidden`, `created_at`. Indexes on `(published_at desc)`, `(category)`, `(relevance_score)`, `(url)`.
- **`intel_takes`** — `id`, `article_id` fk cascade, `take_label`, `take_body`, `created_by` fk `auth.users`, `created_at`, `updated_at`, `published_at` (null = draft). Trigger enforces ≤300 words.
- **`intel_fetch_log`** — `id`, `source_id`, `ran_at`, `articles_added`, `error`. Admin-only.
- **`intel_brief_subscribers`** — `id`, `email` UNIQUE, `created_at`, `confirmed_at`, `unsubscribed_at` (or reuse existing leads table if one exists — verified during build).

**RLS:**
- `intel_articles`: public SELECT where `is_hidden = false`; writes only via service role + admins (`has_role(auth.uid(), 'admin')`).
- `intel_takes`: public SELECT where `published_at is not null`; full CRUD admins only.
- `intel_sources`, `intel_fetch_log`: admin-only.
- `intel_brief_subscribers`: public INSERT; SELECT admins only.

**View:** `intel_feed_v` joining articles + latest published take for fast frontend reads.

### 1.2 Edge function: `fetch-intel-feeds`
- Deno runtime, uses `https://deno.land/x/xml` for parsing (no third-party rss2json dependency).
- Iterates enabled sources, fetches with timeout + retry, parses XML, dedupes by URL, trims excerpt to 2 sentences, runs category + relevance scoring, inserts new rows only.
- Logs each run to `intel_fetch_log`; silent failure to UI.
- Uses `EdgeRuntime.waitUntil` for per-source work (per edge function standards memory).

### 1.3 Scheduled cron
- `pg_cron` + `pg_net` to invoke the function every 60 minutes (insert tool, not migration, per project standard).

### 1.4 Category + relevance scoring module
Pure TS helper inside the edge function (also exported for reuse in admin re-score):
- Keyword maps (EN + HE) for 8 categories. City names pulled from the 25-city whitelist.
- Relevance scoring rules per the spec (5 → 1).

**Phase 1 acceptance:** `select count(*) from intel_articles where published_at > now() - interval '24 hours'` returns >0 from at least 6 sources; categories and scores populated.

---

## Phase 2 — Public `/intel` Page

**Goal:** Buyers can browse, filter, and read Takes.

### 2.1 Routing + navigation
- Add `INTEL: '/intel'` to `src/lib/routes.ts`.
- Add Intel as first item under **Learn** in `src/lib/navigationConfig.ts` and `LEARN_ITEMS` in `UnifiedNav.tsx`. Description: "Israeli market news, explained for buyers."
- Surface in `MoreNav` mobile drawer.
- Register route in `App.tsx` (lazy-loaded, like Blog).
- Add `/intel` to `public/sitemap.xml`.

### 2.2 Page shell (`src/pages/Intel.tsx`)
- Helmet head: title, description, canonical `https://buywiseisrael.com/intel`, `CollectionPage` JSON-LD.
- Hero strip with H1 "BuyWise Intel" + Trusted-Friend subhead.
- Sticky filter bar.
- Featured card (full-width).
- 1/2/3-column uniform card grid.
- Right sidebar (≥lg) with About / Brief / Sources.
- Mobile: filter pills in horizontal scroll; filters open in `Sheet` drawer; subscribe card injected every 10 articles.

### 2.3 Components (under `src/components/intel/`)
- `IntelFilterBar` — search, category chips, source dropdown, sort, "Only with Take" toggle. URL-syncs filter state via query params (per Listing Filter Sync memory).
- `IntelArticleCard` — source text + relative time, Hebrew badge, category pill (neutral palette + lucide icon prefix), headline, excerpt (or Hebrew placeholder), relevance dot w/ tooltip, "Read on [Source] →" external link (`rel="noopener noreferrer nofollow"`), optional Take block (`bg-primary/5 border-l-2 border-primary`).
- `IntelFeaturedCard` — large variant with contextual CTA into related Tool/Guide based on category (Mortgage → `/tools?tool=mortgage`, Tax → True Cost calculator, etc.).
- `IntelTakeBlock` — label pill, BuyWise mark, body, editorial attribution.
- `IntelSidebar` — About blurb, `BriefSubscribeCard`, `SourcesWeFollowList` (text only, no logos).
- `IntelEmptyState`, `IntelSkeleton`.

### 2.4 Data hook
- `useIntelFeed({ category, source, sortBy, hasTake, search })` using React Query, reads `intel_feed_v`, server-side filters + pagination (cursor on `published_at`).
- `useIntelFeatured()` for the top card.

**Phase 2 acceptance:** `/intel` renders live cards, filters work, Takes display when present, mobile drawer works, all external links open in new tab with nofollow.

---

## Phase 3 — Admin Interface

**Goal:** Editorial team can write Takes, manage sources, override metadata.

### 3.1 Route
- `/admin/intel` under `AdminLayout`, admin-role guard (existing `has_role` pattern).
- Sidebar nav entry in `AdminLayout`.

### 3.2 Tabs
**Tab 1 — Articles:** Table with headline, source, category, score, has_take, featured, hidden. Inline editors for category (select), score (1–5), and toggles for featured/pinned/hidden. "Add/Edit Take" button per row.

**Tab 2 — Take editor:** Modal `Dialog` with article preview (read-only), label dropdown (curated set + Custom), rich-text body with live word counter (soft warn 250, hard cap 300), live card preview, Save Draft / Publish (`published_at` toggle).

**Tab 3 — Sources:** Enable/disable, add new source form, last-fetched timestamp, 7-day article count, "Fetch Now" button (invokes edge function).

### 3.3 Hooks
- `useAdminIntelArticles`, `useAdminIntelTakes`, `useAdminIntelSources` — mirror the existing admin hook patterns (`useAdminBlog`, `useAdminUsers`).

**Phase 3 acceptance:** Admin can publish a Take and it appears on `/intel` within seconds; can hide an article and it disappears from public feed; can trigger a manual refresh and see new articles within ~30s.

---

## Phase 4 — Newsletter, Polish, SEO

### 4.1 BuyWise Brief subscribe
- Sidebar widget + mobile-injected card.
- Posts to `intel_brief_subscribers` (or existing leads table if found).
- Confirmation toast in Trusted-Friend voice.
- Admin export available via existing leads admin view if reused.

### 4.2 Contextual cross-links
- Featured card and category pills link to matching Tool/Guide.
- After every 6 cards (desktop) or 10 (mobile), insert a soft prompt: "Run the numbers on a story like this →" linking to the relevant calculator.

### 4.3 SEO + analytics
- Helmet meta per spec.
- `CollectionPage` JSON-LD listing items with `mainEntityOfPage = source url` (no false `NewsArticle` authorship).
- Sitemap entry.
- Track via existing analytics: `intel_filter_changed`, `intel_card_clicked` (with `source_name`, `category`, `has_take`), `intel_take_expanded`, `intel_brief_subscribed`.

### 4.4 Empty / error states
- "Nothing matches that filter right now. Try widening it, or check back in an hour — we refresh hourly."
- Source fetch failure: silent, logged.
- No Take: render nothing.

### 4.5 Memory write
Add a new project memory: `mem://features/buywise-intel` describing the architecture, voice rules, and "no third-party logos / no image caching / human-only Takes" constraints.

---

## Technical notes

- **No new design tokens.** All styling via existing `src/index.css` semantic tokens and shadcn primitives.
- **Hebrew handling:** `dir="rtl"` on Hebrew headlines; never auto-translate; placeholder excerpt until a human Take is published.
- **No NewsArticle JSON-LD** for aggregated items (would falsely claim authorship).
- **Edge function** parses XML server-side; no client `rss2json` dependency.
- **City matching** uses the existing 25-city whitelist, not a hardcoded list.
- **Word-count enforcement** via trigger on `intel_takes`, not CHECK constraint (per project memory).

---

## Phase order summary

```text
Phase 1  Data + ingestion        (migration, edge fn, cron)        ~foundation
Phase 2  Public /intel page      (nav, page, components, hook)     ~user-visible
Phase 3  Admin /admin/intel      (3 tabs)                          ~editorial control
Phase 4  Brief, polish, SEO      (newsletter, JSON-LD, analytics)  ~launch ready
```

Each phase is independently shippable. After Phase 1 the data exists; after Phase 2 buyers can read; after Phase 3 editorial can operate; after Phase 4 it's a polished public feature.

Approve and I'll start with Phase 1 (migration first, then edge function + cron).