

# Fix JRE Agent Profile Photos — Correct Avatar URLs

## Problem
All 11 JRE agent `avatar_url` values use incorrect WordPress upload date paths (e.g., `/2023/08/` instead of `/2025/09/`), so the images likely 404 and agents show fallback initials instead of photos.

## Solution
One-shot edge function `fix-jre-avatars` that updates each agent's `avatar_url` to the correct URL as found on the live JRE team page.

## Correct URLs

| Agent (ID) | Correct avatar_url |
|---|---|
| Michael Steinmetz (`8a39b05f`) | `.../2025/09/Michael-Steinmetz-hs-sq.jpg` |
| Abby Brill Schloss (`c87a9efc`) | `.../2025/09/Abby-Schloss-hs-sq.jpg` |
| Simone Gershon (`237e667d`) | `.../2025/09/Simone-Gershon-hs-sq.jpg` |
| Elad Ginzburg (`e7245ea3`) | `.../2026/02/Elad-Ginzburg-headshot-t.png` |
| Atara Abelman (`a2cf9bc4`) | `.../2025/09/Atara-Abelman-hs-sq.jpg` |
| Penina Abramowitz (`9d6e0972`) | `.../2025/09/Untitled-design.jpg` |
| Igal Elmaleh (`5d3e6418`) | `.../2025/09/Igal-Elmaleh-hs-sq.jpg` |
| Naftali Berezin (`f0bc5a38`) | `.../2026/02/Naftali_Berezin-headshot-t.png` |
| Tammy Ziv (`596363a8`) | `.../2026/02/Tammy_Ziv-headshot-t.png` |
| Jonas Halfon (`8b01e2b7`) | `.../2026/02/Jonas_Halfon-headshot-t.png` |
| Shimon Mozes (`06696c2f`) | `.../2026/02/Shimon_Mozes-headshot-t.png` |

## Implementation
1. **New**: `supabase/functions/fix-jre-avatars/index.ts` — one-shot edge function with 11 UPDATE statements
2. Deploy, invoke once, verify photos load, delete function

## Files
1. `supabase/functions/fix-jre-avatars/index.ts` (new, temporary)

