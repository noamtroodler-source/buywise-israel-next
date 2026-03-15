

# Phase C: Listing Duplication

## What
Add a "Duplicate" action to the listing dropdown menus (both card and table views) on `AgentProperties.tsx`. Clicking it maps the existing property's data into `PropertyWizardData`, saves it to `localStorage` under `PROPERTY_WIZARD_STORAGE_KEY`, and navigates to `/agent/properties/new` — where the wizard picks it up as a pre-filled draft.

## How

### 1. Create a helper: `src/utils/duplicateProperty.ts`
- Export a function `propertyToWizardDraft(property: AgentProperty): PropertyWizardData` that maps DB property fields to `PropertyWizardData` shape
- Strips `id`, clears `images` (they belong to the original), resets price-tracking fields
- Prepends title with "Copy of " (truncated to 60 chars)
- Sets `description`, `features`, amenity booleans, lease fields, etc.

### 2. Update `AgentProperties.tsx`
- Import `Copy` icon from lucide-react and the new helper
- Add a "Duplicate" `DropdownMenuItem` **above** the Delete separator in both the card view dropdown (~line 419) and the table view dropdown (~line 579)
- On click: call `propertyToWizardDraft(listing)`, save result to `localStorage.setItem(PROPERTY_WIZARD_STORAGE_KEY, JSON.stringify(...))`, then `navigate('/agent/properties/new')`
- The existing wizard draft recovery dialog will show, letting the agent continue editing the cloned data

### Files touched
| File | Change |
|------|--------|
| `src/utils/duplicateProperty.ts` | New — mapping function |
| `src/pages/agent/AgentProperties.tsx` | Add Duplicate menu item in both views |

