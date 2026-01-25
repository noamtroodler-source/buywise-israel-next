

# On-Brand Delete Account Dialog

## Current Issues

The Delete Account dialog uses semantic colors that violate the brand guidelines:

| Element | Current | Problem |
|---------|---------|---------|
| Title | `text-destructive` (red) | Semantic color forbidden |
| Professional warning | `text-amber-600` + yellow emoji | Amber/yellow forbidden |
| Delete button | `bg-destructive` (red) | Semantic color for action |
| Trigger hover | `hover:text-destructive` | Red hover state |

## Brand-Compliant Solution

Replace all semantic colors with the platform's **professional blue + neutrals** palette:

### Visual Changes

**Title**: Use neutral foreground text instead of red
- Change from `text-destructive` to standard `text-foreground`
- Keep the serious tone through content, not color

**Professional Account Warning**: Use primary blue tint
- Replace `text-amber-600` with `text-primary`
- Replace yellow emoji with a Lucide icon (`AlertCircle` or `Info`)
- Add subtle blue background: `bg-primary/10 p-3 rounded-md`

**Delete Button**: Use primary blue (still serious, but on-brand)
- Replace `bg-destructive` with `bg-primary hover:bg-primary/90`
- The typed confirmation "DELETE" provides sufficient safety gate

**Trigger Link**: Neutral hover state
- Replace `hover:text-destructive` with `hover:text-foreground`

### Updated Design Mockup

```text
┌────────────────────────────────────────────────┐
│  Delete Account                                │  ← Standard foreground (not red)
│                                                │
│  This action is permanent and irreversible...  │
│                                                │
│  • Your profile and account settings           │
│  • Saved properties and favorites              │
│  • Search alerts and notifications             │
│  • Property inquiries you've made              │
│  • All preferences and activity history        │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ ℹ You have a professional account...    │  │  ← Blue tint box (not amber)
│  └──────────────────────────────────────────┘  │
│                                                │
│  Type DELETE to confirm                        │
│  [____________________]                        │
│                                                │
│            [Cancel]  [Delete Account]          │  ← Blue button (not red)
└────────────────────────────────────────────────┘
```

## Technical Changes

**File: `src/components/profile/DeleteAccountDialog.tsx`**

1. **Import Lucide icon** for professional warning
   - Add `import { Loader2, Info } from 'lucide-react'`

2. **Update title styling** (line 77)
   - Remove `className="text-destructive"` or change to neutral

3. **Update professional warning** (lines 89-92)
   - Replace amber styling with blue tint box
   - Replace emoji with `<Info />` icon
   - Apply `bg-primary/10 text-primary border border-primary/20 p-3 rounded-md`

4. **Update delete button** (lines 111-124)
   - Replace `bg-destructive text-destructive-foreground hover:bg-destructive/90`
   - With `bg-primary text-primary-foreground hover:bg-primary/90`

5. **Update trigger link** (line 71)
   - Replace `hover:text-destructive` with `hover:text-foreground`

## Result

A professional, on-brand dialog that maintains the serious tone through clear messaging and confirmation requirements, without using forbidden semantic colors.

