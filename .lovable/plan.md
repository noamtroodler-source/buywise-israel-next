
# Auto-Add Location on Address Selection

## Summary
Remove the extra "Add Location" button click by automatically adding the location when a user selects an address from the Google Maps suggestions. If the location name is already filled, selecting an address immediately saves it and clears the form for the next entry.

---

## Current vs New Flow

**Current (3-step):**
1. Enter location name (e.g., "Mom's House")
2. Select icon
3. Search address → click suggestion
4. **Click "Add Location" button** ← extra step

**New (auto-add):**
1. Enter location name (e.g., "Mom's House")
2. Select icon  
3. Search address → click suggestion → **automatically added!** ✓
   - Form clears instantly, ready for next location

---

## Implementation

### Changes to `BuyerOnboarding.tsx`

**Modify `handleAddressSelect`** (lines 255-258):

Current:
```typescript
const handleAddressSelect = (address: ParsedAddress) => {
  setParsedAddress(address);
  setLocationAddress(address.fullAddress);
};
```

New:
```typescript
const handleAddressSelect = (address: ParsedAddress) => {
  setParsedAddress(address);
  setLocationAddress(address.fullAddress);
  
  // Auto-add if label is already filled
  if (locationLabel.trim()) {
    const newLocation: OnboardingLocation = {
      label: locationLabel.trim(),
      icon: locationIcon,
      address: address.fullAddress,
      latitude: address.latitude,
      longitude: address.longitude,
    };
    
    setOnboardingLocations(prev => [...prev, newLocation]);
    
    // Reset form for next entry
    setLocationLabel('');
    setLocationIcon('home');
    setLocationAddress('');
    setParsedAddress(null);
  }
};
```

**Remove the "Add Location" button** (lines 840-851):

Delete this entire block:
```tsx
{/* Add button */}
<Button
  type="button"
  variant="outline"
  size="sm"
  onClick={handleAddLocation}
  disabled={!locationLabel.trim() || !parsedAddress}
  className="w-full"
>
  <MapPin className="h-4 w-4 mr-2" />
  Add Location
</Button>
```

**Add helper text** explaining the auto-add behavior:

After the Address input, add a subtle hint:
```tsx
<p className="text-xs text-muted-foreground mt-1">
  Select an address to add it instantly
</p>
```

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No label entered yet | Address is stored but not auto-added. User can enter label first. |
| Label filled, click address | Instantly added, form clears |
| Max locations reached (5) | Form section hidden (existing logic) |
| User clears label after adding | Icon auto-suggests based on new label |

---

## Visual Change

**Before:**
```
┌─────────────────────────────────────────────────┐
│  Location Name: [Mom's House      ]             │
│  Icon: [🏠] [💼] [❤️] [⭐] [🏢]                 │
│  Address: [Gesson Street 6, Tel Aviv     ]      │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │     ⊙  Add Location                     │ ← GONE │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────────────────┐
│  Location Name: [Mom's House      ]             │
│  Icon: [🏠] [💼] [❤️] [⭐] [🏢]                 │
│  Address: [Search for an address...       ]     │
│  ↳ Select an address to add it instantly        │
└─────────────────────────────────────────────────┘
```

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/onboarding/BuyerOnboarding.tsx` | Modify `handleAddressSelect` to auto-add, remove "Add Location" button, add helper text |
| **Total** | **1 file** |
