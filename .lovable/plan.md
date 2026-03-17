

# Auto-Generate English Listing Titles During Import

## Problem
Yad2 and Hebrew websites produce titles that are either Hebrew-only, just addresses, or meaningless strings. These don't meet the listing wizard's professional title standards (20-60 chars, Title Case).

## What Changes

### 1. Update AI extraction prompt to generate English titles

In `buildExtractionPrompt`, add a title instruction to the extraction rules section (~line 1448):

```
- title: Generate a professional English listing title (20-60 characters, Title Case).
  Format: "[Size]sqm [Type] in [Neighborhood/City]" or "[Bedrooms]-Bedroom [Type] in [Neighborhood]"
  Examples: "Spacious 4-Bedroom Apartment in Arnona", "Renovated Penthouse in Neve Tzedek"
  If the page already has a good English title (not just an address or Hebrew text), keep it.
  Do NOT just use the street address as the title.
```

### 2. Add a `generateListingTitle` fallback function

After AI extraction, if the title is still Hebrew, an address, or too short — generate one from the extracted fields (bedrooms, property_type, neighborhood, city, size_sqm). Apply Title Case. This runs at ~line 2222 before the DB insert.

```
function generateListingTitle(listing: any): string {
  // If existing title is good English (20-60 chars, Latin chars), keep it
  if (listing.title && /[a-zA-Z]/.test(listing.title) && listing.title.length >= 20 && ...) 
    return toTitleCase(listing.title);
  
  // Build from fields: "3-Bedroom Apartment in Rehavia, Jerusalem"
  const type = formatPropertyType(listing.property_type);
  const location = listing.neighborhood 
    ? `${listing.neighborhood}, ${listing.city}` 
    : listing.city;
  if (listing.bedrooms) return toTitleCase(`${listing.bedrooms}-Bedroom ${type} in ${location}`);
  if (listing.size_sqm) return toTitleCase(`${listing.size_sqm}sqm ${type} in ${location}`);
  return toTitleCase(`${type} in ${location}`);
}
```

### 3. Title Case helper

```
function toTitleCase(str: string): string {
  const minor = new Set(["in", "at", "on", "the", "a", "an", "and", "or", "of", "for"]);
  return str.split(" ").map((w, i) => 
    i === 0 || !minor.has(w.toLowerCase()) 
      ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() 
      : w.toLowerCase()
  ).join(" ");
}
```

### 4. Apply to both insertion points

- Line ~2222 (main `processOneItem`): `title: generateListingTitle(listing)`
- Line ~3007 (Yad2 `normalizeYad2Item`): Generate title from normalized fields instead of using `raw.title`

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/import-agency-listings/index.ts` | Add title generation prompt, `generateListingTitle`, `toTitleCase`, apply at both insert points |

