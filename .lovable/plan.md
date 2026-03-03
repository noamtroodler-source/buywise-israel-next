

## Build "Warmest Users" Admin Page

A new admin page at `/admin/warm-leads` showing your highest-intent users ranked by engagement signals, plus a log of retention emails sent.

### What it shows

**Warm Users Table** — ranked by a composite "heat score" calculated from:
- Number of saved properties (favorites)
- Number of guide chapters read (content_visits where content_type = 'guide')
- Whether they completed a buyer profile
- Days since last active (recency bonus)

Each row shows: name, email, target cities, favorites count, guides read, last active date, heat score, and a quick "Copy email" button for personal outreach.

**Retention Emails Log** — a second tab showing all emails sent by the retention system: who received it, trigger type, when, and what content was included.

### Technical approach

**No database changes needed.** All data already exists in `profiles`, `favorites`, `content_visits`, `buyer_profiles`, and `retention_emails_log`.

**Files to create:**
1. `src/pages/admin/AdminWarmLeads.tsx` — main page with two tabs (Warm Users + Email Log)
2. `src/hooks/useWarmLeads.ts` — queries for warm users (joins profiles + favorites count + content visits count + buyer profile existence) and retention email log

**Files to modify:**
3. `src/App.tsx` — add lazy import and route at `/admin/warm-leads`
4. `src/pages/admin/AdminLayout.tsx` — add nav item under System section (or a new "Retention" section with a Heart icon)

**Heat score formula** (computed client-side from query results):
```
score = (favorites_count * 3) + (guides_read * 5) + (has_buyer_profile ? 10 : 0) + recency_bonus
```
Where recency_bonus = max(0, 14 - days_since_active) — users active in the last 2 weeks get up to 14 bonus points.

**Warm users query** uses 3 sub-queries aggregated by user_id:
- `SELECT user_id, COUNT(*) as fav_count FROM favorites GROUP BY user_id`
- `SELECT user_id, COUNT(*) as guide_count FROM content_visits WHERE content_type = 'guide' GROUP BY user_id`
- `SELECT user_id FROM buyer_profiles`

Then joins with `profiles` for name/email/last_active_at, sorts by computed score descending, limits to top 50.

