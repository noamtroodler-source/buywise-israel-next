

## Extract Hero Image Map to Utility File

### What
Move lines 29–100 of `AreaDetail.tsx` (all 34 hero image imports + the `cityHeroImages` map) into a new file `src/lib/cityHeroImages.ts`. Then replace those 70 lines in `AreaDetail.tsx` with a single import.

### Files

| File | Action |
|------|--------|
| `src/lib/cityHeroImages.ts` | **Create** — paste all 34 imports + the exported `cityHeroImages` record |
| `src/pages/AreaDetail.tsx` | **Edit** — remove lines 29–100, add `import { cityHeroImages } from '@/lib/cityHeroImages'` |

Net result: `AreaDetail.tsx` drops from ~334 lines to ~264 lines with zero behavior change.

