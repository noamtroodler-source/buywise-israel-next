

# Prevent Browser Address Autofill from Blocking Google Maps Suggestions

## The Problem

Chrome's built-in address autofill popup is appearing on top of the Google Places API suggestions, blocking users from seeing the actual search results. This happens because Chrome detects the input as an "address" field and tries to help with its own saved addresses.

---

## Solution

Add stronger anti-autofill attributes to the Input component. The most effective approach combines several techniques:

1. **Use a random/obscure autocomplete value** instead of "off" (Chrome ignores "off")
2. **Add name attributes that don't trigger address detection**
3. **Wrap in a form with autocomplete="off"**

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/agent/wizard/AddressAutocomplete.tsx` | Update Input attributes in both Google and Nominatim components |

---

## Technical Implementation

### Update GoogleAddressAutocomplete Input (around line 246)

Replace current Input attributes:

```tsx
<Input
  value={inputValue}
  onChange={(e) => {
    setValue(e.target.value);
    setHasValidSelection(false);
    setSelectedIndex(-1);
    setCityMismatchError(null);
    onInputChange?.(e.target.value);
  }}
  onKeyDown={handleKeyDown}
  disabled={!ready}
  placeholder={placeholder}
  // Anti-autofill attributes
  autoComplete="new-password"  // Chrome respects this more than "off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck={false}
  data-form-type="other"
  data-lpignore="true"         // Ignore LastPass
  data-1p-ignore="true"        // Ignore 1Password
  name="notASearchField"       // Obscure name that won't trigger autofill
  className={cn(
    'h-11 rounded-xl pr-10',
    hasValidSelection && 'border-primary/50 bg-primary/5',
    className
  )}
/>
```

### Update NominatimAddressAutocomplete Input (around line 475)

Same changes for consistency:

```tsx
<Input
  value={inputValue}
  onChange={handleNominatimInputChange}
  onKeyDown={handleKeyDown}
  onFocus={() => {
    if (suggestions.length > 0) setIsOpen(true);
  }}
  placeholder={placeholder}
  // Anti-autofill attributes
  autoComplete="new-password"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck={false}
  data-form-type="other"
  data-lpignore="true"
  data-1p-ignore="true"
  name="notASearchField"
  className={cn(
    'h-11 rounded-xl pr-10',
    hasValidSelection && 'border-primary/50 bg-primary/5',
    className
  )}
/>
```

---

## Why These Attributes Work

| Attribute | Purpose |
|-----------|---------|
| `autoComplete="new-password"` | Chrome specifically respects this value and won't show autofill |
| `name="notASearchField"` | Prevents heuristic matching that detects "address" fields |
| `data-lpignore="true"` | Tells LastPass to ignore this field |
| `data-1p-ignore="true"` | Tells 1Password to ignore this field |

---

## Alternative: Wrap in Hidden Form

If the above doesn't fully work, an additional technique is to wrap the input in a form element:

```tsx
<form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
  <Input ... />
</form>
```

But typically the `autoComplete="new-password"` trick is sufficient for Chrome.

---

## Summary

1. Change `autoComplete="off"` to `autoComplete="new-password"` 
2. Add `name="notASearchField"` to avoid address field detection
3. Add `data-lpignore` and `data-1p-ignore` for password managers
4. Apply to both Google and Nominatim autocomplete inputs

