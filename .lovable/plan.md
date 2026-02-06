
# Populating Neighborhood Highlights Data

## Current State
- **5 cities** have existing (less detailed) neighborhood data: Ra'anana, Herzliya, Jerusalem, Netanya, Ramat Gan
- **25 cities** total need to be populated with your comprehensive new data
- The new data uses the "trusted friend" voice with honest trade-offs

## Implementation

I'll execute SQL UPDATE statements for all 30 cities in the provided JSON. Each city will have its `featured_neighborhoods` column updated with the curated content.

### Data Summary

| City | Neighborhoods | Price Tiers |
|------|---------------|-------------|
| Ra'anana | 4 | 3 premium, 1 mid-range |
| Jerusalem | 4 | 2 ultra-premium, 2 premium |
| Beit Shemesh | 4 | 1 premium, 2 mid-range, 1 budget |
| Modi'in | 4 | 2 premium, 2 mid-range |
| Netanya | 4 | 1 premium, 2 mid-range, 1 budget |
| Herzliya | 4 | 1 ultra-premium, 2 premium, 1 mid-range |
| Ramat Gan | 4 | 2 premium, 2 mid-range |
| Tel Aviv | 4 | 2 ultra-premium, 2 premium |
| Givatayim | 3 | 3 premium |
| Petah Tikva | 4 | 1 premium, 2 mid-range, 1 budget |
| Holon | 3 | 2 mid-range, 1 budget |
| Bat Yam | 3 | 2 mid-range, 1 budget |
| Hod HaSharon | 3 | 3 premium |
| Rosh HaAyin | 2 | 1 mid-range, 1 budget |
| Givat Shmuel | 2 | 2 premium |
| Kfar Saba | 3 | 1 premium, 2 mid-range |
| Haifa | 4 | 1 premium, 2 mid-range, 1 budget |
| Mevaseret Zion | 2 | 1 premium, 1 mid-range |
| Ashdod | 3 | 2 mid-range, 1 premium |
| Ashkelon | 3 | 1 premium, 1 mid-range, 1 budget |
| Beer Sheva | 3 | 1 mid-range, 2 budget |
| Eilat | 3 | 1 premium, 1 mid-range, 1 budget |
| Efrat | 3 | 3 premium |
| Ma'ale Adumim | 3 | 2 mid-range, 1 budget |
| Givat Ze'ev | 2 | 2 mid-range |
| Gush Etzion | 3 | 2 premium, 1 mid-range |
| Caesarea | 2 | 2 ultra-premium |
| Zichron Yaakov | 3 | 3 premium |
| Pardes Hanna | 2 | 2 mid-range |
| Kiryat Tivon | 2 | 1 premium, 1 mid-range |
| Yokneam | 2 | 1 mid-range, 1 budget |
| Hadera | 3 | 2 budget, 1 mid-range |
| Nahariya | 3 | 2 mid-range, 1 budget |
| Shoham | 2 | 2 premium |

### Execution Plan

1. **Run SQL UPDATE statements** for all 30 cities using the insert tool (for data operations)
2. **Verify the updates** by querying a sample city
3. **Test the UI** by visiting a Market Environment page

### Content Quality Notes

The provided data follows the approved guidelines:
- Maximum 4 neighborhoods per city
- "Trusted friend" voice with honest trade-offs
- Price tier badges (budget, mid-range, premium, ultra-premium)
- Hebrew names included
- Anglo-relevant context where applicable
- Religious/cultural notes where helpful (e.g., "Dati Leumi", "Charedi community")

## Technical Details

The SQL updates will use the JSONB format:
```sql
UPDATE cities 
SET featured_neighborhoods = '[...]'::jsonb
WHERE slug = 'city-slug';
```

All single quotes in descriptions are already escaped with double single quotes (`''`) for SQL compatibility.
