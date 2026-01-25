
# Fix Google Maps API Integration Across All Pages

## Problem Summary

The Google Maps API **is working**, but several pages are missing the required `GoogleMapsProvider` wrapper. This causes the `AddressAutocomplete` component to fall back to **Nominatim (OpenStreetMap)** instead of using **Google Places**, resulting in inconsistent or lower-quality search results in certain areas.

Additionally, there's a React warning about refs that needs to be fixed.

---

## Root Cause

The `AddressAutocomplete` component checks for Google Maps availability:

```typescript
export function AddressAutocomplete(props: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  
  if (isLoaded && !loadError) {
    return <GoogleAddressAutocomplete {...props} />;  // Uses Google Places
  }
  
  return <NominatimAddressAutocomplete {...props} />;  // Fallback
}
```

When rendered **outside** a `GoogleMapsProvider`, `isLoaded` is always `false`, so it always uses the Nominatim fallback.

---

## Current Status

| Location | Has GoogleMapsProvider? | Result |
|----------|------------------------|--------|
| PropertyDetail page | Yes | Google Places works |
| ProjectDetail page | Yes | Google Places works |
| AddCoreLocationDialog | Yes | Google Places works |
| **BuyerOnboarding** | **No** | Uses Nominatim fallback |
| **NewProperty page** | **No** | Uses Nominatim fallback |
| **EditProperty page** | **No** | Uses Nominatim fallback |
| **StepBasics (Agent Wizard)** | **No** | Uses Nominatim fallback |
| **StepBasics (Developer Wizard)** | **No** | Uses Nominatim fallback |
| **AgencySettings** | **No** | Uses Nominatim fallback |
| **DeveloperSettings** | **No** | Uses Nominatim fallback |

---

## Solution

### Phase 1: Wrap Missing Pages with GoogleMapsProvider

Add the `GoogleMapsProvider` wrapper to all pages/components that use `AddressAutocomplete`:

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/onboarding/BuyerOnboarding.tsx` | Wrap the Dialog content with `GoogleMapsProvider` |
| `src/pages/agent/NewProperty.tsx` | Wrap the page content with `GoogleMapsProvider` |
| `src/pages/agent/EditProperty.tsx` | Wrap the page content with `GoogleMapsProvider` |
| `src/components/agent/wizard/steps/StepBasics.tsx` | Wrap the step content with `GoogleMapsProvider` |
| `src/components/developer/wizard/steps/StepBasics.tsx` | Wrap the step content with `GoogleMapsProvider` |
| `src/pages/agency/AgencySettings.tsx` | Wrap the settings form with `GoogleMapsProvider` |
| `src/pages/developer/DeveloperSettings.tsx` | Wrap the settings form with `GoogleMapsProvider` |

### Phase 2: Fix React Ref Warning

The console shows: "Function components cannot be given refs. Attempts to access this ref will fail."

**File to modify:**

| File | Change |
|------|--------|
| `src/components/agent/wizard/AddressAutocomplete.tsx` | Convert `GoogleAddressAutocomplete` and `NominatimAddressAutocomplete` to use `React.forwardRef` |

---

## Technical Implementation

### Example: Wrapping BuyerOnboarding

```tsx
// src/components/onboarding/BuyerOnboarding.tsx
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';

// In the Dialog content, wrap the location step:
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <GoogleMapsProvider>
    <DialogContent>
      {/* ... existing content ... */}
    </DialogContent>
  </GoogleMapsProvider>
</Dialog>
```

### Example: Wrapping NewProperty Page

```tsx
// src/pages/agent/NewProperty.tsx
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';

export default function NewProperty() {
  return (
    <Layout>
      <GoogleMapsProvider>
        {/* ... existing page content ... */}
      </GoogleMapsProvider>
    </Layout>
  );
}
```

### Example: Fixing forwardRef

```tsx
// Convert function component to forwardRef
const NominatimAddressAutocomplete = React.forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  (props, ref) => {
    // ... existing implementation ...
    return (
      <div ref={containerRef} className="relative">
        <Input ref={ref} ... />
      </div>
    );
  }
);
NominatimAddressAutocomplete.displayName = 'NominatimAddressAutocomplete';

// Same for GoogleAddressAutocomplete
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/onboarding/BuyerOnboarding.tsx` | Modify | Add GoogleMapsProvider wrapper |
| `src/pages/agent/NewProperty.tsx` | Modify | Add GoogleMapsProvider wrapper |
| `src/pages/agent/EditProperty.tsx` | Modify | Add GoogleMapsProvider wrapper |
| `src/components/agent/wizard/steps/StepBasics.tsx` | Modify | Add GoogleMapsProvider wrapper |
| `src/components/developer/wizard/steps/StepBasics.tsx` | Modify | Add GoogleMapsProvider wrapper |
| `src/pages/agency/AgencySettings.tsx` | Modify | Add GoogleMapsProvider wrapper |
| `src/pages/developer/DeveloperSettings.tsx` | Modify | Add GoogleMapsProvider wrapper |
| `src/components/agent/wizard/AddressAutocomplete.tsx` | Modify | Add forwardRef to fix React warning |

---

## Expected Results

After implementation:

1. **Google Places search** will work consistently across all forms (onboarding, property creation, settings)
2. **Better search quality** - Google Places provides more accurate Israeli address results than Nominatim
3. **No more console warnings** about refs
4. **Consistent UX** - Users will get the same search experience everywhere, not a mixed experience

---

## Why This Happened

The `GoogleMapsProvider` was intentionally lazy-loaded to optimize performance (documented in memory: `performance/google-maps-lazy-loading`). However, when new pages were added that use `AddressAutocomplete`, the provider wrapper was not included, causing the fallback behavior.
