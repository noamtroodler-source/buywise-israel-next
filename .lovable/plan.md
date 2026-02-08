
# Fix Location Adding Flow - Clear Input and Handle Order Issues

## Summary
Fix two bugs in the buyer onboarding location flow:
1. The address input doesn't visually clear after adding a location
2. If user selects an address before entering a location name, they have to re-do the address search

---

## Current Problems

**Problem 1: Address doesn't clear visually**
- The `AddressAutocomplete` component manages its own internal state via `usePlacesAutocomplete`
- When parent calls `setLocationAddress('')`, it updates the prop but the internal `inputValue` in the component doesn't reset
- This is why the address stays visible even after being added

**Problem 2: Order-dependent flow is confusing**
- Current logic: Auto-add only works if `locationLabel` is already filled when address is selected
- If user types address first → it's stored but not added
- User then types a name → nothing happens, address input still shows old value
- User has to re-search the address

---

## Solution

### Part 1: Add a `reset` mechanism to AddressAutocomplete

Add a `key` prop pattern to force the component to remount and reset internal state:

```tsx
// In BuyerOnboarding.tsx
const [addressInputKey, setAddressInputKey] = useState(0);

// When we want to clear:
setAddressInputKey(prev => prev + 1);
```

```tsx
<AddressAutocomplete
  key={addressInputKey}  // Forces remount on change
  value={locationAddress}
  ...
/>
```

### Part 2: Handle address-first flow with pending state

If user selects an address without a label, store it as "pending". When they enter a label, auto-add the pending address:

```tsx
// In handleAddressSelect:
if (locationLabel.trim()) {
  // Existing auto-add logic
  addLocationAndReset(address);
} else {
  // Just store it - will be used when label is entered
  setParsedAddress(address);
  setLocationAddress(address.fullAddress);
}

// New effect to auto-add when label becomes available:
useEffect(() => {
  if (locationLabel.trim() && parsedAddress) {
    addLocationAndReset(parsedAddress);
  }
}, [locationLabel]);
```

### Part 3: Update helper text based on state

Show contextual guidance:
- No label, no address: "Enter a name, then search for the address"
- Label filled, no address: "Select an address to add it instantly"
- No label, address selected: "Now enter a name to save this location"

---

## Implementation Details

### Changes to `BuyerOnboarding.tsx`

1. **Add key state for address reset**
```typescript
const [addressInputKey, setAddressInputKey] = useState(0);
```

2. **Refactor add logic into helper function**
```typescript
const addLocationAndReset = (address: ParsedAddress) => {
  const newLocation: OnboardingLocation = {
    label: locationLabel.trim(),
    icon: locationIcon,
    address: address.fullAddress,
    latitude: address.latitude,
    longitude: address.longitude,
  };
  
  setOnboardingLocations(prev => [...prev, newLocation]);
  
  // Reset ALL form state including forcing input to remount
  setLocationLabel('');
  setLocationIcon('home');
  setLocationAddress('');
  setParsedAddress(null);
  setAddressInputKey(prev => prev + 1); // Force AddressAutocomplete to reset
};
```

3. **Update handleAddressSelect to handle both cases**
```typescript
const handleAddressSelect = (address: ParsedAddress) => {
  if (locationLabel.trim()) {
    // Label exists - add immediately
    addLocationAndReset(address);
  } else {
    // No label yet - store address as pending
    setParsedAddress(address);
    setLocationAddress(address.fullAddress);
  }
};
```

4. **Add effect to auto-add when label is entered after address**
```typescript
useEffect(() => {
  if (locationLabel.trim() && parsedAddress) {
    addLocationAndReset(parsedAddress);
  }
}, [locationLabel]);
```

5. **Update helper text to be dynamic**
```tsx
<p className="text-xs text-muted-foreground mt-1">
  {parsedAddress && !locationLabel.trim()
    ? "Now enter a name above to save this location"
    : "Select an address to add it instantly"}
</p>
```

6. **Apply key to AddressAutocomplete**
```tsx
<AddressAutocomplete
  key={addressInputKey}
  value={locationAddress}
  onAddressSelect={handleAddressSelect}
  onInputChange={setLocationAddress}
  placeholder="Search for an address..."
/>
```

---

## User Flow After Fix

**Flow A: Name first (preferred)**
1. Type "Mom's House" → icon auto-selects 🏠
2. Search "Gissin Street 6" → click suggestion
3. ✅ Location added instantly, form clears completely

**Flow B: Address first (now works)**
1. Search "Gissin Street 6" → click suggestion
2. Address shows in input, helper says "Now enter a name above..."
3. Type "Mom's House"
4. ✅ Location added instantly, form clears completely

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/onboarding/BuyerOnboarding.tsx` | Add key-based reset, refactor add logic, handle address-first flow, dynamic helper text |
| **Total** | **1 file** |
