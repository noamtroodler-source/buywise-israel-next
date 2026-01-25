
# Keep Add Location Dialog Open After Saving

## Problem

When you save a new location, the dialog closes immediately. If you want to add multiple locations in a row, you have to keep clicking "Add Location" button and the previous address stays in the field until the form refreshes.

---

## Solution

Change the behavior so that after successfully adding a location:
1. The form fields reset (name, icon, address all clear)
2. The dialog **stays open** so you can add another location
3. Add a "Done" button so users can close when finished

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/profile/AddCoreLocationDialog.tsx` | Keep dialog open after save, add success feedback, add Done button |

---

## Changes

### 1. Remove auto-close after saving (line 69)

Remove the `onOpenChange(false)` call from the success handler so the dialog stays open.

### 2. Add success feedback with toast

Import `toast` from sonner and show a quick confirmation when a location is saved, so the user knows it worked even though the dialog stays open.

### 3. Update button layout

Change from:
- "Save Location" + "Cancel"

To:
- "Add Location" (saves and clears form) + "Done" (closes dialog)

This makes it clear you can keep adding locations.

---

## Technical Implementation

**Update imports (line 2):**
```tsx
import { toast } from 'sonner';
```

**Update onSuccess handler (lines 63-70):**
```tsx
onSuccess: () => {
  // Show confirmation
  toast.success(`"${label.trim()}" saved!`);
  
  // Reset form for next entry
  setLabel('');
  setAddress('');
  setParsedAddress(null);
  setSelectedIcon('building');
  // Dialog stays open - don't call onOpenChange(false)
},
```

**Update button section (lines 167-179):**
```tsx
<div className="flex gap-2 pt-2">
  <Button
    onClick={handleSubmit}
    disabled={!canSubmit}
    className="flex-1"
  >
    {addLocation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
    Add Location
  </Button>
  <Button variant="outline" onClick={() => onOpenChange(false)}>
    Done
  </Button>
</div>
```

---

## Visual Result

| Before | After |
|--------|-------|
| Dialog closes after saving | Dialog stays open with cleared form |
| No feedback that save worked | Toast shows "Work saved!" |
| "Save Location" + "Cancel" buttons | "Add Location" + "Done" buttons |

User can now add multiple locations quickly without reopening the dialog each time.
