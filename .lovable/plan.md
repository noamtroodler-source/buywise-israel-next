

# Create JRE Agent Profiles + Show Full Bio on Agent Pages

## Summary
Create 10 new agent profiles for JRE (update existing Michael), populate with real bios/photos from JRE website, distribute 105 listings across all 11 agents, and fix agent detail page to show the full bio instead of truncating it to 2 lines.

## Step 1 — Edge Function: `create-jre-agents`

One-shot function that:

**Updates Michael Steinmetz** (existing agent `8a39b05f`):
- Full name, avatar from JRE headshot, full bio from website, LinkedIn URL, neighborhoods, specializations, `is_verified = true`

**Creates 10 new agents** with data from JRE team page:

| Agent | Title | Avatar | LinkedIn | Key Bio Detail |
|---|---|---|---|---|
| Abby Brill Schloss | Licensed Agent | Abby-Schloss-hs-sq.jpg | ✓ | American Olah, interior design, hand-holding service |
| Simone Gershon | Licensed Agent | Simone-Gershon-hs-sq.jpg | ✓ | Sydney-born, 20 yrs in Jerusalem, hotel industry background |
| Elad Ginzburg | Licensed Agent | Elad-Ginzburg-headshot-t.png | ✓ | Off-market developments, US multi-family investing, BA Economics |
| Atara Abelman | Licensed Agent | Atara-Abelman-hs-sq.jpg | ✓ | American-South African parents, tech sales background |
| Penina Abramowitz | Licensed Agent | Untitled-design.jpg | — | Interior design, flipped 3 homes, sees potential |
| Igal Elmaleh | Licensed Agent | Igal-Elmaleh-hs-sq.jpg | ✓ | HUD loans, shopping mall asset management |
| Naftali Berezin | VP Client Relations | Naftali_Berezin-headshot-t.png | ✓ | Hyatt-trained, The Beekman NY, social media presence |
| Tammy Ziv | Licensed Agent | Tammy_Ziv-headshot-t.png | — | 26 years experience, born in Talbiya, lived in London |
| Jonas Halfon | Licensed Agent | Jonas_Halfon-headshot-t.png | — | French, 9 yrs luxury, French/English/Hebrew |
| Shimon Mozes | Licensed Agent | Shimon_Mozes-headshot-t.png | — | Law background, strong interpersonal skills |

Each agent gets the **full bio paragraph** from the JRE website stored in the `bio` field.

**Listing distribution**: Round-robin all 105 listings across 11 agents (~9-10 each).

## Step 2 — Agent Detail Page: Show Full Bio

Currently the bio is truncated with `line-clamp-2`. Changes:
- Remove `line-clamp-2` from the bio paragraph so the full description shows
- Optionally add an "About" section heading for longer bios (like the professional detail page pattern)

## Files

1. **New**: `supabase/functions/create-jre-agents/index.ts` — one-shot edge function
2. **Edit**: `src/pages/AgentDetail.tsx` — remove `line-clamp-2` from bio display, add "About" heading for readability

