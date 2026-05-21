# Review: Posts 31–40 vs. BuyWiseIsrael site + brand

## Verdict
Strong content overall — accurate, on-tone, useful. **Not safe to publish as-is.** Three brand violations and a few stale/imprecise numbers need fixing first. After fixes, these are publish-grade.

## ✅ Numbers verified against site code
- **Foreign purchase tax 8% from ₪1 → 10% above ₪6,055,070** — matches `purchaseTax.ts` ✓
- **VAT 18% (Jan 2025)** — matches `constants.ts` `VAT_RATE: 0.18` ✓
- **50% LTV cap for foreign buyers** — matches `mortgage.ts` `foreign: 0.50` ✓
- **≥1/3 fixed-rate mortgage requirement** — matches site ✓
- **Mas Shevach 25% for foreign sellers** — matches `capitalGains.ts` ✓
- **Section 122 flat 10% rental tax election** — accurate ✓
- **Agent 2% + VAT, lawyer 0.5–1.5% + VAT, Form 7000 30-day, tax 60-day** — all match `purchaseCosts.ts` ✓
- **Mamad mandatory since 1993, TAMA 38 ended 29 Aug 2024, no Israeli inheritance tax since 1981** — all factually correct ✓
- **Yield math (3% gross, 1.5–2% net on TA/Jerusalem)** — aligns with site rental-yield logic ✓

## 🚩 Must-fix before publishing

### Brand voice violations (core rule: never use "Anglo")
- **Post 37**: "Anglo Facebook group discussions" → "English-speaker community discussions"
- **Post 37 intro**: "the same five misunderstandings that appear in… Anglo Facebook group discussions, and post-purchase regrets, reliably, across the community" — rewrite without "Anglo"
- Sweep all 10 posts for any other "Anglo" — none found in 31–36, 38–40, but double-check.

### Broken cross-links
- Every post ends with `*Related: Post 32 · Post 47…*` — same broken pattern as 11–30 batch. Strip these entirely or replace with real slugs once the full library is loaded.

### Stale/imprecise numbers
- **Post 35**: "prime was approximately 5.5% in early 2026" — site's `CURRENT_RATES.prime` is 6.0–7.0%. Update to "approximately 6% in early 2026" to match site.
- **Post 34**: "federal estate tax exclusion is $13.61 million (2024)" — outdated. 2026 figure is ~$13.99M (and TCJA sunset risk worth noting). Update year + figure.
- **Post 36**: "Israeli residential property rose approximately 7–8% nationally in 2024" — worth softening to "rose meaningfully in 2024 (CBS data)" since this isn't verified against a site source-of-truth table; matches our market-data-integrity policy.

## ⚠️ AI-tell phrasing to de-dupe
Same tic from posts 11–30 reappears:
- "Here is what this means" (Post 32)
- "That's the honest math" (Post 36)
- "The honest answer is" (Post 39)
- "The middle estimate" (Post 36)
- "Here's an honest comparison" (Post 40)

Rotate to natural alternatives (e.g., "In practice", "Concretely", "The realistic case") so a reader scrolling the blog index doesn't see the same scaffolding three posts in a row.

## ✅ On-brand strengths (keep as-is)
- "Trusted Friend" voice is consistent — direct, calm, no hype.
- Repeated, accurate plugs for BuyWiseIsrael's calculators and neighborhood data (Posts 36, 37, 38) — aligns with platform.
- Disclaimers on Posts 31 + 34 ("Consult a CPA / attorney with US-Israel experience") — exactly right.
- Hebrew terms introduced in italics with English gloss (al HaNiyar, chof bank, mas shevach, teudat gmar, mesiran maftechot, he'arat azhara) — on-brand.

## Plan to execute (next turn, on approval)

1. **Editorial pass** → produce `/mnt/documents/bwi_posts_31_40_revised.md`:
   - Replace every "Anglo" with "English-speaking" / "English-speaker community".
   - Strip all `*Related: Post X…*` footers.
   - Fix prime rate (5.5% → 6%) in Post 35.
   - Update estate exclusion in Post 34 to 2026 figure + TCJA sunset note.
   - Soften 7–8% appreciation claim in Post 36.
   - Rotate the 4–5 "honest …" / "Here is what this means" tics.
2. **Insert into `blog_posts`** via `INSERT … ON CONFLICT (slug) DO UPDATE` — categories: `tax-costs` (31, 34, 35), `process-legal` (32, 33, 39), `market-insights` (36, 37, 40), `getting-started` (38). Set `status=published`, `published_at=now()`, `reading_time_minutes` calculated.
3. **Generate 10 editorial cover images** (1536×1024) via `imagegen`, upload to `property-images/blog/post-31.jpg`…`post-40.jpg`, **no embedded text** in compositions to avoid the Post-26 garbled-text issue.
4. **Verify** with `read_query` that all 10 slugs resolve with cover URLs.

Approve and I'll run the full sequence.
