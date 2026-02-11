

# Add Transit Context Line to Property Location

## What We're Building
A single contextual line below the address and map buttons showing train station proximity (travel time from this specific property to the nearest train station), adapting to the user's selected travel mode. For cities without a train station, a graceful note. Plus: removing train station entries from the city anchor cards to avoid duplication, replacing them with more useful local anchors.

## Data Layer

### 1. Add train station coordinates to cities table
Add 3 new columns to the `cities` table so train station info lives at the city level (not duplicated in anchors):

- `train_station_name` (text, nullable)
- `train_station_lat` (numeric, nullable)  
- `train_station_lng` (numeric, nullable)

### 2. Populate from existing anchor data
Copy coordinates from the 17 train station city_anchors into the new cities columns. Also fix Ra'anana which has `has_train_station = false` but actually has a train station anchor with coordinates.

### 3. Remove train station anchors and replace
Delete the 17 train station entries from `city_anchors` and insert replacement mobility anchors. Proposed replacements (focused on useful transport/mobility context for each city):

| City | Removed | Replacement |
|------|---------|-------------|
| Ashdod | Ashdod Ad Halom Train Station | Route 4 (Ashdod–Tel Aviv) Access |
| Ashkelon | Ashkelon Train Station | Route 4 South Access |
| Beer Sheva | Be'er Sheva Center Train Station | Route 40 (Be'er Sheva–Tel Aviv) |
| Beit Shemesh | Beit Shemesh Train Station | Route 38 / Route 1 Junction |
| Hadera | Hadera West Train Station | Route 65 / Wadi Ara Junction |
| Haifa | Haifa Center HaShmona | Carmelit / Metronit Network |
| Herzliya | Herzliya Train Station | Ayalon Highway North Access |
| Hod HaSharon | Kfar Saba-Nordau Station | Route 531 Access |
| Jerusalem | Yitzhak Navon Station | Jerusalem Light Rail (Red/Green Lines) |
| Kfar Saba | Kfar Saba-Nordau Station | Route 6 / Trans-Israel Highway Access |
| Modi'in | Modiin Center Station | Route 443 (Modi'in–Jerusalem) |
| Netanya | Netanya Train Station | Route 2 Coastal Highway Access |
| Pardes Hanna | Pardes Hanna Station | Route 65 Junction |
| Petah Tikva | Petah Tikva-Segula Station | Geha Road / Route 4 Junction |
| Ramat Gan | Savidor Center / Ayalon | Ayalon Highway Central Access |
| Tel Aviv | Tel Aviv Savidor Center | Ayalon Highway / Light Rail Access |
| Zichron Yaakov | Binyamina Station | Route 4 / Route 70 Junction |
| Ra'anana | Ra'anana West Train Station | Route 531 / Glilot Access |

These replacements keep the "mobility" anchor type but shift from train (now handled by the transit line) to road/transit network access points that are genuinely useful for orientation.

## Frontend Changes

### 4. New hook: `useCityTransitInfo`
A small hook that queries the `cities` table for `has_train_station`, `train_station_name`, `train_station_lat`, `train_station_lng` given a city name. Uses the same slug-matching logic as `useCityAnchors`. Cached for 1 hour.

### 5. Transit line in PropertyLocation
Placed between the address/buttons block and the "Search a location" section (around line 203). Uses the same `travelMode` state that already exists in the component.

**When city has a train station:**
```
[TrainFront icon] [Station Name] · [X] min [mode] from here
```
Example: "Jerusalem Yitzhak Navon Station · 12 min walk from here"

Travel time calculated using the same Haversine + mode formula already used in CityAnchorCard (walk: 12 min/km, transit: 1.8 min/km + 10, drive: 1.2 min/km + 2).

**When city has no train station:**
```
[TrainFront icon] No train station in [City] · Nearest access via bus
```

Styled as a single `text-sm text-muted-foreground` line with an icon, matching the existing address line style. Nothing flashy.

### 6. Filter train anchors from cards
In PropertyLocation's rendering of city anchors, filter out any anchor with `icon === 'train'` as a safety net (in case some remain or are re-added later). This prevents duplication even without the data cleanup.

## Files to Create/Edit
- **New**: `src/hooks/useCityTransitInfo.ts` (small query hook)
- **Edit**: `src/components/property/PropertyLocation.tsx` (add transit line + filter train anchors)
- **DB migration**: Add columns to cities, populate data, swap anchors

## What's NOT Changing
- The travel mode toggle stays where it is
- City anchor cards continue to work as before (minus train entries)
- No new sections or visual weight added
- The map, address, buttons all stay the same

