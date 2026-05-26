## What we're building

Turn `/intel` from an RSS-with-one-liners into a real editorial product:

- **📊 Breakdown** — auto-generated on every visible article (~80 words, 3 beats: Signal / Why You Care / Our Move). Auto-publishes.
- **📚 Deep Read** — auto-classified during the 48h scrape, max 2 per cycle, max 5 live. Goes to admin queue for human approval before publishing.
- **🔗 Source Only** — quiet fallback for articles that don't earn commentary (off-topic noise, duplicates, low relevance).

All copy passes the BuyWise voice bar: trusted friend, no AI tells, no clichés ("In a nutshell", "It's important to note", em-dash overload, "buckle up"), no buyer instructions, ₪ symbol, "international buyers" never "Anglos".

---

## Phase 1 — Schema + Breakdown for every article (auto-publish)

**Database**

Extend `intel_takes` to support two tiers and a review lifecycle:

- `tier` enum: `breakdown` | `deep_read`
- `status` enum: `draft` | `pending_review` | `published` | `rejected`
- `signal`, `why_you_care`, `our_move` text columns (Breakdown's 3 beats, stored structured so the UI can render with proper visual rhythm instead of one paragraph blob)
- `deep_read_body` text (markdown, 250–400 words, only used when tier=deep_read)
- `deep_read_subheads` jsonb (Context / What Changed / Numbers / What To Do / Caveats — same reasoning: structured > blob)
- `rejected_reason`, `reviewed_by`, `reviewed_at`
- Unique index on `(article_id, tier)` so we never get dupes
- Validation trigger replaces the current word-cap trigger: breakdown ≤ 90 words total across 3 beats; deep_read 250–500 words
- RLS: public reads only `status='published'`; admin full access (existing pattern)

**AI helper rewrite (`supabase/functions/_shared/intel-ai.ts`)**

Replace `draftTake` with `draftBreakdown` that returns the 3 beats as separate fields via tool calling. New voice rules baked into the system prompt:

- Banned openers list ("This means…", "In short…", "In a nutshell", "Buckle up", "Let's dive in")
- Banned phrases list ("It's important to note", "navigate the landscape", "in today's market", "at the end of the day")
- Force concrete nouns over abstractions (say "₪7,200/mo mortgage payment" not "monthly housing costs")
- "Our Move" must be one observation, not advice — what *we're watching*, not what *you should do*
- Self-check rule: if a beat is generic enough to apply to any article, rewrite it

**Generation flow**

Modify `fetch-intel-feeds` (the 48h cron) so after enrichment + relevance scoring, every article with `relevance_score >= 3` and `is_hidden=false` triggers `draftBreakdown` and writes a `tier='breakdown', status='published'` row immediately. Articles scored 1–2 get no Take (Source Only).

Backfill the existing 59 visible articles via the existing `enrich-intel-backlog` function (extend it to also draft breakdowns for articles without one).

**Frontend**

Rewrite `IntelTakeBlock.tsx` to render Breakdown as 3 visually distinct beats with small icons/labels, not a paragraph. New component `BreakdownCard` used inside `IntelArticleCard`, `IntelBriefing`, `IntelTodaysTake`, `IntelLongList`. Source-only articles get a muted `IntelHeadlineRow` treatment (already exists — wire it up by checking `take_body IS NULL`).

---

## Phase 2 — Deep Read auto-classifier + admin approval queue

**Classifier (runs inside `fetch-intel-feeds` after Breakdown drafts)**

New helper `classifyDeepRead` — second AI call per article using a strict rubric. Returns `{ deserves_deep_read: bool, rubric_hits: string[], confidence: number }`. Article qualifies if it hits ≥2 of:

1. Regulatory/legal change (new tax, Mas Rechisha reform, mortgage rule)
2. Material market move (BoI rate, >5% city shift, major index pivot)
3. Direct international-buyer impact (Olim tax, currency control, residency)
4. Major project/policy launch (TAMA reform, big infra)
5. Risk/warning signal (bubble warnings, developer insolvency, fraud)

Disqualifiers: source body < 500 words, speculation/opinion, similar story published in last 14 days (check via embedding similarity against recent deep_reads), AI confidence < 0.8.

**Safety governor (in the cron function, not AI)**

- Sort qualifying articles by confidence × relevance_score, take top 2 per cycle max
- Before generating, query `select count(*) from intel_takes where tier='deep_read' and status='published' and published_at > now() - interval '14 days'` — if already 5 live, skip generation entirely this cycle
- Generated Deep Reads write as `tier='deep_read', status='pending_review'`

**Deep Read drafting**

New helper `draftDeepRead` — third AI call for qualifying articles. Tool-calling schema returns 5 structured subheads (Context / What Changed / Numbers / What To Do / Caveats). Same voice rules as Breakdown, plus: require at least one number from the source, require a "Caveats" section that names what we don't know.

**Admin approval queue** (extend `/admin/intel`)

New tab "🔥 Deep Reads" between Articles and Sources:

- Pending queue at top: article preview + AI-drafted Deep Read in an editable form, each subhead its own textarea
- Buttons: **Publish**, **Save Draft**, **Reject** (with reason dropdown: off-tone / inaccurate / not material / duplicate)
- Live list below: currently-published Deep Reads with edit + unpublish
- Word counter per subhead, total word counter, voice-rule linter (highlights banned phrases inline before publish)
- Toast on publish: "Live on /intel — 4/5 slots filled"

---

## Phase 3 — Editorial UI polish on `/intel`

Goal: looks like a real publication, not a feed.

**Layout adjustments**

- **Today's Take** slot at top: promote the highest-confidence Deep Read if one is live and < 48h old, else fall back to top Breakdown (today). Use a magazine-style hero treatment — large headline, dateline, Deep Read body inline, "Full source" link at bottom.
- **The Briefing**: 3 Breakdown cards with their 3-beat structure showing. Currently shows take_body as a paragraph — re-render as Signal / Why You Care / Our Move with subtle visual rhythm (small uppercase labels, slim vertical accent line on left).
- **Deep Read shelf**: dedicated row above the long list — horizontal scroll of up to 5 live Deep Reads with a distinctive `📚 Deep Read` badge and slightly heavier typography. Click → opens a focused reader view at `/intel/deep/:slug` (new route).
- **Long list**: Headline rows with category chip + Breakdown teaser (Signal beat only, truncated). Source-only articles get muted treatment — no Take block, just headline + dateline + source link, slightly smaller and lower contrast so they read as "noise we surfaced but didn't bother commenting on".

**Visual/brand polish (semantic tokens, no hardcoded colors)**

- New semantic token `--intel-breakdown-accent` and `--intel-deep-read-accent` in `index.css`
- Deep Read badge uses BuyWise primary; Breakdown beats use a subtle muted accent so they don't compete
- Editorial serif for Deep Read body (load via existing font system — pair with current display font)
- Per-beat icons (small, line-weight, not emoji): Signal = waveform, Why You Care = compass, Our Move = eye
- Dateline component upgrade: "Updated Tue, May 26 · Next refresh in 41h" — makes the 48h cadence visible and earns trust

**New route**: `/intel/deep/:slug` (slugify from headline_en). Single-column reader: dateline, headline, source attribution line ("Original reporting: Globes · [link]"), structured Deep Read with subhead anchors, "BuyWise Editorial · reviewed by [editor]" footer. SSR meta tags added to `server.ts` (already supports per-route injection) for SEO.

---

## Phase 4 — Legal + trust footer (small but matters)

Each Take card and the Deep Read page get a small disclosure line in the existing muted-foreground style:

> "Original reporting: [Source name]. BuyWise commentary is editorial analysis. Read the full source →"

- Headline + 80-word commentary is clearly transformative/fair use under both US and Israeli copyright doctrine
- Source link is always prominent (already present on `IntelArticleCard`)
- We never reproduce source body text — only the source's own headline + the short excerpt the RSS feed publishes (which is what RSS is *for*)
- Add `noindex` on `/intel` pages until Phase 3 polish ships so we don't index half-baked output
- Add a one-line attribution policy at `/legal/intel-attribution` linked from the footer of `/intel`

---

## Technical section

### Files touched

**New**
- `supabase/migrations/<ts>_intel_takes_two_tier.sql` — schema changes above
- `supabase/functions/_shared/intel-ai.ts` — add `draftBreakdown`, `classifyDeepRead`, `draftDeepRead`; keep old `draftTake` exported as alias temporarily for backfill
- `src/components/intel/BreakdownCard.tsx`
- `src/components/intel/DeepReadCard.tsx`
- `src/components/intel/DeepReadShelf.tsx`
- `src/pages/IntelDeepRead.tsx` + route in `App.tsx`
- `src/components/admin/intel/DeepReadQueue.tsx`
- `src/components/admin/intel/VoiceLinter.tsx` — banned-phrase highlighter
- `src/lib/intel/voice-rules.ts` — banned openers/phrases array shared by AI prompt + linter
- `src/pages/legal/IntelAttribution.tsx`

**Modified**
- `supabase/functions/fetch-intel-feeds/index.ts` — call new helpers, write breakdowns + queue deep reads
- `supabase/functions/draft-intel-take/index.ts` — switch to draftBreakdown; keep endpoint name for back-compat
- `supabase/functions/enrich-intel-backlog/index.ts` — also generate breakdowns for articles missing one
- `src/components/intel/IntelTakeBlock.tsx` — render structured beats
- `src/components/intel/IntelTodaysTake.tsx`, `IntelBriefing.tsx`, `IntelLongList.tsx`, `IntelArticleCard.tsx` — consume new structure
- `src/components/intel/IntelDateline.tsx` — show next-refresh countdown
- `src/pages/admin/AdminIntel.tsx` — add Deep Reads tab
- `src/hooks/useIntel.ts`, `src/hooks/useAdminIntel.ts` — new types + queries
- `src/index.css` — new semantic tokens
- `server.ts` — SSR meta for `/intel/deep/:slug`

### Cron + cost

The 48h cron runs at most ~30 articles → 30 Breakdowns + up to 30 classifier calls + up to 2 Deep Reads = ~62 Gemini Flash calls per cycle. Well within Lovable AI budget. Embedding similarity check for de-dup uses 1 embedding call per qualifying article against the last 14d of Deep Reads (max ~5 vectors to compare).

### Rollout order

1. Phase 1 ships first (schema + Breakdown for all + backfill) — gives you 59 articles to QA the voice on before committing further
2. Pause for your review. If voice quality is wrong, we tune the prompt + banned-phrases list before building Phase 2
3. Phases 2–4 ship together once voice is dialed in

### What I'm explicitly not doing
- No paid subscription/gating on Deep Reads — they're trust builders, not products yet
- No comments, no social share buttons — pure read experience
- No newsletter integration in this plan — existing `intel_brief_subscribers` table stays as-is; newsletter generation is a separate scope

---

**Recommend approving Phase 1 first.** Once you see Breakdowns on the 59 live articles, you'll know whether the voice prompt needs more work before we wire up the Deep Read pipeline.