## Plan: Publish blog posts 21–30

### 1. Editorial cleanup of `/mnt/documents/bwi_posts_21_30_final.md`
- Replace every "Anglo" with "English-speaking community" / "international buyers" (context-appropriate) across posts 21, 22, 23, 24, 25 — including the Post 24 comparison table column header.
- Spell out "NBN" → "Nefesh B'Nefesh (NBN)" on first mention in Post 21.
- Strip the broken `*Related: Post X*` footers from all 10 posts (the site has no such links).
- De-dupe the "honest version / honest note / honest framework" tic — vary phrasing.
- Save as `bwi_posts_21_30_revised.md`.

### 2. Database insert
- Parse the revised markdown with a Node script.
- Insert 10 rows into `blog_posts` under the existing **City Guides** + relevant tax/process categories:
  - 21 Rehovot, 22 Ashdod, 23 N vs S Tel Aviv, 24 Jerusalem neighborhoods, 25 TA vs Jerusalem → City Guides
  - 26 Buyer tax brackets, 27 Lawyer fees, 28 VAT, 29 Arnona, 30 Wiring money → Taxes & Costs / Process category
- Fields: slug, title, excerpt, body (markdown), category_id, city_id where applicable, published_at = now, status = published.

### 3. AI cover images (10)
- Generate editorial 1536×1024 images via `imagegen` for each post topic:
  - 21 Weizmann/Rehovot science campus, 22 Ashdod marina, 23 Tel Aviv north vs south split, 24 Jerusalem stone neighborhoods montage, 25 TA skyline vs Jerusalem Old City split, 26 Tax document/shekel scales, 27 Lawyer desk with contract, 28 New construction crane + price tag, 29 Municipal building/keys, 30 International wire transfer concept.
- Upload to `property-images` bucket under `blog/post-21.jpg`…`blog/post-30.jpg`.
- Update each `blog_posts.cover_image_url` via insert tool.

### 4. Verify
- Read back the 10 inserted rows, confirm slugs, categories, and cover URLs all resolve.

### Technical notes
- Use `supabase--insert` for all data writes (no schema changes).
- Images saved to `/mnt/documents/blog/post-XX.jpg` then uploaded via `supabase--storage_upload`.
- No code changes to the repo.
