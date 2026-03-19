

## Rename All AI/Insight Labels to "BuyWise Take"

5 locations need updating:

### 1. `InsightCard.tsx` — Already done ✅

### 2. `CompareAISummary.tsx` (line 193-196)
- Change "Comparison AI Summary" → **"BuyWise Take"**
- Change subtitle "AI-powered analysis of your selected properties" → **"Our analysis of your selected properties"**

### 3. `PriceByApartmentSize.tsx` (line 82)
- Change `"What this means: "` → **"BuyWise Take: "**

### 4. `HistoricalPriceChart.tsx` (line 424)
- Change `"What this means: "` → **"BuyWise Take: "**

### 5. `MarketRealityTabs.tsx` (line 290)
- Change `"What This Means For You"` → **"BuyWise Take"**

### Also update footer disclaimers
- `CompareAISummary.tsx` footer: "AI-generated · Based on listed property data" → keep as-is (fine as small print)

All changes are simple text swaps — no structural or styling changes needed beyond what's already been done on InsightCard.

