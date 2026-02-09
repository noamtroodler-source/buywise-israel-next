
# Automated Exchange Rate Updates

## Overview
This plan removes manual exchange rate entry and implements an automated daily update system using the free Frankfurter API. The exchange rate will update silently in the background, and users will just see a simple note that rates are updated daily.

---

## What Changes

### User Experience
**Before:**
- "Exchange Rate" section with manual input field
- Text: "Default rate updated weekly. Enter current rate..."

**After:**
- No manual input field
- Simple note under Currency section: "Exchange rate updated daily"

### Backend
- New edge function to fetch live USD/ILS rate
- Daily cron job to automatically update the database

---

## Implementation Details

### 1. Create Edge Function: `update-exchange-rate`

```typescript
// supabase/functions/update-exchange-rate/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch live rate from Frankfurter API (free, ECB data)
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=ILS");
    const data = await response.json();
    const rate = data.rates.ILS;

    if (!rate || typeof rate !== "number") {
      throw new Error("Invalid rate received from API");
    }

    // Update database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("calculator_constants")
      .update({
        value_numeric: rate,
        updated_at: new Date().toISOString(),
      })
      .eq("constant_key", "EXCHANGE_RATE_USD_ILS")
      .eq("is_current", true);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, rate, updated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exchange rate update failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 2. Add to config.toml

```toml
[functions.update-exchange-rate]
verify_jwt = false
```

### 3. Set Up Daily Cron Job

Enable the `pg_cron` and `pg_net` extensions (if not already enabled), then schedule the job:

```sql
-- Run daily at 6:00 AM Israel time (3:00 AM UTC)
SELECT cron.schedule(
  'update-exchange-rate-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eveqhyqxdibjayliazxm.supabase.co/functions/v1/update-exchange-rate',
    headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb
  );
  $$
);
```

### 4. Simplify PreferencesContext

Remove custom rate logic since the database rate is always current:

```typescript
// Simplified context - removes isCustomRate, setExchangeRate, setIsCustomRate
interface PreferencesContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  exchangeRate: number;  // Read-only now
  areaUnit: AreaUnit;
  setAreaUnit: (u: AreaUnit) => void;
}
```

Also remove these from localStorage storage (no longer needed).

### 5. Simplify PreferencesDialog

**Remove:**
- The entire "Exchange Rate" section (lines 102-121)
- `handleRateChange` function
- `exchangeRate`, `setExchangeRate`, `isCustomRate`, `setIsCustomRate`, `defaultExchangeRate` from destructuring

**Add:**
- A subtle note under the Currency section

```tsx
{/* Currency Section */}
<div className="space-y-1">
  <h4 className="font-medium text-foreground mb-2">Currency</h4>
  <RadioOption value="ILS" selected={currency === 'ILS'} onClick={() => setCurrency('ILS')}>
    ₪ NIS
  </RadioOption>
  <RadioOption value="USD" selected={currency === 'USD'} onClick={() => setCurrency('USD')}>
    $ USD
  </RadioOption>
  <p className="text-xs text-muted-foreground mt-2 pl-1">
    Exchange rate updated daily
  </p>
</div>
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/update-exchange-rate/index.ts` | **Create** - Edge function to fetch and update rate |
| `supabase/config.toml` | **Modify** - Add function config |
| `src/contexts/PreferencesContext.tsx` | **Modify** - Remove custom rate logic |
| `src/components/layout/PreferencesDialog.tsx` | **Modify** - Remove input, add note |
| Database (pg_cron) | **Run SQL** - Set up daily schedule |

---

## Frankfurter API Details

- **URL**: `https://api.frankfurter.app/latest?from=USD&to=ILS`
- **Updates**: Daily (European Central Bank data)
- **Cost**: Free, no API key required
- **Rate limit**: Generous (no documented limit for reasonable usage)
- **Reliability**: High - maintained open-source project

Example response:
```json
{
  "amount": 1,
  "base": "USD",
  "date": "2026-02-07",
  "rates": {
    "ILS": 3.6523
  }
}
```

---

## Verification Steps

After implementation:
1. Deploy the edge function
2. Test it manually by calling the endpoint
3. Verify the database is updated
4. Set up the cron job
5. Confirm the UI shows "Exchange rate updated daily" without the input field
