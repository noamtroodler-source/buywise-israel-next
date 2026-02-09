

## Remove Sticky Navigation from Wizards and Settings Pages

### Problem
The Previous/Next navigation bar at the bottom of wizard pages is sticky (`sticky bottom-4`), causing it to float over content as you scroll. You want it to just sit naturally at the bottom of the page content, like in the second screenshot.

### Changes

Remove the `sticky bottom-4` class from the navigation container in all affected pages, so the buttons simply appear below the form content in normal document flow.

**Files to update (8 total):**

| File | Line | Change |
|------|------|--------|
| `src/pages/agent/NewPropertyWizard.tsx` | ~240 | Remove `sticky bottom-4` from navigation wrapper |
| `src/pages/agent/EditPropertyWizard.tsx` | ~397 | Remove `sticky bottom-4` from navigation wrapper |
| `src/pages/agent/NewProperty.tsx` | ~502 | Remove `sticky bottom-4` from submit wrapper |
| `src/pages/agent/AgentSettings.tsx` | ~600 | Remove `sticky bottom-4` from save bar |
| `src/pages/developer/NewProjectWizard.tsx` | ~202 | Remove `sticky bottom-4` from navigation wrapper |
| `src/pages/developer/EditProjectWizard.tsx` | ~336 | Remove `sticky bottom-4` from navigation wrapper |
| `src/pages/developer/DeveloperSettings.tsx` | ~687 | Remove `sticky bottom-4` from save bar |
| `src/pages/agency/AgencySettings.tsx` | ~781 | Remove `sticky bottom-4` from save bar |

Each change is the same: replace `className="sticky bottom-4"` (or similar) with just `className=""` or remove those two classes entirely, keeping the rest of the styling (the rounded card with backdrop blur, shadow, etc.) intact.

### Technical Detail

For each file, the change is simply:
```
// Before
<motion.div variants={itemVariants} className="sticky bottom-4">

// After
<motion.div variants={itemVariants}>
```

The navigation bar keeps its card-like appearance (border, shadow, backdrop blur) but will sit in normal flow below the form card, exactly matching the second screenshot.
