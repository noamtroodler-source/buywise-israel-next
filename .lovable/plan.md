
# Fix Missing "Price vs City Avg" and "12-Month Change" in Compare View

## The Problem

The Investment Metrics section shows "—" (dashes) for these two metrics because the Compare page is using the wrong data source.

| Metric | Current Source | Problem |
|--------|---------------|---------|
| Price vs City Avg | `market_data` table | Only has 9 cities; many properties don't match |
| 12-Month Change | `market_data.price_change_percent` | This column is **NULL for all rows** |

## The Solution

Switch to using the `cities` table, which already has all the data populated:

| Field | Cities Covered | Sample Data |
|-------|----------------|-------------|
| `cities.average_price_sqm` | 35+ cities | ₪35,211 (Ra'anana), ₪11,470 (Beer Sheva), etc. |
| `cities.yoy_price_change` | 35+ cities | +13.7% (Caesarea), -8.4% (Ashkelon), +0.5% (Modi'in), etc. |

---

## File to Update

| File | Changes |
|------|---------|
| `src/pages/Compare.tsx` | Add fetch for `cities` table; update metric functions |

---

## Technical Changes

### 1. Add Cities State and Interface

Add a new state variable and interface to hold city data:

```tsx
interface CityData {
  name: string;
  average_price_sqm: number | null;
  yoy_price_change: number | null;
}

const [cityData, setCityData] = useState<CityData[]>([]);
```

### 2. Update the Data Fetch

In the `useEffect`, add a query to fetch from `cities` table:

```tsx
const [rentalResult, marketResult, citiesResult] = await Promise.all([
  supabase.from('rental_prices').select('*').in('city', cities),
  supabase.from('market_data').select('*').in('city', cities).order('year', { ascending: false }),
  supabase.from('cities').select('name, average_price_sqm, yoy_price_change')
]);

if (citiesResult.data) setCityData(citiesResult.data);
```

### 3. Update `getPriceVsCityAvg` Function

Change from `marketData` to `cityData`:

```tsx
const getPriceVsCityAvg = (property: Property) => {
  const city = cityData.find(c => c.name.toLowerCase() === property.city.toLowerCase());
  if (city?.average_price_sqm && property.size_sqm) {
    const propertyPricePerSqm = property.price / property.size_sqm;
    const diff = ((propertyPricePerSqm - city.average_price_sqm) / city.average_price_sqm) * 100;
    const prefix = diff >= 0 ? '+' : '';
    return `${prefix}${diff.toFixed(0)}% vs avg`;
  }
  return '—';
};
```

### 4. Update `getPriceChange` Function

Change from `marketData.price_change_percent` to `cityData.yoy_price_change`:

```tsx
const getPriceChange = (property: Property) => {
  const city = cityData.find(c => c.name.toLowerCase() === property.city.toLowerCase());
  if (city?.yoy_price_change !== null && city?.yoy_price_change !== undefined) {
    const prefix = city.yoy_price_change >= 0 ? '+' : '';
    return `${prefix}${city.yoy_price_change.toFixed(1)}%`;
  }
  return '—';
};
```

### 5. Update Dependencies

Add `cityData` to the `useMemo` dependency array for `investorRows`:

```tsx
], [rentalData, marketData, cityData]);
```

---

## Result

After this fix:

| Before | After |
|--------|-------|
| Price vs City Avg: — | Price vs City Avg: +12% vs avg |
| 12-Month Change: — | 12-Month Change: +2.4% |

Both metrics will now display real data from the `cities` table, which has comprehensive coverage for all 35+ supported cities.
