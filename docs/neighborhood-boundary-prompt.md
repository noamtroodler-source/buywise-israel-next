# GPT Prompt: Generate Neighborhood Boundary Data for Israeli Cities

Copy this prompt into ChatGPT (GPT-4 with browsing) or Claude:

---

## Prompt

I need neighborhood boundary coordinates for **[CITY NAME]**, Israel to display on a Leaflet map.

### Your Task:
1. **Research** the major neighborhoods in [CITY NAME], Israel
2. **Find or estimate** polygon boundaries for each neighborhood using:
   - OpenStreetMap data (query Overpass API if you can)
   - Google Maps visual boundaries
   - Municipal district maps
   - Logical geographic boundaries (major roads, parks, rivers)

3. **Output** in this exact JSON format:

```json
{
  "city": "[CITY NAME]",
  "neighborhoods": [
    {
      "name": "Neighborhood Name (English)",
      "name_he": "שם השכונה",
      "description": "Brief 1-sentence description",
      "boundary_coords": [
        [32.1850, 34.8700],
        [32.1870, 34.8720],
        [32.1860, 34.8750],
        [32.1840, 34.8730],
        [32.1850, 34.8700]
      ]
    }
  ]
}
```

### Requirements:
- **boundary_coords**: Array of [latitude, longitude] pairs forming a closed polygon
- First and last coordinate should be the same (to close the polygon)
- Minimum 4 points per polygon, ideally 8-20 for smooth boundaries
- Coordinates should be precise to 4 decimal places
- Include ALL major neighborhoods (typically 5-15 per city)

### Example for Ra'anana:
```json
{
  "city": "Ra'anana",
  "neighborhoods": [
    {
      "name": "North Ra'anana",
      "name_he": "צפון רעננה",
      "description": "Upscale area with new developments and villas",
      "boundary_coords": [
        [32.195, 34.870],
        [32.200, 34.880],
        [32.195, 34.890],
        [32.185, 34.885],
        [32.180, 34.875],
        [32.185, 34.868],
        [32.195, 34.870]
      ]
    },
    {
      "name": "City Center",
      "name_he": "מרכז העיר",
      "description": "Commercial hub with shops, restaurants, and the main park",
      "boundary_coords": [
        [32.175, 34.870],
        [32.180, 34.878],
        [32.175, 34.885],
        [32.168, 34.880],
        [32.165, 34.872],
        [32.170, 34.868],
        [32.175, 34.870]
      ]
    }
  ]
}
```

### Cities I need (do one at a time):
- Ra'anana
- Netanya  
- Herzliya
- Modiin
- Jerusalem
- Tel Aviv
- Haifa
- Beer Sheva
- Ashdod
- Ashkelon

### Tips for finding boundaries:
1. Use major roads as natural dividers
2. Parks and open spaces often mark neighborhood edges
3. Look for "שכונות" (neighborhoods) on Hebrew Wikipedia city pages
4. Check municipal websites for official district maps
5. Railway lines, highways (like Highway 4, 2) are good boundaries

Please generate the JSON for **[CITY NAME]** now.

---

## How to Use the Output

Once you have the JSON, you can update the database using SQL:

```sql
UPDATE cities 
SET neighborhoods = '[paste the neighborhoods array here]'::jsonb
WHERE slug = 'city-slug';
```

Or send it to the edge function (if you've authenticated):
```bash
curl -X POST https://eveqhyqxdibjayliazxm.supabase.co/functions/v1/update-neighborhoods \
  -H "Content-Type: application/json" \
  -d '{"city_slug": "raanana", "neighborhoods": [...]}'
```
