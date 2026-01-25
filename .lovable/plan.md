
# Improve Price Alert Error Message for Guest Users

## The Problem

When a guest user (not signed up) clicks "Price alerts off" on a saved property, they see a generic error:

> "Failed to update alert settings"

This doesn't explain **why** it failed or **what to do** about it.

---

## The Solution

Update the error handling in `usePriceDropAlerts` to detect when the user is a guest and show a helpful, actionable message that encourages signup.

### New Message for Guests
> "Sign up to enable price alerts and get notified when prices drop!"

This message:
- Explains what they need to do (sign up)
- Highlights the benefit (get notified of price drops)
- Is friendly and non-technical

---

## Implementation

### File: `src/hooks/usePriceDropAlerts.tsx`

Update the `togglePriceAlert` mutation to differentiate between guest errors and actual failures:

**Before (lines 119-138):**
```typescript
const togglePriceAlert = useMutation({
  mutationFn: async ({ propertyId, enabled }: { propertyId: string; enabled: boolean }) => {
    if (!user) throw new Error('Must be logged in');
    
    const { error } = await supabase
      .from('favorites')
      .update({ price_alert_enabled: enabled })
      .eq('user_id', user.id)
      .eq('property_id', propertyId);

    if (error) throw error;
  },
  onSuccess: (_, { enabled }) => {
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    toast.success(enabled ? 'Price alerts enabled' : 'Price alerts disabled');
  },
  onError: () => {
    toast.error('Failed to update alert settings');
  },
});
```

**After:**
```typescript
const togglePriceAlert = useMutation({
  mutationFn: async ({ propertyId, enabled }: { propertyId: string; enabled: boolean }) => {
    if (!user) throw new Error('GUEST_USER');
    
    const { error } = await supabase
      .from('favorites')
      .update({ price_alert_enabled: enabled })
      .eq('user_id', user.id)
      .eq('property_id', propertyId);

    if (error) throw error;
  },
  onSuccess: (_, { enabled }) => {
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    toast.success(enabled ? 'Price alerts enabled' : 'Price alerts disabled');
  },
  onError: (error) => {
    if (error.message === 'GUEST_USER') {
      toast.error('Sign up to enable price alerts and get notified when prices drop!', {
        action: {
          label: 'Sign Up',
          onClick: () => window.location.href = '/auth?tab=signup',
        },
      });
    } else {
      toast.error('Failed to update alert settings');
    }
  },
});
```

---

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| Error type | Generic "Must be logged in" | Specific "GUEST_USER" marker |
| Error message | "Failed to update alert settings" | "Sign up to enable price alerts..." |
| Action | None | "Sign Up" button in toast |

---

## User Experience

### Guest clicks "Price alerts off"

**Before:**
- Toast: "Failed to update alert settings" (confusing)

**After:**
- Toast: "Sign up to enable price alerts and get notified when prices drop!"
- Action button: "Sign Up" → navigates to `/auth?tab=signup`

This aligns with the gradual engagement strategy — guests can see the feature exists, understand its value, and have a clear path to unlock it.
