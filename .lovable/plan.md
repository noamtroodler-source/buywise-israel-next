

## Auto-Extract Brand Colors from Logos

Replace the hardcoded color map with a system that automatically extracts the dominant color from each professional's logo image using an HTML canvas.

### How it works

1. When a logo image loads, we draw it onto a hidden canvas
2. We sample all pixels, skip whites/near-whites/blacks/near-blacks/grays (these are backgrounds, not brand colors)
3. We find the most frequently occurring "colorful" pixel -- that's the brand color
4. Cache the result so we only extract once per logo

### What changes

**New utility: `src/hooks/useExtractedColor.ts`**
- A React hook that takes an image URL and returns the extracted dominant color
- Uses an off-screen canvas to sample pixels when the image loads
- Filters out whites (r,g,b all > 220), near-blacks (all < 35), and low-saturation grays
- Groups similar colors into buckets (rounding to nearest 16) to find the true dominant
- Caches results in a module-level Map so extraction only runs once per URL
- Returns `null` while loading, then the hex color string

**Update: `src/components/professionals/professionalColors.ts`**
- Keep the hardcoded map as an instant fallback (so colors render before images load)
- Keep `getAccentColor` for initial/server-side use
- The extracted color will override at the component level once available

**Update: `src/components/professionals/ProfessionalCard.tsx`**
- Import the new `useExtractedColor` hook
- Resolve the logo URL (from DB or local fallback map)
- Use extracted color when available, fall back to `getAccentColor` for the initial render
- Result: colors automatically match the logo with zero manual mapping needed

**Update: `src/pages/ProfessionalDetail.tsx`**
- Same pattern: use extracted color when ready, hardcoded fallback until then
- Pass the resolved color down to `ProfessionalContactCard` and `ProfessionalHighlights`

**No changes needed** to `ProfessionalContactCard.tsx` or `ProfessionalHighlights.tsx` -- they already accept `accentColor` as a prop.

### Edge case handling

- **White/light logos**: Skip pixels where R, G, and B are all above 220
- **Black text in logos**: Skip pixels where R, G, and B are all below 35
- **Gray backgrounds**: Skip pixels with low saturation (difference between max and min channel < 30)
- **Transparent PNGs**: Skip fully transparent pixels (alpha < 128)
- **Multi-color logos**: The bucketing algorithm picks the most frequently occurring colorful region
- **Fallback chain**: Extracted color > DB `accent_color` > hardcoded map > default blue

### Technical details

The pixel sampling algorithm:
```text
1. Draw image onto 50x50 canvas (small = fast, enough for dominant color)
2. Read all pixel data
3. For each pixel:
   - Skip if alpha < 128
   - Skip if near-white, near-black, or gray
   - Round R/G/B to nearest 16 to create a "bucket key"
   - Increment that bucket's count, store the actual pixel color
4. Return the color from the most popular bucket
5. Cache by image URL
```

### Files to create/modify

| File | Action |
|------|--------|
| `src/hooks/useExtractedColor.ts` | Create -- canvas-based color extraction hook |
| `src/components/professionals/ProfessionalCard.tsx` | Edit -- use extracted color with fallback |
| `src/pages/ProfessionalDetail.tsx` | Edit -- use extracted color with fallback |
| `src/components/professionals/professionalColors.ts` | Keep as-is (instant fallback) |
