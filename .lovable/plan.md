

# Add Mock Data for Featured Highlights

## Summary
Update the seeding functions to populate the new `featured_highlight` field for properties (rentals and resale) and projects so the accent banners display with real content.

---

## Implementation

### Phase 1: Define Highlight Arrays

Add curated arrays of realistic highlights that make sense for each category:

**Property Highlights (Sale):**
```typescript
const SALE_HIGHLIGHTS = [
  "Panoramic sea views from every room",
  "Massive 40m² south-facing balcony",
  "Fully renovated with designer finishes",
  "Private rooftop terrace",
  "Smart home automation throughout",
  "Protected room with natural light",
  "Gourmet chef's kitchen",
  "Direct elevator to apartment",
  "Walk-in closet in master suite",
  "Floor-to-ceiling windows",
  "High ceilings throughout",
  "Corner apartment with cross ventilation",
];
```

**Property Highlights (Rental):**
```typescript
const RENTAL_HIGHLIGHTS = [
  "Move-in ready, fully furnished",
  "Pet-friendly with private garden",
  "All bills included in rent",
  "Flexible lease terms available",
  "Home office with separate entrance",
  "Quiet apartment, faces inner courtyard",
  "Walking distance to beach",
  "Near top-rated schools",
  "Underground parking included",
  "New central A/C system",
  "Recently renovated bathroom",
  "Bright and airy with balcony",
];
```

**Project Highlights:**
```typescript
const PROJECT_HIGHLIGHTS = [
  "Rooftop infinity pool with sea views",
  "Smart home technology in every unit",
  "5-star hotel-style concierge service",
  "Private landscaped gardens per unit",
  "Direct beach access for residents",
  "24/7 spa and wellness center",
  "EV charging in every parking spot",
  "Award-winning architectural design",
  "LEED-certified green building",
  "Exclusive residents-only lounge",
  "Underground parking with storage",
  "Premium designer finishes included",
];
```

### Phase 2: Distribution Logic

Not every listing should have a highlight - this makes the feature feel more authentic:

```typescript
// ~40% of properties get a highlight (makes it special)
if (Math.random() < 0.4) {
  property.featured_highlight = randomChoice(SALE_HIGHLIGHTS);
}

// ~50% of projects get a highlight (developers use this more)
if (Math.random() < 0.5) {
  project.featured_highlight = randomChoice(PROJECT_HIGHLIGHTS);
}
```

### Phase 3: File Changes

**File 1: `supabase/functions/seed-demo-data/index.ts`**

1. Add the three highlight arrays near the top with other constants
2. In the for-sale properties loop (~line 432-463): Add conditional `featured_highlight`
3. In the rental properties loop (~line 496-533): Add conditional `featured_highlight`
4. In the projects loop (~line 574-598): Add conditional `featured_highlight`

**File 2: `supabase/functions/seed-additional-properties/index.ts`**

1. Add `SALE_HIGHLIGHTS` and `RENTAL_HIGHLIGHTS` arrays
2. In `generateProperty()` function (~line 213-247): Add conditional `featured_highlight` based on listing status

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `supabase/functions/seed-demo-data/index.ts` | Add highlight arrays + populate for properties & projects |
| `supabase/functions/seed-additional-properties/index.ts` | Add highlight arrays + populate in generateProperty() |
| **Total** | **2 files** |

---

## After Deployment

The existing mock data won't automatically have highlights. To backfill:

1. **Option A (Quick):** Run a SQL update to add random highlights to existing records
2. **Option B (Clean):** Clear and re-seed the data

I can add a `?action=backfill-highlights` mode to the seed function if you'd like to update existing data without re-seeding everything.

