
# Map Sharing — Polished Share Button

## What Already Works
The URL already encodes the full map state (viewport, all filters, drawn polygon, city, sort). Sharing the URL *already* reproduces the exact view. The toolbar has a basic Share button but it lacks feedback and sharing options.

## What This Adds

### 1. Replace bare share button with a dropdown menu (like property ShareButton)
The current share button silently copies or triggers `navigator.share`. Replace it with a dropdown offering:
- **Copy Link** -- copies URL, shows "Link copied!" toast
- **WhatsApp** -- sends a descriptive message with the URL via the existing `openWhatsApp` system
- **Email** -- opens `mailto:` with subject and body containing the URL

### 2. Dynamic share text
Generate a human-readable description from current filters:
- "Properties for sale in Jerusalem, 2M-4M, 3+ beds"
- "Rentals in Tel Aviv, up to 8,000/mo"
- Falls back to "Map search on BuyWise Israel" if no filters active

### 3. Mobile share button
Add a share icon to the `MobileMapFilterBar` so mobile users can share too.

### 4. Track shares
Use the existing `useShareTracking` hook to log map shares (entity_type: 'map_search').

## Files to Modify

**1. `src/components/map-search/MapToolbar.tsx`**
- Replace the plain share button with a `MapShareMenu` dropdown component
- Remove inline `handleShare`

**2. `src/components/map-search/MapShareMenu.tsx` (new)**
- Dropdown with Copy Link, WhatsApp, Email options
- Accepts no props (reads `window.location.href` directly)
- Builds descriptive text from current URL search params using a `buildMapShareText()` helper
- Uses `openWhatsApp`, `navigator.clipboard`, `mailto:` link
- Tracks via `useShareTracking`

**3. `src/components/map-search/MobileMapFilterBar.tsx`**
- Add a share icon button to the filter bar row that triggers the same share dropdown

**4. `src/lib/mapShareText.ts` (new)**
- Pure function: `buildMapShareText(searchParams: URLSearchParams): string`
- Reads status, city, price range, rooms from params
- Returns a one-line summary like "3+ bed properties for sale in Jerusalem, 2M-4M"

## Technical Details

### Share text generation logic
```text
Input: ?status=for_sale&city=Jerusalem&min_price=2000000&max_price=4000000&min_rooms=3
Output: "3+ bed properties for sale in Jerusalem, 2M-4M | BuyWise Israel"

Input: ?status=for_rent&city=Tel+Aviv
Output: "Rentals in Tel Aviv | BuyWise Israel"

Input: (no filters)
Output: "Property search on BuyWise Israel"
```

### WhatsApp message format
```text
Check out this search on BuyWise Israel:
3+ bed properties for sale in Jerusalem, 2M-4M
https://buywiseisrael.com/map?status=for_sale&city=Jerusalem&...
```

### Email format
```text
Subject: 3+ bed properties for sale in Jerusalem | BuyWise Israel
Body: I found some interesting properties:\n\n[URL]
```

### Component structure
The `MapShareMenu` is a small self-contained dropdown (DropdownMenu from Radix) that wraps a trigger button (passed as children or rendered internally). It reads the URL, builds the text, and handles all three share methods.
