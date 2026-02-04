
## Add 3-6 Varied Images Per Mock Listing

### Current Issue
The `seed-additional-properties` function sets `images: null` for all generated properties. This means the 2,500 mock listings we just created don't have any photos.

### Solution

**1. Add Curated Image Pools** (from existing seed-demo-data)
Copy over the proven Unsplash image collections:
- `PROPERTY_INTERIORS` - 30 interior shots (living rooms, kitchens, bedrooms)
- `PROPERTY_EXTERIORS` - 20 exterior shots (house fronts, balcony views)
- `MODERN_BUILDINGS` - 20 building facade shots

**2. Create Image Generation Function**
```typescript
function generatePropertyImages(): string[] {
  const count = randomInt(3, 6);
  const images: string[] = [];
  
  // Mix of 1 exterior + 2-5 interiors for variety
  images.push(randomChoice(PROPERTY_EXTERIORS));
  
  // Add unique interiors (no duplicates within same listing)
  const shuffledInteriors = [...PROPERTY_INTERIORS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count - 1 && i < shuffledInteriors.length; i++) {
    images.push(shuffledInteriors[i]);
  }
  
  return images;
}
```

**3. Update Property Generation**
Change line 159 from:
```typescript
images: null,
```
To:
```typescript
images: generatePropertyImages(),
```

**4. Fix Existing Properties (Optional Update Query)**
Also create a separate function endpoint to backfill images for the ~2,500 properties that were already created without images.

---

## Technical Changes

### File: `supabase/functions/seed-additional-properties/index.ts`

Add after line 64 (after STREET_NAMES):

```typescript
// Curated Unsplash property images
const PROPERTY_INTERIORS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  // ... 28 more interior images
];

const PROPERTY_EXTERIORS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  // ... 18 more exterior images
];
```

Add after `randomSubset` function (around line 78):

```typescript
function generatePropertyImages(): string[] {
  const count = randomInt(3, 6);
  const images: string[] = [];
  
  // Start with an exterior shot
  images.push(randomChoice(PROPERTY_EXTERIORS));
  
  // Add unique interior shots
  const shuffled = [...PROPERTY_INTERIORS].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count - 1; i++) {
    images.push(shuffled[i]);
  }
  
  return images;
}
```

Update line 159:
```typescript
// Before
images: null,

// After  
images: generatePropertyImages(),
```

### Backfill Existing Properties

Add a second mode to the function that updates existing properties with null images:

```typescript
// If called with action=backfill, update existing properties
if (action === 'backfill') {
  const { data: propsWithoutImages } = await supabase
    .from('properties')
    .select('id')
    .is('images', null);
    
  for (const prop of propsWithoutImages) {
    await supabase
      .from('properties')
      .update({ images: generatePropertyImages() })
      .eq('id', prop.id);
  }
}
```

---

## Result

After this update:
- All NEW properties seeded will have 3-6 varied images
- Images will include 1 exterior + 2-5 unique interior shots
- Calling the function with `?action=backfill` will fix the ~2,500 existing properties without images
- Each listing's gallery will look realistic with different photos
