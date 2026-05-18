## Goal

Stand up **Demo Realty TLV** — a hidden demo agency with a realistic team and inventory — so you can record the full Loom walkthrough (invite → signup → settings → team → add/assign listing → fix incomplete listings → submit for review) without touching real partners or polluting public surfaces.

## Guardrails

- Everything created sits in **draft / unpublished** so it never appears on `/listings`, `/map`, `/agencies`, homepage, or search.
- Agency uses `management_status='draft'`, `verification_status='draft'`, `is_verified=false`, `is_partner=false`.
- All 30 listings start `is_published=false`, `verification_status='draft'`.
- Slug `demo-realty-tlv`, and every row tagged `[DEMO]` in admin notes for one-line cleanup.
- Respects No-Fabrication core memory: this is a recording sandbox, never surfaced publicly, never counted in metrics.

## What gets created

### 1. The agency (1 row in `agencies`)
- Name: **Demo Realty TLV** · slug `demo-realty-tlv`
- AI-generated minimalist logo uploaded to `agency-logos` bucket
- 2-paragraph "Trusted Friend" English description
- Office: Rothschild Blvd, Tel Aviv (placeholder)
- Demo phone / email / website
- Cities covered: Tel Aviv, Jerusalem, Netanya, Herzliya, Ramat Gan
- Specializations: Apartments, Investment, International Buyers
- 3 placeholder social links

### 2. The team (6 rows in `agents`, all provisional — no `auth.users` accounts so no real inboxes pinged)

| `agency_role` | Name | Email | Photo |
|---|---|---|---|
| owner | Sarah Cohen | demo.owner@buywiseisrael.com | AI portrait |
| **admin** | **Noam Troodler** | **noam.troodler@gmail.com** | AI portrait |
| agent | David Levi | demo.agent1@buywiseisrael.com | AI portrait |
| agent | Maya Friedman | demo.agent2@buywiseisrael.com | AI portrait |
| agent | Yossi Mizrahi | demo.agent3@buywiseisrael.com | AI portrait |
| agent | Rachel Goldberg | demo.agent4@buywiseisrael.com | AI portrait |

Each gets bio, license number, years of experience, languages (Hebrew + English ± others), neighborhoods covered.

Note: Noam sits as **admin** (full operational power per `useAgencyPermissions`), Sarah holds the founder "owner" label.

### 3. The inventory (30 rows in `properties`)

**Distribution by agent** (so you can demo filtering/reassignment):
- Sarah (owner): 6
- Noam (admin): 6
- David: 5 · Maya: 5 · Yossi: 4 · Rachel: 4

**Mix**:
- ~70% apartment, plus penthouse, garden_apartment, mini_penthouse, house, duplex
- ~22 `for_sale`, ~8 `for_rent`
- City spread weighted Tel Aviv, then Jerusalem / Herzliya / Netanya / Ramat Gan
- Real popular neighborhoods (Florentin, Lev Tel Aviv, Old North, Baka, German Colony, etc.)
- Realistic NIS prices per city × type
- 3-5 stock interior URLs per listing (picsum, URL-only — respects zero-storage policy)
- lat/lng within each city's bounding box so they render on the map when published

### Completeness — 2 complete, 28 incomplete

So the "fix listings needing required info" step in the launch checklist actually has work to do on camera.

- **2 listings**: fully complete — all core fields populated. Used to demo "submit ready listings for review."
- **28 listings**: each missing **1 or 2** of these core fields, varied across the set so the dashboard shows different "needs attention" reasons:
  - `address` (null on ~6 — most visible missing field)
  - `bedrooms` (null on ~6)
  - `size_sqm` (null on ~5)
  - `bathrooms` (null on ~4)
  - `price` set to 0 / nullish (~3)
  - `description` blank (~4)

Each incomplete listing gets `verification_status='draft'` so it falls under the "to_review" bucket the `AgencyOnboardingProgress` checklist already filters on. This lights up the "Fix listings needing required info" step with a real count.

## Recording flow this unlocks

1. **Team page** — 6 agents on roster, demo "Send invite link" + reassign listings between them
2. **Listings page** — 30 items, filter by agent, see "to-review" badge, bulk actions
3. **Fix missing info** — click into incomplete listings, fill the missing field on camera
4. **Submit for review** — push the 2 complete + freshly-fixed ones
5. **Add listing wizard** — record a 31st live for the camera
6. **Admin review** — switch to admin chair, approve one
7. **Public preview** — flip `is_published=true` on 2-3 briefly to show buyer side, then flip back

## Cleanup

One SQL line removes everything: delete properties + agents + agency where `agency_id = '<demo-id>'`.

## Technical notes

- Logo + 6 portraits: generated via image tools, uploaded to existing `agency-logos` / `agent-avatars` buckets (will verify bucket names during build)
- Property images: remote picsum URLs in `images` array (same pattern Yad2 imports use)
- All inserts via the `supabase--insert` tool in two passes: (1) agency + agents, (2) properties referencing returned agent IDs
- No schema changes, no migration, no code edits, no edge function changes

## Open before I build

1. **Logo vibe** — clean wordmark in deep navy + warm gold, or different palette?
2. **Sarah/owner email** — `demo.owner@buywiseisrael.com` placeholder OK, or want a specific one?
