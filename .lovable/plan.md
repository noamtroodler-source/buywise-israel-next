

## Consolidate Blog Categories

The current 10 categories have obvious overlaps. This plan merges them down to 6 clean categories.

### Merges

| Keep (Surviving) | Absorbs | Combined Posts |
|---|---|---|
| Buying in Israel | Buying Guide (3 posts) | 8 |
| Investment | Investment Tips (2 posts) | 2 |
| Market Insights | Market Updates (1 post) | 5 |
| Neighborhoods | Neighborhood Guides (1 post) | 1 |
| Legal and Finance | (no change) | 1 |
| Living in Israel | (no change) | 1 |

### Final 6 Categories
1. **Buying in Israel** -- all purchase-related guides
2. **Investment** -- strategies, tips, opportunities
3. **Legal and Finance** -- taxes, mortgages, legal requirements
4. **Living in Israel** -- lifestyle, culture, practical info
5. **Market Insights** -- trends, analysis, market news
6. **Neighborhoods** -- area guides, local info

### Technical Steps

**1. Database migration** (single SQL migration):
- Update all `blog_posts.category_id` references from the 4 absorbed categories to their surviving counterparts
- For posts with multi-category support (the `categoryIds` array used in the wizard), update any references in the JSON/array columns
- Delete the 4 absorbed category rows: "Buying Guide", "Investment Tips", "Market Updates", "Neighborhood Guides"
- Update surviving category descriptions to be broader:
  - "Neighborhoods" description becomes "Area guides and neighborhood spotlights across Israel"
  - "Investment" description becomes "Real estate investment strategies, tips, and opportunities"
  - "Market Insights" description becomes "Market trends, analysis, news, and updates"
  - "Buying in Israel" description becomes "Guides and advice for purchasing property in Israel"

**2. No code changes needed** -- the blog page, filters, and professional blog wizard all pull categories dynamically from the database, so the reduced list will automatically appear everywhere (blog filter pills, admin blog review, professional blog wizard category selector).

