

# Fix Saves Count Not Updating When Saving Properties

## Root Cause Identified

The network requests reveal the actual problem:

```text
POST guest_property_saves → 401 Error
Response: "new row violates row-level security policy for table \"guest_property_saves\""
```

**The save is failing at the database level** - the RLS (Row Level Security) policy is blocking guest inserts. Even though the query invalidation code is working correctly (the saves count IS being re-fetched), the count stays at 0 because the save never actually persisted to the database.

## Why the RLS Policy Fails

The current RLS policy tries to read a custom HTTP header:

```sql
guest_id = (current_setting('request.headers', true)::json ->> 'x-guest-id')
```

**Problem**: Supabase's PostgREST doesn't automatically forward custom headers like `x-guest-id` to be accessible via `current_setting('request.headers')`. Only certain standard headers are forwarded. This means the policy always evaluates the header as `NULL`, causing the check to fail.

The table `guest_property_saves` currently has **zero rows** - no guest save has ever been successfully recorded.

## Solution: Use an Edge Function for Guest Saves

Instead of relying on custom headers + RLS (which doesn't work reliably), we'll use an Edge Function with the service role key to handle guest saves securely.

### Implementation Plan

#### Step 1: Create Edge Function `guest-save-property`

**File**: `supabase/functions/guest-save-property/index.ts`

This function will:
- Accept `{ propertyId, guestId, action: 'save' | 'unsave' }` in the request body
- Validate the guest ID format (must be a valid UUID)
- Use the service role key to insert/delete from `guest_property_saves`
- Return success/failure status

```typescript
// Pseudocode structure:
if (action === 'save') {
  await supabaseAdmin.from('guest_property_saves').upsert(...)
} else {
  await supabaseAdmin.from('guest_property_saves').delete().match(...)
}
```

#### Step 2: Update `useFavorites` Hook

**File**: `src/hooks/useFavorites.tsx`

Replace the direct Supabase calls for guests with Edge Function calls:

```typescript
// Before (broken):
const guestClient = createGuestClient(guestId);
await guestClient.from('guest_property_saves').upsert(...);

// After (working):
await fetch('/functions/v1/guest-save-property', {
  method: 'POST',
  body: JSON.stringify({ propertyId, guestId, action: 'save' })
});
```

#### Step 3: Simplify RLS Policies

**Database migration** to update RLS on `guest_property_saves`:

- Remove the complex header-based INSERT policy (it doesn't work)
- Keep a simple DELETE policy (or remove if all operations go through the edge function)
- The edge function uses service role, so RLS is bypassed for authorized operations

#### Step 4: (Optional) Remove `guestClient.ts`

If no longer needed after this change, clean up the unused guest client file.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/guest-save-property/index.ts` | **New** - Edge function to handle guest saves |
| `src/hooks/useFavorites.tsx` | Replace guest DB calls with edge function calls |
| Database migration | Update RLS policies on `guest_property_saves` |
| `src/integrations/supabase/guestClient.ts` | Delete if unused |

## Expected Result

After this fix:
1. Guest clicks save → Edge function inserts row → Success
2. Query invalidation triggers → `get_property_saves_count` re-fetches
3. Count updates from 0 → 1 (or 25 → 26, etc.)
4. UI reactively shows the new count

## Technical Details

### Edge Function Implementation

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const { propertyId, guestId, action } = await req.json();
  
  // Validate guestId is a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(guestId)) {
    return new Response(JSON.stringify({ error: 'Invalid guest ID' }), { status: 400 });
  }
  
  if (action === 'save') {
    const { error } = await supabaseAdmin
      .from('guest_property_saves')
      .upsert({ property_id: propertyId, guest_id: guestId }, { onConflict: 'property_id,guest_id' });
    // ...
  } else if (action === 'unsave') {
    const { error } = await supabaseAdmin
      .from('guest_property_saves')
      .delete()
      .eq('property_id', propertyId)
      .eq('guest_id', guestId);
    // ...
  }
});
```

### Updated useFavorites Hook (Guest Path)

```typescript
if (!user) {
  // Update local state
  setGuestFavorites(current => [...]);
  
  // Persist to backend via edge function
  const guestId = getOrCreateGuestId();
  await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guest-save-property`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ propertyId, guestId, action: 'save' })
  });
  return;
}
```

## Security Considerations

- The edge function validates the guest ID format (must be UUID)
- Rate limiting can be added if needed
- The guest ID is stored in localStorage on the client, making it persistent but anonymous
- Service role key is never exposed to the client

