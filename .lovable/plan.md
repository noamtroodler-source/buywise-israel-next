

## Plan: Enforce Required Fields in Property Listing Wizard

### What Changes

Update the `canGoNext` validation logic in `PropertyWizardContext.tsx` to enforce these fields:

**Step 1 (Details) — case 1:**
- `size_sqm > 0` required for all non-land properties
- `floor` and `total_floors` required for apartment types (apartment, penthouse, mini_penthouse, duplex, garden_apartment)

**Step 2 (Features) — case 2:**
- `furnished_status` must be set (all listings)
- `pets_policy` must be set (all listings)
- `lease_term` must be set (rentals only)
- `entry_date` must be set if `is_immediate_entry` is false

**Step 4 (Description) — case 4:**
- `description.length >= 100` (enforce the existing 100-char visual hint as a hard requirement)

### File to Edit

`src/components/agent/wizard/PropertyWizardContext.tsx` — update the `canGoNext` switch cases:

```typescript
case 1: // Details
  if (data.property_type === 'land') {
    return (data.lot_size_sqm ?? 0) > 0;
  }
  const needsFloor = ['apartment','penthouse','mini_penthouse','duplex','garden_apartment'].includes(data.property_type);
  return data.bedrooms >= 0 && data.bathrooms >= 0 
    && (data.size_sqm ?? 0) > 0
    && (!needsFloor || (data.floor !== undefined && data.total_floors !== undefined));

case 2: // Features
  const baseValid = !!data.furnished_status && !!data.pets_policy;
  const rentalValid = data.listing_status !== 'for_rent' || !!data.lease_term;
  const entryValid = data.is_immediate_entry || !!data.entry_date;
  return baseValid && rentalValid && entryValid;

case 4: // Description
  return data.description.length >= 100;
```

### Visual Feedback

Add required asterisks (`*`) to the labels in:
- `StepDetails.tsx` — Size, Floor, Total Floors labels
- `StepFeatures.tsx` — Furnished Status, Pets Policy, Lease Term, Entry Date labels
- `StepDescription.tsx` — update the character count hint to say "Minimum 100 characters required"

