

## Fix Import Failures + City-Only Filtering

### Problems Identified

1. **Missing city**: AI fails to extract city from pages where it's implied by the domain (e.g., `jerusalem-real-estate.co`) or neighborhood context
2. **Price on request**: Listings with no price fail validation (`price must be greater than 0`)
3. **Off-platform cities**: Listings from cities not served by the platform get imported unnecessarily
4. **Strict validation**: No fallback logic before rejecting items

### Solution (all changes in `supabase/functions/import-agency-listings/index.ts`)

#### 1. Add a supported cities whitelist

Add a constant array of the 25 cities from the `cities` table at the top of the file. After AI extraction, if the extracted city doesn't match any supported city (case-insensitive, with common alias matching), skip the listing with a clear message like "City not supported: Tiberias".

```text
const SUPPORTED_CITIES = [
  "Ashdod", "Ashkelon", "Beer Sheva", "Beit Shemesh", "Caesarea",
  "Efrat", "Eilat", "Givat Shmuel", "Gush Etzion", "Hadera",
  "Haifa", "Herzliya", "Hod HaSharon", "Jerusalem", "Kfar Saba",
  "Ma'ale Adumim", "Mevaseret Zion", "Modi'in", "Netanya",
  "Pardes Hanna", "Petah Tikva", "Ra'anana", "Ramat Gan",
  "Tel Aviv", "Zichron Yaakov",
];
```

A fuzzy matcher function will normalize strings (strip apostrophes, hyphens, lowercase) and match against the list, returning the canonical city name. This handles variations like "Modiin" -> "Modi'in", "Beer Sheba" -> "Beer Sheva", "TLV" -> "Tel Aviv", etc.

#### 2. Add city inference from domain/URL

Before the AI extraction prompt, extract the website domain from the item URL. Pass it as context to the AI prompt so Gemini can infer the city. Additionally, after AI extraction, if city is still missing, apply a code-level domain-to-city mapping:

```text
const DOMAIN_CITY_HINTS: Record<string, string> = {
  "jerusalem": "Jerusalem",
  "telaviv": "Tel Aviv",
  "tlv": "Tel Aviv",
  "haifa": "Haifa",
  "herzliya": "Herzliya",
  "netanya": "Netanya",
  "raanana": "Ra'anana",
  "modiin": "Modi'in",
  "beersheva": "Beer Sheva",
  "ashdod": "Ashdod",
  "ashkelon": "Ashkelon",
  // ... etc
};
```

After AI extraction, if `listing.city` is empty:
1. Check the URL domain against `DOMAIN_CITY_HINTS`
2. If a match is found, set `listing.city` to that value

#### 3. Update the AI extraction prompt

Add two pieces of context to the extraction prompt:
- The website domain name (so the AI can infer city from domain like `jerusalem-real-estate.co`)
- The list of supported cities (so the AI returns canonical names)
- Explicit instruction: "If the city is not explicitly stated, infer it from the domain name, URL path, or neighborhood context. Return city as one of the supported cities."
- Explicit instruction: "If no price is listed (e.g., 'Price on Request', 'Call for price'), set price to 0."

#### 4. Relax validation for price

Change the `validatePropertyData` function to allow `price === 0` as a valid "Price on Request" state instead of failing validation. The check becomes:

```text
if (listing.price != null && listing.price < 0) {
  errors.push("price cannot be negative");
} else if (listing.price != null && listing.price > 0 && listing.price < 1000) {
  errors.push(`price ${listing.price} seems too low`);
}
// price === 0 or null/undefined is allowed (Price on Request)
```

Also default missing price to 0 (instead of failing) when inserting:
```text
price: listing.price || 0,  // 0 = Price on Request
```

#### 5. City validation gate (after extraction, before insert)

After AI extraction and city inference, validate the city against the supported list:

```text
// Normalize and match city
const matchedCity = matchSupportedCity(listing.city);
if (!matchedCity) {
  await sb.from("import_job_items").update({
    status: "skipped",
    error_message: `City not supported: "${listing.city || '(none)'}". Only 25 featured cities are imported.`
  }).eq("id", item.id);
  failed++;
  continue;
}
listing.city = matchedCity; // Use canonical name
```

This applies to both property and project paths.

### Order of Operations (per item)

1. Scrape page
2. Pre-filter sold/rented keywords
3. AI extraction (with domain hint + supported cities in prompt)
4. Post-extraction city inference from domain (if city still missing)
5. City whitelist validation (skip if not in 25 cities)
6. Data validation (relaxed price rules)
7. Duplicate detection
8. Image download, geocode, insert

### Files Modified

- `supabase/functions/import-agency-listings/index.ts` -- all changes in this single file

### No UI Changes Needed

The existing import UI already displays skip/fail messages. Users will see clear messages like:
- "City not supported: Tiberias. Only 25 featured cities are imported."
- Items with "Price on Request" will import successfully with price = 0

